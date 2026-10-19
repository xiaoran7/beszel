import { memo, useMemo } from "react"
import {
	ServerIcon,
	GlobeIcon,
	ArrowUpIcon,
	ArrowDownIcon,
	ActivityIcon,
	ClockIcon,
	RadioIcon,
	CpuIcon,
	HardDriveIcon,
} from "lucide-react"
import { SystemStatus } from "@/lib/enums"
import {
	formatBytes,
	secondsToUptimeString,
	getServerPublicIp,
	getServerLocation,
	cn,
} from "@/lib/utils"
import type { SystemRecord, NetworkMonitorRecord, SystemDetailsRecord } from "@/types"
import type { RealtimeSystemMetrics } from "@/lib/use-realtime-systems"
import { $router, navigate } from "../router"
import { getPagePath } from "@nanostores/router"
import { ActionsButton } from "../systems-table/systems-table-columns"
import AlertButton from "../alerts/alert-button"

interface SegmentedBlockBarProps {
	label: string
	value: number
	detail?: string
	segments?: number
	isOnline: boolean
	type?: "cpu" | "memory" | "disk" | "gpu" | "quota"
}

/**
 * Segmented discrete LED block progress bar (Aozora HUD aesthetic)
 */
const SegmentedBlockBar = memo(function SegmentedBlockBar({
	label,
	value,
	detail,
	segments = 10,
	isOnline,
	type = "cpu",
}: SegmentedBlockBarProps) {
	const clampedValue = Math.min(100, Math.max(0, value))
	const filledCount = isOnline ? Math.round((clampedValue / 100) * segments) : 0

	// Determine color scheme based on utilization threshold
	const activeColorClass = useMemo(() => {
		if (type === "gpu") {
			return "bg-pink-500 dark:bg-pink-400 dark:shadow-[0_0_8px_rgba(236,72,153,0.5)]"
		}
		if (clampedValue < 60) {
			return "bg-sky-500 dark:bg-sky-400 dark:shadow-[0_0_8px_rgba(56,189,248,0.5)]"
		}
		if (clampedValue < 85) {
			return "bg-amber-500 dark:bg-amber-400 dark:shadow-[0_0_8px_rgba(251,191,36,0.5)]"
		}
		return "bg-rose-500 dark:bg-rose-400 dark:shadow-[0_0_8px_rgba(251,113,133,0.5)]"
	}, [clampedValue, type])

	const textColorClass = useMemo(() => {
		if (!isOnline) return "text-muted-foreground"
		if (type === "gpu") return "text-pink-600 dark:text-pink-400"
		if (clampedValue < 60) return "text-sky-600 dark:text-sky-400"
		if (clampedValue < 85) return "text-amber-600 dark:text-amber-400"
		return "text-rose-600 dark:text-rose-400"
	}, [isOnline, clampedValue, type])

	return (
		<div className="flex flex-col gap-1.5 w-full">
			<div className="flex items-center justify-between text-xs">
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<span className="font-mono font-bold text-foreground tracking-tight shrink-0 uppercase text-[11px]">
						{label}
					</span>
					{detail && (
						<span className="text-[11px] text-muted-foreground font-medium truncate">
							{detail}
						</span>
					)}
				</div>
				<span className={cn("font-mono font-bold tabular-nums text-xs shrink-0 ml-2", textColorClass)}>
					{isOnline ? `${clampedValue.toFixed(1)}%` : "—"}
				</span>
			</div>

			{/* Discrete Segments Row */}
			<div className="flex items-center gap-1 sm:gap-1.5 w-full">
				{Array.from({ length: segments }).map((_, idx) => {
					const isFilled = idx < filledCount
					let segmentColor = activeColorClass

					// Multi-step quota coloring for network quota bar
					if (type === "quota" && isFilled) {
						if (idx >= 8) {
							segmentColor = "bg-rose-500 dark:bg-rose-400 dark:shadow-[0_0_8px_rgba(251,113,133,0.5)]"
						} else if (idx >= 6) {
							segmentColor = "bg-amber-500 dark:bg-amber-400 dark:shadow-[0_0_8px_rgba(251,191,36,0.5)]"
						} else {
							segmentColor = "bg-sky-500 dark:bg-sky-400 dark:shadow-[0_0_8px_rgba(56,189,248,0.5)]"
						}
					}

					return (
						<div
							key={idx}
							className={cn(
								"h-2 sm:h-2.5 flex-1 rounded-[3px] transition-all duration-300",
								isFilled
									? segmentColor
									: "bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/40 dark:border-slate-700/50"
							)}
						/>
					)
				})}
			</div>
		</div>
	)
})

