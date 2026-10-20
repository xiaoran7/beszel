import { memo, useMemo } from "react"
import type { ComponentType } from "react"
import {
	GlobeIcon,
	ArrowUpIcon,
	ArrowDownIcon,
	ClockIcon,
	RadioIcon,
	CpuIcon,
	MemoryStickIcon,
	HardDriveIcon,
	GaugeIcon,
} from "lucide-react"
import {
	formatBytes,
	formatMicroseconds,
	secondsToUptimeString,
	getServerPublicIp,
	getServerLocation,
	cn,
} from "@/lib/utils"
import { Unit } from "@/lib/enums"
import { $userSettings } from "@/lib/stores"
import { useStore } from "@nanostores/react"
import {
	deriveSystemCardStats,
	formatSpecChip,
	getCpuBrandLabel,
	loadLevel,
	loadPercent,
	type RealtimeSystemMetrics,
} from "@/lib/system-card-stats"
import type { SystemRecord, NetworkMonitorRecord, SystemDetailsRecord } from "@/types"
import { getMonitorLabel, getMonitorTarget } from "@/lib/network-monitor-utils"
import { $router, navigate } from "../router"
import { getPagePath } from "@nanostores/router"
import { ActionsButton } from "../systems-table/systems-table-columns"
import AlertButton from "../alerts/alert-button"

type BarType = "cpu" | "memory" | "disk" | "gpu" | "load"

/** Loss tiers and probe-quality helpers live in one shared module. */
import { type QualityLevel, latencyQualityFor, lossQuality } from "@/lib/probe-quality"

const QUALITY_SEGMENT_COLORS: Record<QualityLevel, string> = {
	good: "bg-emerald-500 dark:bg-emerald-400 dark:shadow-[0_0_6px_rgba(52,211,153,0.45)]",
	warn: "bg-amber-500 dark:bg-amber-400 dark:shadow-[0_0_6px_rgba(251,191,36,0.45)]",
	bad: "bg-rose-500 dark:bg-rose-400 dark:shadow-[0_0_6px_rgba(251,113,133,0.45)]",
	idle: "bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/40 dark:border-slate-700/50",
}

/** Shared empty-segment class; the filled class is chosen once per bar. */
const EMPTY_SEGMENT_CLASS = "bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/40 dark:border-slate-700/50"

/** Segment indexes never change for the default 10-block bar; reuse one array. */
const SEGMENT_INDEXES = Array.from({ length: 10 }, (_, index) => index)

function segmentIndexes(count: number) {
	return count === 10 ? SEGMENT_INDEXES : Array.from({ length: count }, (_, index) => index)
}

/** Format a gigabyte value the way the capacity rows expect (762 MB / 3.79 GB). */
function formatCapacity(gb: number | undefined): string | undefined {
	if (gb == null || !Number.isFinite(gb) || gb <= 0) return undefined
	const { value, unit } = formatBytes(gb * 1024 ** 3)
	const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2
	return `${value.toFixed(digits)} ${unit}`
}

/** Format a cumulative byte counter (529 GB / 1.02 TB). */
function formatTraffic(bytes: number | undefined, unit = Unit.Bytes): string | undefined {
	if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return undefined
	const formatted = formatBytes(bytes, false, unit)
	const digits = formatted.value >= 100 ? 0 : formatted.value >= 10 ? 1 : 2
	return `${formatted.value.toFixed(digits)} ${formatted.unit}`
}

/** Format a per-second byte rate (2.21 KB/s). */
function formatRate(bytesPerSec: number, unit = Unit.Bytes): string {
	const formatted = formatBytes(bytesPerSec, true, unit)
	const digits = formatted.value >= 100 ? 0 : formatted.value >= 10 ? 1 : 2
	return `${formatted.value.toFixed(digits)} ${formatted.unit}`
}

