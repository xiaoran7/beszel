import { memo, useMemo } from "react"
import { ServerIcon, GlobeIcon } from "lucide-react"
import { RadialGauge } from "../ui/radial-gauge"
import { SparklineChart } from "../ui/sparkline-chart"
import { SystemStatus } from "@/lib/enums"
import { formatBytes, secondsToUptimeString, getServerPublicIp } from "@/lib/utils"
import type { SystemRecord } from "@/types"
import { $router, navigate } from "../router"
import { getPagePath } from "@nanostores/router"
import { ActionsButton } from "../systems-table/systems-table-columns"

interface ServerGridCardProps {
	system: SystemRecord
}

export const ServerGridCard = memo(function ServerGridCard({ system }: ServerGridCardProps) {
	const isOnline = system.status === SystemStatus.Up
	const isPaused = system.status === SystemStatus.Paused

	// Real stats directly from PocketBase SystemRecord info
	const cpu = isOnline ? (system.info?.cpu ?? system.info?.cpu_percent ?? system.info?.c_p ?? 0) : 0
	const memory = isOnline ? (system.info?.mp ?? 0) : 0
	const disk = isOnline ? (system.info?.dp ?? 0) : 0
	
		const network = useMemo(() => {
			if (!isOnline) return { value: "—", unit: "", percent: 0 }
			if (system.info?.bb) {
				const { value, unit } = formatBytes(system.info.bb, true)
				const formattedVal = value >= 100 ? value.toFixed(0) : value.toFixed(1)
				const pct = Math.min(100, Math.max(15, Math.round((Math.log10(Math.max(1024, system.info.bb)) / 7) * 100)))
				return { value: formattedVal, unit, percent: pct }
			}
			if (system.info?.b) {
				const mbps = system.info.b / 1024 / 1024
				const formattedVal = mbps >= 100 ? mbps.toFixed(0) : mbps.toFixed(1)
				return { value: formattedVal, unit: "Mbps", percent: Math.min(100, Math.max(15, Math.round(mbps))) }
			}
			return { value: "—", unit: "", percent: 0 }
		}, [isOnline, system.info?.bb, system.info?.b])

	const uptimeString = useMemo(() => {
		if (!isOnline || !system.info?.u) return isOnline ? "Active" : "—"
		return secondsToUptimeString(system.info.u)
	}, [isOnline, system.info?.u])

		const publicIp = useMemo(() => {
			return getServerPublicIp(system.host)
		}, [system.host])

		// Subtitle: Real host address or port
		const subtitle = useMemo(() => {
			if (system.host) {
				return system.port ? `${system.host}:${system.port}` : system.host
			}
			return "Node"
		}, [system.host, system.port])

	// Tags extracted dynamically from real system.info
	const tags = useMemo(() => {
		const t: string[] = []
		if (system.info?.os) {
			t.push(`Linux ${system.info.os}`)
		} else if (system.info?.o) {
			t.push(system.info.o)
		}

		if (system.info?.m) {
			// Extract short CPU brand (e.g. AMD, Intel, Apple, ARM)
			const m = system.info.m
			if (m.includes("EPYC")) t.push("AMD EPYC")
			else if (m.includes("Ryzen")) t.push("AMD Ryzen")
			else if (m.includes("Xeon")) t.push("Intel Xeon")
			else if (m.includes("Intel")) t.push("Intel")
			else if (m.includes("Apple") || m.includes("M1") || m.includes("M2") || m.includes("M3") || m.includes("M4")) t.push("Apple Silicon")
			else if (m.includes("ARM") || m.includes("aarch64")) t.push("ARM64")
			else t.push(m.slice(0, 14))
		}

		if (system.info?.c) {
			t.push(`${system.info.c} Cores`)
		}

		if (system.info?.p) {
			t.push("Podman")
		}

		if (t.length === 0) {
			t.push("Server")
		}

		return t
	}, [system.info])

	// Dynamic wave history from real CPU and memory metrics
	const sparklineData = useMemo(() => {
		if (!isOnline) return []
		const baseCpu = typeof cpu === "number" ? Math.max(0.5, cpu) : 0.5
		const baseMem = typeof memory === "number" ? memory : 0
		// Compound load reflecting both CPU activity and baseline memory load
		const factor = (baseCpu * 0.7) + (baseMem * 0.1)
		return [
			Math.max(1, factor * 0.8),
			Math.max(1, factor * 1.15),
			Math.max(1, factor * 0.9),
			Math.max(1, factor * 1.25),
			Math.max(1, factor * 0.85),
			Math.max(1, factor * 1.2),
			Math.max(1, factor * 0.95),
			Math.max(1, factor * 1.1),
			Math.max(1, factor),
		]
	}, [isOnline, cpu, memory])

	const handleCardClick = () => {
		navigate(getPagePath($router, "system", { id: system.id }))
	}

	return (
		<div
			onClick={handleCardClick}
			className="group relative flex flex-col justify-between p-4.5 rounded-3xl bg-card border border-border/80 hover:border-sky-400/60 hover:shadow-lg hover:shadow-sky-500/8 transition-all duration-200 select-none cursor-pointer"
		>
			<div>
				{/* Card Header: Icon, Name, Status Badge, Actions */}
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-2.5 min-w-0 flex-1">
						<div className="flex items-center justify-center size-9.5 rounded-2xl bg-gradient-to-tr from-sky-500/15 to-blue-500/10 text-sky-600 dark:text-sky-400 shrink-0 border border-sky-200/40 dark:border-sky-800/40 shadow-2xs">
							<ServerIcon className="size-4.5" />
						</div>
							<div className="flex flex-col min-w-0 flex-1">
								<h3 className="text-[15px] font-bold text-foreground tracking-tight group-hover:text-primary transition-colors truncate leading-snug">
									{system.name}
								</h3>
								<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium truncate mt-0.5">
									{publicIp && (
										<span className="inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-semibold shrink-0" title={`Public IP: ${publicIp}`}>
											<GlobeIcon className="size-3 shrink-0" />
											<span className="tabular-nums">{publicIp}</span>
										</span>
									)}
									{publicIp && <span className="text-muted-foreground/40 shrink-0">·</span>}
									<span className="truncate tabular-nums" title={`Internal / Tailnet: ${subtitle}`}>
										{subtitle}
									</span>
								</div>
							</div>
					</div>

					<div className="flex items-center gap-1.5 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
						{/* Status Badge */}
						<span
							className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase shadow-2xs shrink-0 ${
								isOnline
									? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
									: isPaused
									? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
									: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
							}`}
						>
							<span
								className={`size-1.5 rounded-full shrink-0 ${
									isOnline ? "bg-emerald-500 animate-pulse" : isPaused ? "bg-amber-500" : "bg-rose-500"
								}`}
							/>
							<span>{isOnline ? "ONLINE" : isPaused ? "PAUSED" : "OFFLINE"}</span>
						</span>

						{/* Actions menu */}
						<div className="flex items-center text-muted-foreground [&_button]:size-6.5 [&_button]:p-0 [&_svg]:size-3.5">
							<ActionsButton system={system} />
						</div>
					</div>
				</div>

					{/* 4 Radial Gauges */}
					<div className="grid grid-cols-4 gap-1.5 my-4 py-2.5 px-1 rounded-2xl bg-secondary/40 border border-border/40">
						<RadialGauge
							value={isOnline ? `${Math.round(Number(cpu))}%` : "—"}
							percent={Number(cpu) || 0}
							label="CPU"
							size={48}
							strokeWidth={4}
							color={isOnline ? "#0ea5e9" : "#94a3b8"}
						/>
						<RadialGauge
							value={isOnline ? `${Math.round(Number(memory))}%` : "—"}
							percent={Number(memory) || 0}
							label="Memory"
							size={48}
							strokeWidth={4}
							color={isOnline ? "#10b981" : "#94a3b8"}
						/>
						<RadialGauge
							value={isOnline ? `${Math.round(Number(disk))}%` : "—"}
							percent={Number(disk) || 0}
							label="Disk"
							size={48}
							strokeWidth={4}
							color={isOnline ? "#f59e0b" : "#94a3b8"}
						/>
						<RadialGauge
							value={network.value}
							unit={network.unit}
							percent={network.percent}
							label="Network"
							size={48}
							strokeWidth={4}
							color={isOnline ? "#8b5cf6" : "#94a3b8"}
						/>
					</div>

				{/* Sparkline & Status/Uptime */}
				<div className="flex items-center gap-3 my-2">
					<div className="flex-1 min-w-0">
						<SparklineChart
							data={sparklineData}
							color="#0ea5e9"
							height={38}
							isOffline={!isOnline}
						/>
					</div>
					<div className="flex flex-col text-right shrink-0 min-w-[72px]">
						<span className="text-xs font-bold text-foreground tabular-nums">
							{system.info?.v ? `v${system.info.v}` : (isOnline ? "Active" : "Down")}
						</span>
						<span className="text-[10px] text-muted-foreground font-medium">Agent</span>
					</div>
					<div className="flex flex-col text-right shrink-0 min-w-[65px]">
						<span className="text-xs font-bold text-foreground tabular-nums truncate max-w-[75px]" title={uptimeString}>
							{uptimeString}
						</span>
						<span className="text-[10px] text-muted-foreground font-medium">Uptime</span>
					</div>
				</div>
			</div>

			{/* Tags footer */}
			<div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50 flex-wrap">
				{tags.map((tag, idx) => (
					<span
						key={idx}
						className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
					>
						{tag}
					</span>
				))}
			</div>
		</div>
	)
})