interface DenseServerCardProps {
	system: SystemRecord
	monitors?: NetworkMonitorRecord[]
	realtime?: RealtimeSystemMetrics
	details?: SystemDetailsRecord
}

export const DenseServerCard = memo(function DenseServerCard({
	system,
	monitors = [],
	realtime,
	details,
}: DenseServerCardProps) {
	const isOnline = system.status === SystemStatus.Up
	const isPaused = system.status === SystemStatus.Paused

	// Raw stats: prefer the per-second realtime payload, fall back to the 60s record
	const liveStats = isOnline ? realtime?.stats : undefined
	const liveInfo = isOnline ? realtime?.info : undefined
	const cpu = isOnline ? (liveStats?.cpu ?? system.info?.cpu ?? system.info?.cpu_percent ?? system.info?.c_p ?? 0) : 0
	const memory = isOnline ? (liveStats?.mp ?? system.info?.mp ?? 0) : 0
	const disk = isOnline ? (liveStats?.dp ?? system.info?.dp ?? 0) : 0
	// GPU: 0 is a valid idle reading, so only null/undefined means "no GPU reported"
	const gpu = isOnline
		? (liveInfo?.g ??
			(liveStats?.g ? Math.max(...Object.values(liveStats.g).map((d) => d.u ?? 0)) : system.info?.g) ??
			null)
		: null

	// Geographic Location & Flag
	const location = useMemo(() => {
		return getServerLocation(system.host, system.name)
	}, [system.host, system.name])

	// Public IP
	const publicIp = useMemo(() => {
		return getServerPublicIp(system.host)
	}, [system.host])

	// Subtitle Host
	const subtitle = useMemo(() => {
		if (system.host) {
			return system.port ? `${system.host}:${system.port}` : system.host
		}
		return "Node"
	}, [system.host, system.port])

	// Network protocol tag (Tailnet, IPv4, IPv6)
	const networkProtocols = useMemo(() => {
		const tags: string[] = []
		if (system.host?.startsWith("100.")) {
			tags.push("Tailnet")
		}
		if (publicIp) {
			tags.push(publicIp.includes(":") ? "IPv6" : "IPv4")
		} else if (system.host) {
			tags.push(system.host.includes(":") ? "IPv6" : "IPv4")
		}
		return tags
	}, [system.host, publicIp])

	// Core / thread count: modern agents report these via system_details only
	const cores = details?.cores || system.info?.c
	const threads = details?.threads || system.info?.t

	// CPU Brand / Core Detail
	const cpuBrand = useMemo(() => {
		const m = details?.cpu || system.info?.m
		if (!m) return "CPU"
		if (m.includes("EPYC")) return "AMD EPYC"
		if (m.includes("Ryzen")) return "AMD Ryzen"
		if (m.includes("Xeon")) return "Intel Xeon"
		if (m.includes("Intel")) return "Intel"
		if (m.includes("Apple") || m.includes("M1") || m.includes("M2") || m.includes("M3") || m.includes("M4")) return "Apple Silicon"
		if (m.includes("ARM") || m.includes("aarch64")) return "ARM64"
		return m.slice(0, 16)
	}, [details?.cpu, system.info?.m])

	// Memory usage detail
	const memDetail = useMemo(() => {
		if (!isOnline) return "Memory"
		return `Usage ${memory.toFixed(1)}%`
	}, [isOnline, memory])

	// Disk usage detail
	const diskDetail = useMemo(() => {
		if (!isOnline) return "Root FS"
		return `Root FS · Usage ${disk.toFixed(1)}%`
	}, [isOnline, disk])

	// Load Average
	const loadAverage = useMemo(() => {
		if (!isOnline) return null
		const la = liveStats?.la ?? liveInfo?.la ?? system.info?.la
		return la && la.length ? la : null
	}, [isOnline, liveStats?.la, liveInfo?.la, system.info?.la])

	// Load Level Badge
	const loadLevel = useMemo(() => {
		if (!loadAverage) return null
		const loadCores = cores || threads || 1
		const normalized = loadAverage[0] / loadCores
		if (normalized < 0.7) return { label: "Optimal", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
		if (normalized < 1.0) return { label: "Normal", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20" }
		return { label: "Heavy", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" }
	}, [loadAverage, cores, threads])

	// Bidirectional Network Rates & Cumulative Traffic
	const networkTelemetry = useMemo(() => {
		if (!isOnline) {
			return {
				upRate: "—",
				downRate: "—",
				totalTraffic: "—",
				bandwidthPercent: 0,
			}
		}

		// Real per-second up/down split from the agent: stats.b = [sent bytes/s, recv bytes/s]
		let sentBytesPerSec = 0
		let recvBytesPerSec = 0
		if (liveStats?.b && (liveStats.b[0] || liveStats.b[1])) {
			sentBytesPerSec = liveStats.b[0]
			recvBytesPerSec = liveStats.b[1]
		} else if (system.info?.bb) {
			// Record only stores the combined rate; keep the historical 35/65 split
			sentBytesPerSec = Math.round(system.info.bb * 0.35)
			recvBytesPerSec = Math.round(system.info.bb * 0.65)
		} else if (system.info?.b) {
			const bytesPerSec = (system.info.b * 1024 * 1024) / 60
			sentBytesPerSec = Math.round(bytesPerSec * 0.35)
			recvBytesPerSec = Math.round(bytesPerSec * 0.65)
		}

		const formatRate = (bytes: number) => {
			const { value, unit } = formatBytes(bytes, true)
			return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${unit}`
		}

		// Cumulative traffic: sum per-interface totals when available, else estimate from rate and uptime
		const uptimeSeconds = liveInfo?.u ?? system.info?.u ?? 0
		let cumulativeBytes = 0
		if (liveStats?.ni) {
			for (const totals of Object.values(liveStats.ni)) {
				cumulativeBytes += (totals?.[2] ?? 0) + (totals?.[3] ?? 0)
			}
		}
		if (!cumulativeBytes) {
			const rate = sentBytesPerSec + recvBytesPerSec
			cumulativeBytes = Math.max(
				1024 * 1024 * 1024,
				rate * 3600 * Math.min(Math.max(uptimeSeconds / 3600, 1), 720)
			)
		}
		const totalFormatted = formatBytes(cumulativeBytes, false)

		const combinedRate = sentBytesPerSec + recvBytesPerSec
		const bandwidthPercent = Math.min(
			100,
			Math.max(combinedRate > 0 ? 4 : 0, Math.round((Math.log10(Math.max(1024, combinedRate)) / 7) * 100))
		)

		return {
			upRate: formatRate(sentBytesPerSec),
			downRate: formatRate(recvBytesPerSec),
			totalTraffic: `${totalFormatted.value >= 100 ? totalFormatted.value.toFixed(0) : totalFormatted.value.toFixed(1)} ${totalFormatted.unit}`,
			bandwidthPercent,
		}
	}, [isOnline, liveStats?.b, liveStats?.ni, liveInfo?.u, system.info?.bb, system.info?.b, system.info?.u])

	// Uptime String
	const uptimeString = useMemo(() => {
		const uptime = liveInfo?.u ?? system.info?.u
		if (!isOnline) return "—"
		if (!uptime) return "Active"
		return secondsToUptimeString(uptime)
	}, [isOnline, liveInfo?.u, system.info?.u])

	// Live monitor latency from the realtime payload, keyed by monitor id
	const liveMonitorStats = isOnline ? realtime?.Monitors : undefined

	// Filter monitors for this system
	const systemMonitors = useMemo(() => {
		return monitors.filter((m) => m.system === system.id && m.enabled).slice(0, 3)
	}, [monitors, system.id])

	// Deterministic Anime Banner Art selection
	const bannerImage = useMemo(() => {
		const banners = [
			"/assets/skyline_strip_blended.png",
			"/assets/city_hk.png",
			"/assets/skyline_bridge.png",
			"/assets/city_sysinfo.png",
		]
		let hash = 0
		for (let i = 0; i < system.id.length; i++) {
			hash = (hash + system.id.charCodeAt(i)) % banners.length
		}
		return banners[hash]
	}, [system.id])

	// OS Info
	const osString = useMemo(() => {
		if (details?.os_name) return details.os_name
		if (system.info?.os) return `Linux ${system.info.os}`
		if (system.info?.o) return system.info.o
		return "Linux"
	}, [details?.os_name, system.info?.os, system.info?.o])

	// Tags
	const tags = useMemo(() => {
		const t: string[] = []
		t.push(osString)
		if (cpuBrand) t.push(cpuBrand)
		if (cores) t.push(`${cores} Cores`)
		if (details?.podman ?? system.info?.p) t.push("Podman")
		else t.push("Docker")
		if (system.info?.sv) t.push(`Systemd (${system.info.sv[0]})`)
		if (gpu !== null) t.push("GPU")
		return t
	}, [osString, cpuBrand, cores, details?.podman, system.info?.p, system.info?.sv, gpu])

	const handleCardClick = () => {
		navigate(getPagePath($router, "system", { id: system.id }))
	}

	return (
		<div
			onClick={handleCardClick}
			className="group relative flex flex-col justify-between rounded-3xl bg-card border border-border/80 hover:border-sky-400/60 hover:shadow-lg hover:shadow-sky-500/8 transition-all duration-200 select-none cursor-pointer overflow-hidden"
			style={{ transform: "translateZ(0)", willChange: "transform" }}
		>
			{/* Top Anime Header Banner with Smooth Downward Gradient Mask */}
			<div className="relative h-22 w-full overflow-hidden shrink-0">
				<img
					src={bannerImage}
					alt=""
					className="w-full h-full object-cover object-center pointer-events-none transition-all duration-300
						dark:opacity-35
						dark:brightness-[0.55]
						dark:contrast-[1.15]
						[mask-image:linear-gradient(to_bottom,black_30%,transparent_100%)]"
				/>
				{/* Dark mode nocturnal ambient blend */}
				<div className="absolute inset-0 bg-gradient-to-b from-sky-950/25 via-background/40 to-card pointer-events-none" />

				{/* Header Overlay Controls: Country Pill, Protocol Badges, Status & Actions */}
				<div className="absolute inset-0 p-3.5 flex items-start justify-between z-10">
					{/* Left: Location & Network Protocol Pills */}
					<div className="flex items-center gap-1.5 flex-wrap max-w-[65%]">
						<span
							className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background/85 dark:bg-slate-900/85 border border-border/80 text-[10px] font-extrabold text-foreground shadow-2xs backdrop-blur-none"
							title={location.city}
						>
							<span className="text-xs">{location.flag}</span>
							<span>{location.code}</span>
							<span className="text-muted-foreground/60">·</span>
							<span className="truncate max-w-[80px]">{location.city}</span>
						</span>

						{networkProtocols.map((proto, idx) => (
							<span
								key={idx}
								className="px-2 py-0.5 rounded-full bg-background/80 dark:bg-slate-900/80 border border-border/70 text-[9px] font-bold text-sky-600 dark:text-sky-400 shadow-2xs backdrop-blur-none"
							>
								{proto}
							</span>
						))}
					</div>

					{/* Right: Status Badge & Actions */}
					<div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
						<span
							className={cn(
								"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight uppercase shadow-2xs shrink-0",
								isOnline
									? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
									: isPaused
									? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
									: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
							)}
						>
							<span
								className={cn(
									"size-1.5 rounded-full shrink-0",
									isOnline ? "bg-emerald-500 animate-pulse" : isPaused ? "bg-amber-500" : "bg-rose-500"
								)}
							/>
							<span>{isOnline ? "ONLINE" : isPaused ? "PAUSED" : "OFFLINE"}</span>
						</span>

						<div className="flex items-center gap-1 text-muted-foreground [&_button]:size-6.5 [&_button]:p-0 [&_svg]:size-3.5">
							<AlertButton system={system} />
							<ActionsButton system={system} />
						</div>
					</div>
				</div>
			</div>

			{/* Card Body Content */}
			<div className="p-4 pt-1 flex flex-col flex-1 justify-between gap-3.5">
				{/* 1. Server Name & Public / Mesh IP Identity */}
				<div>
					<div className="flex items-baseline justify-between gap-2">
						<h3 className="text-[16px] font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors truncate leading-snug">
							{system.name}
						</h3>
						{system.info?.v && (
							<span className="text-[10px] font-mono font-semibold text-muted-foreground/80 shrink-0">
								v{system.info.v}
							</span>
						)}
					</div>

					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium truncate mt-0.5">
						{publicIp && (
							<span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold shrink-0" title={`Public: ${publicIp}`}>
								<GlobeIcon className="size-3 shrink-0" />
								<span className="tabular-nums font-mono">{publicIp}</span>
							</span>
						)}
						{publicIp && <span className="text-muted-foreground/40 shrink-0">·</span>}
						<span className="truncate tabular-nums font-mono text-[11px]" title={`Host: ${subtitle}`}>
							{subtitle}
						</span>
					</div>
				</div>

				{/* 2. High-Density Segmented Block Progress Bars (CPU, RAM, DISK, GPU) */}
				<div className="flex flex-col gap-3 p-3 rounded-2xl bg-secondary/35 dark:bg-slate-900/35 border border-border/50">
					<SegmentedBlockBar
						label="CPU"
						value={Number(cpu) || 0}
						detail={`${cores ?? "—"} Cores · ${cpuBrand}`}
						isOnline={isOnline}
						type="cpu"
					/>
					<SegmentedBlockBar
						label="RAM"
						value={Number(memory) || 0}
						detail={memDetail}
						isOnline={isOnline}
						type="memory"
					/>
					<SegmentedBlockBar
						label="DISK"
						value={Number(disk) || 0}
						detail={diskDetail}
						isOnline={isOnline}
						type="disk"
					/>
					{gpu !== null && (
						<SegmentedBlockBar
							label="GPU"
							value={Number(gpu) || 0}
							detail="Hardware Acceleration"
							isOnline={isOnline}
							type="gpu"
						/>
					)}

					{/* Load Average Micro-HUD */}
					{loadAverage && (
						<div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
							<div className="flex items-center gap-1.5 text-muted-foreground">
								<ActivityIcon className="size-3 text-sky-500 shrink-0" />
								<span className="font-mono font-semibold text-foreground">Load Avg</span>
								<span className="font-mono tabular-nums text-muted-foreground">
									{loadAverage.map((v) => v.toFixed(2)).join(" · ")}
								</span>
							</div>
							{loadLevel && (
								<span className={cn("px-2 py-0.2 rounded-full text-[9px] font-bold border", loadLevel.color)}>
									{loadLevel.label}
								</span>
							)}
						</div>
					)}
				</div>

				{/* 3. Bidirectional Real-time Bandwidth & Cumulative Traffic Box */}
				<div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-secondary/25 dark:bg-slate-900/25 border border-border/40">
					<div className="grid grid-cols-2 gap-2 text-xs">
						{/* Real-time Outbound / Upload */}
						<div className="flex items-center gap-1.5 min-w-0">
							<div className="flex items-center justify-center size-5.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
								<ArrowUpIcon className="size-3" strokeWidth={2.5} />
							</div>
							<div className="flex flex-col min-w-0">
								<span className="text-[10px] text-muted-foreground font-medium">Out (↑)</span>
								<span className="font-mono font-bold text-foreground tabular-nums text-[11px] truncate">
									{networkTelemetry.upRate}
								</span>
							</div>
						</div>

						{/* Real-time Inbound / Download */}
						<div className="flex items-center gap-1.5 min-w-0">
							<div className="flex items-center justify-center size-5.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
								<ArrowDownIcon className="size-3" strokeWidth={2.5} />
							</div>
							<div className="flex flex-col min-w-0">
								<span className="text-[10px] text-muted-foreground font-medium">In (↓)</span>
								<span className="font-mono font-bold text-foreground tabular-nums text-[11px] truncate">
									{networkTelemetry.downRate}
								</span>
							</div>
						</div>
					</div>

					{/* Traffic Quota / Capacity Segmented Bar */}
					<div className="pt-1.5 border-t border-border/30">
						<SegmentedBlockBar
							label="Throughput"
							value={networkTelemetry.bandwidthPercent}
							detail={`Σ ${networkTelemetry.totalTraffic}`}
							segments={10}
							isOnline={isOnline}
							type="quota"
						/>
					</div>
				</div>

				{/* 4. Multi-Carrier / Network Latency & Quality Matrix */}
				<div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-secondary/20 dark:bg-slate-900/20 border border-border/40">
					<div className="flex items-center justify-between text-[11px]">
						<div className="flex items-center gap-1 text-muted-foreground font-semibold">
							<RadioIcon className="size-3 text-sky-500 shrink-0" />
							<span>Network Latency Matrix</span>
						</div>
						<span className="text-[10px] text-muted-foreground/70">
							{systemMonitors.length > 0
								? `${systemMonitors.length} ${systemMonitors.length === 1 ? "Probe" : "Probes"}`
								: "No Probes"}
						</span>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
						{systemMonitors.length > 0 ? (
							systemMonitors.map((mon) => {
								// Prefer the per-second probe result; fall back to the 60s record
								const live = liveMonitorStats?.[mon.id]
								const latencyUs = live?.res_avg ?? mon.res
								const latencyMs = Math.round(latencyUs / 1000)
								const loss = live ? Math.round(live.loss * 10) / 10 : (mon.loss1h || 0)
								const isHealthy = loss === 0
								return (
									<div
										key={mon.id}
										className="flex items-center justify-between px-2 py-1 rounded-lg bg-background/60 dark:bg-slate-900/60 border border-border/40 text-[10px]"
									>
										<span className="font-medium text-foreground truncate max-w-[85px]" title={mon.target}>
											{mon.target}
										</span>
										<div className="flex items-center gap-1 font-mono tabular-nums shrink-0">
											<span
												className={cn(
													"size-1.5 rounded-full shrink-0",
													isHealthy ? "bg-emerald-500" : loss < 20 ? "bg-amber-500" : "bg-rose-500"
												)}
											/>
											<span className="font-semibold text-foreground">
												{latencyUs ? `${latencyMs}ms` : "—"}
											</span>
											<span className="text-[9px] text-muted-foreground">({loss}%)</span>
										</div>
									</div>
								)
							})
						) : (
							/* No probes configured: report the realtime stream's own state instead of inventing latency */
							<div className="col-span-full flex items-center justify-between px-2.5 py-1 rounded-lg bg-background/60 dark:bg-slate-900/60 border border-border/40 text-[10px]">
								<div className="flex items-center gap-1.5">
									<span
										className={cn(
											"size-1.5 rounded-full shrink-0",
											realtime ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
										)}
									/>
									<span className="text-muted-foreground font-medium">
										{realtime ? "Live telemetry" : "Awaiting telemetry"}
									</span>
								</div>
								<span className="font-mono tabular-nums text-muted-foreground/70">
									{realtime ? "1s interval" : "No probes configured"}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* 5. Footer: Uptime & System Architecture Tags */}
				<div className="pt-2 border-t border-border/50 flex flex-col gap-2">
					<div className="flex items-center justify-between text-xs">
						<div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
							<ClockIcon className="size-3 text-sky-500" />
							<span>Uptime:</span>
							<span className="font-bold text-foreground font-mono tabular-nums" title={uptimeString}>
								{uptimeString}
							</span>
						</div>

						<span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/80">
							{osString}
						</span>
					</div>

					{/* Micro-tags */}
					<div className="flex items-center gap-1 flex-wrap">
						{tags.map((tag, idx) => (
							<span
								key={idx}
								className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors"
							>
								{tag}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	)
})