function formatPercent(value: number): string {
	return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)}%`
}

interface SegmentedBlockBarProps {
	label: string
	value: number
	valueText?: string
	detail?: string
	segments?: number
	isOnline: boolean
	type?: BarType
	icon?: ComponentType<{ className?: string }>
}

/**
 * Segmented discrete LED block progress bar (Aozora HUD aesthetic).
 * Header row carries the label and reading, the detail row shows absolute
 * figures (used / total, load triplets), and the LED row shows utilization.
 */
const SegmentedBlockBar = memo(function SegmentedBlockBar({
	label,
	value,
	valueText,
	detail,
	segments = 10,
	isOnline,
	type = "cpu",
	icon: Icon,
}: SegmentedBlockBarProps) {
	const clampedValue = Math.min(100, Math.max(0, value))
	const filledCount = isOnline ? Math.round((clampedValue / 100) * segments) : 0

	// One class string per bar instead of one `cn()` call per segment
	const filledClass = useMemo(() => {
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
		<div className="flex flex-col gap-1 min-w-0">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1.5 min-w-0">
					{Icon && <Icon className="size-3.5 text-muted-foreground/80 shrink-0" />}
					<span className="text-[11px] font-semibold text-foreground tracking-tight truncate">{label}</span>
				</div>
				<span className={cn("font-mono font-bold tabular-nums text-[13px] shrink-0", textColorClass)}>
					{isOnline ? (valueText ?? formatPercent(clampedValue)) : "—"}
				</span>
			</div>

			{detail && (
				<span className="text-[10px] text-muted-foreground font-medium truncate leading-none" title={detail}>
					{detail}
				</span>
			)}

			{/* Discrete Segments Row */}
			<div className="flex items-center gap-1 w-full">
				{segmentIndexes(segments).map((idx) => (
					<div
						key={idx}
						className={cn(
							"h-1.5 sm:h-2 flex-1 rounded-[2px] transition-colors duration-300",
							idx < filledCount ? filledClass : EMPTY_SEGMENT_CLASS
						)}
					/>
				))}
			</div>
		</div>
	)
})

/** A full-width strip of segments colored by a single quality tier. */
const QualityBar = memo(function QualityBar({ level, segments = 10 }: { level: QualityLevel; segments?: number }) {
	return (
		<div className="flex items-center gap-[3px] w-full">
			{segmentIndexes(segments).map((idx) => (
				<div
					key={idx}
					className={cn("h-1.5 flex-1 rounded-[2px] transition-colors duration-300", QUALITY_SEGMENT_COLORS[level])}
				/>
			))}
		</div>
	)
})

interface DenseServerCardProps {
	system: SystemRecord
	/** This system's enabled probes, pre-filtered by the caller. */
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
	const unitNet = useStore($userSettings, { keys: ["unitNet"] }).unitNet
	const stats = deriveSystemCardStats(system, realtime, details)
	const {
		isOnline,
		isPaused,
		liveStats,
		cpu,
		memory,
		disk,
		gpu,
		cores,
		threads,
		loadAverage,
		uptimeSeconds,
		memTotalGb,
		memUsedGb,
		diskTotalGb,
		diskUsedGb,
		sentBytesPerSec,
		recvBytesPerSec,
		totalOutBytes,
		totalInBytes,
	} = stats

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

	// Network protocol tag (Tailnet, V4, V6)
	const networkProtocols = useMemo(() => {
		const tags: string[] = []
		if (system.host?.startsWith("100.")) {
			tags.push("Tailnet")
		}
		if (publicIp) {
			tags.push(publicIp.includes(":") ? "V6" : "V4")
		} else if (system.host) {
			tags.push(system.host.includes(":") ? "V6" : "V4")
		}
		return tags
	}, [system.host, publicIp])

	// CPU Brand / Core Detail
	const cpuBrand = useMemo(() => {
		return getCpuBrandLabel(details?.cpu || system.info?.m) ?? "CPU"
	}, [details?.cpu, system.info?.m])

	const memDetail = useMemo(() => {
		const used = formatCapacity(memUsedGb)
		const total = formatCapacity(memTotalGb)
		if (used && total) return `${used} / ${total}`
		return total ? `Total ${total}` : undefined
	}, [memUsedGb, memTotalGb])

	const diskDetail = useMemo(() => {
		const used = formatCapacity(diskUsedGb)
		const total = formatCapacity(diskTotalGb)
		if (used && total) return `${used} / ${total}`
		return total ? `Total ${total}` : "Root FS"
	}, [diskUsedGb, diskTotalGb])

	// Spec chip: "2C · 3.79G"
	const specChip = useMemo(() => formatSpecChip(cores, threads, memTotalGb), [cores, threads, memTotalGb])

	// Load Level Badge — normalised by logical CPUs, matching `top`/`htop`
	const loadLevelBadge = useMemo(() => {
		if (!loadAverage) return null
		return loadLevel(loadAverage[0], { cores, threads })
	}, [loadAverage, cores, threads])

	// Bidirectional realtime rates and cumulative counters from the agent payload
	const networkTelemetry = useMemo(() => {
		if (!isOnline) {
			return { upRate: "—", downRate: "—", totalOut: "—", totalIn: "—" }
		}
		return {
			upRate: sentBytesPerSec === undefined ? "—" : formatRate(sentBytesPerSec, unitNet),
			downRate: recvBytesPerSec === undefined ? "—" : formatRate(recvBytesPerSec, unitNet),
			totalOut: formatTraffic(totalOutBytes, unitNet) ?? "—",
			totalIn: formatTraffic(totalInBytes, unitNet) ?? "—",
		}
	}, [isOnline, sentBytesPerSec, recvBytesPerSec, totalOutBytes, totalInBytes, unitNet])

	// Uptime String
	const uptimeString = useMemo(() => {
		if (!isOnline) return "—"
		if (uptimeSeconds === undefined) return "Active"
		return secondsToUptimeString(uptimeSeconds)
	}, [isOnline, uptimeSeconds])

	// Live monitor latency from the realtime payload, keyed by monitor id
	const liveMonitorStats = isOnline ? realtime?.Monitors : undefined

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
		// The card is a navigation target, so it renders as an anchor. Nested action
		// buttons stop propagation so they never trigger the card navigation.
		<a
			href={getPagePath($router, "system", { id: system.id })}
			onClick={(event) => {
				event.preventDefault()
				if (event.ctrlKey || event.metaKey) {
					window.open(event.currentTarget.href, "_blank")
					return
				}
				handleCardClick()
			}}
			className="group relative flex flex-col justify-between rounded-3xl bg-card border border-border/80 hover:border-sky-400/60 hover:shadow-lg hover:shadow-sky-500/8 transition-all duration-200 select-none cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:outline-sky-500/60"
			style={{ transform: "translateZ(0)" }}
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
							className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background/85 dark:bg-slate-900/85 border border-border/80 text-[10px] font-extrabold text-foreground shadow-2xs"
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
								className="px-2 py-0.5 rounded-full bg-background/80 dark:bg-slate-900/80 border border-border/70 text-[9px] font-bold text-sky-600 dark:text-sky-400 shadow-2xs"
							>
								{proto}
							</span>
						))}
					</div>

					{/* Right: Status Badge & Actions */}
					{/** biome-ignore lint/a11y/noStaticElementInteractions: wrapper only stops card navigation from the nested action buttons */}
					{/** biome-ignore lint/a11y/useKeyWithClickEvents: same wrapper, no keyboard affordance of its own */}
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
				{/* 1. Server Name, Spec Chip & Public / Mesh IP Identity */}
				<div>
					<div className="flex items-baseline justify-between gap-2">
						<h3 className="text-[16px] font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors truncate leading-snug">
							{system.name}
						</h3>
						<div className="flex items-center gap-1.5 shrink-0">
							{specChip && (
								<span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/15 rounded-md px-1.5 py-0.5 tabular-nums">
									{specChip}
								</span>
							)}
							{system.info?.v && (
								<span className="text-[10px] font-mono font-semibold text-muted-foreground/80">v{system.info.v}</span>
							)}
						</div>
					</div>

					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium truncate mt-0.5">
						{publicIp && (
							<span
								className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold shrink-0"
								title={`Public: ${publicIp}`}
							>
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

				{/* 2. Resource Matrix: CPU / Memory / Disk / Load (2×2 grid) */}
				<div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 rounded-2xl bg-secondary/35 dark:bg-slate-900/35 border border-border/50">
					<SegmentedBlockBar
						label="CPU"
						value={Number(cpu) || 0}
						detail={`${cores ?? "—"} Cores · ${cpuBrand}`}
						isOnline={isOnline}
						type="cpu"
						icon={CpuIcon}
					/>
					<SegmentedBlockBar
						label="Memory"
						value={Number(memory) || 0}
						detail={memDetail}
						isOnline={isOnline}
						type="memory"
						icon={MemoryStickIcon}
					/>
					<SegmentedBlockBar
						label="Disk"
						value={Number(disk) || 0}
						detail={diskDetail}
						isOnline={isOnline}
						type="disk"
						icon={HardDriveIcon}
					/>
					<SegmentedBlockBar
						label="Load"
						value={loadAverage ? loadPercent(loadAverage[0], { cores, threads }) : 0}
						valueText={loadAverage ? loadAverage[0].toFixed(2) : undefined}
						detail={loadAverage ? loadAverage.map((v) => v.toFixed(2)).join(" / ") : undefined}
						isOnline={isOnline}
						type="load"
						icon={GaugeIcon}
					/>
					{gpu !== null && (
						<div className="col-span-2">
							<SegmentedBlockBar
								label="GPU"
								value={Number(gpu) || 0}
								detail="Hardware Acceleration"
								isOnline={isOnline}
								type="gpu"
							/>
						</div>
					)}

					{/* Load level badge spans the grid footer */}
					{loadLevelBadge && (
						<div className="col-span-2 flex items-center justify-end -mt-1">
							<span className={cn("px-2 py-0.2 rounded-full text-[9px] font-bold border", loadLevelBadge.color)}>
								{loadLevelBadge.label}
							</span>
						</div>
					)}
				</div>

				{/* 3. Realtime Network Rates & Cumulative Inbound / Outbound Traffic */}
				<div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-secondary/25 dark:bg-slate-900/25 border border-border/40">
					<div className="grid grid-cols-2 gap-2">
						{/* Realtime Outbound / Upload */}
						<div className="flex items-center gap-1.5 min-w-0">
							<div className="flex items-center justify-center size-5.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
								<ArrowUpIcon className="size-3" strokeWidth={2.5} />
							</div>
							<div className="flex flex-col min-w-0">
								<span className="text-[10px] text-muted-foreground font-medium leading-none">Uplink ↑</span>
								<span className="font-mono font-bold text-foreground tabular-nums text-[11px] truncate mt-0.5">
									{networkTelemetry.upRate}
								</span>
							</div>
							{liveStats && (
								<span
									className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 ms-auto"
									title="Realtime"
								/>
							)}
						</div>

						{/* Realtime Inbound / Download */}
						<div className="flex items-center gap-1.5 min-w-0">
							<div className="flex items-center justify-center size-5.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
								<ArrowDownIcon className="size-3" strokeWidth={2.5} />
							</div>
							<div className="flex flex-col min-w-0">
								<span className="text-[10px] text-muted-foreground font-medium leading-none">Downlink ↓</span>
								<span className="font-mono font-bold text-foreground tabular-nums text-[11px] truncate mt-0.5">
									{networkTelemetry.downRate}
								</span>
							</div>
							{liveStats && (
								<span className="size-1.5 rounded-full bg-sky-500 animate-pulse shrink-0 ms-auto" title="Realtime" />
							)}
						</div>
					</div>

					{/* Cumulative counters since boot, per direction */}
					<div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-border/30 text-[11px]">
						<div className="flex items-center justify-between gap-1 min-w-0">
							<span className="text-muted-foreground font-medium">Outbound</span>
							<span className="font-mono font-semibold text-foreground tabular-nums truncate">
								{networkTelemetry.totalOut}
							</span>
						</div>
						<div className="flex items-center justify-between gap-1 min-w-0">
							<span className="text-muted-foreground font-medium">Inbound</span>
							<span className="font-mono font-semibold text-foreground tabular-nums truncate">
								{networkTelemetry.totalIn}
							</span>
						</div>
					</div>
				</div>

				{/* 4. Multi-Carrier / Network Latency & Quality Matrix */}
				<div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-secondary/20 dark:bg-slate-900/20 border border-border/40">
					<div className="flex items-center justify-between text-[11px]">
						<div className="flex items-center gap-1 text-muted-foreground font-semibold">
							<RadioIcon className="size-3 text-sky-500 shrink-0" />
							<span>Latency &amp; Quality</span>
						</div>
						<span className="text-[10px] text-muted-foreground/70">
							{monitors.length > 0 ? `${monitors.length} ${monitors.length === 1 ? "Probe" : "Probes"}` : "No Probes"}
						</span>
					</div>

					<div className="flex flex-col gap-2 pt-0.5">
						{monitors.length > 0 ? (
							monitors.map((mon) => {
								// Prefer the per-second probe result; fall back to the 60s record
								const live = liveMonitorStats?.[mon.id]
								const latencyUs = live?.res_avg ?? mon.res
								const loss = live ? Math.round(live.loss * 10) / 10 : mon.loss1h || 0

								const latencyLevel: QualityLevel = latencyQualityFor(mon.protocol, latencyUs)
								const lossLevel: QualityLevel = lossQuality(loss)

								return (
									<div key={mon.id} className="flex flex-col gap-1">
										<div className="flex items-center justify-between gap-2 text-[10px]">
											<span className="font-medium text-foreground truncate" title={getMonitorTarget(mon)}>
												{getMonitorLabel(mon)}
											</span>
											<div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
												<span className="font-semibold text-foreground">
													{latencyUs ? formatMicroseconds(latencyUs) : "—"}
												</span>
												<span className="text-muted-foreground w-10 text-right">{loss}%</span>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-2">
											<QualityBar level={latencyLevel} />
											<QualityBar level={lossLevel} />
										</div>
									</div>
								)
							})
						) : (
							/* No probes configured: report the realtime stream's own state instead of inventing latency */
							<div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-background/60 dark:bg-slate-900/60 border border-border/40 text-[10px]">
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
		</a>
	)
})
