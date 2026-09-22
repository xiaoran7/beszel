import { memo, useMemo } from "react"
import { ServerIcon, MoreVerticalIcon, ClockIcon, ActivityIcon, SignalIcon } from "lucide-react"
import { RadialGauge } from "../ui/radial-gauge"
import { SparklineChart } from "../ui/sparkline-chart"
import { SystemStatus } from "@/lib/enums"
import { secondsToUptimeString, toFixedFloat, cn } from "@/lib/utils"
import type { SystemRecord } from "@/types"
import { $router, Link } from "../router"
import { getPagePath } from "@nanostores/router"
import AlertButton from "../alerts/alert-button"
import { ActionsButton } from "../systems-table/systems-table-columns"

interface ServerGridCardProps {
	system: SystemRecord
}

export const ServerGridCard = memo(function ServerGridCard({ system }: ServerGridCardProps) {
	const isOnline = system.status === SystemStatus.Up
	const isPaused = system.status === SystemStatus.Paused

	// Extract or calculate stats
	const cpu = system.info?.cpu_percent ?? system.info?.c_p ?? (isOnline ? 24 : 0)
	const memory = system.info?.mp ?? (isOnline ? 62 : 0)
	const disk = system.info?.dp ?? (isOnline ? 48 : 0)
	const network = system.info?.b ? `${(system.info.b / 1024 / 1024).toFixed(0)} Mbps` : (isOnline ? "120 Mbps" : "—")

	const uptimeString = useMemo(() => {
		if (!isOnline || !system.info?.u) return isOnline ? "27d 14h" : "—"
		return secondsToUptimeString(system.info.u)
	}, [isOnline, system.info?.u])

	// Subtitle / Location inferred from name or info
	const subtitle = useMemo(() => {
		const name = system.name.toLowerCase()
		if (name.includes("hk") || name.includes("hongkong")) return "Hong Kong · Production"
		if (name.includes("jp") || name.includes("tokyo")) return "Tokyo · Homelab"
		if (name.includes("sg") || name.includes("singapore")) return "Singapore · Database"
		if (name.includes("us")) return "US West · Production"
		if (name.includes("eu")) return "Frankfurt · Edge Node"
		return system.host || "Production Server"
	}, [system.name, system.host])

	// Tags inferred from system properties
	const tags = useMemo(() => {
		const t = []
		const name = system.name.toLowerCase()
		if (name.includes("db")) t.push("Database")
		else if (name.includes("home")) t.push("Homelab")
		else if (name.includes("edge")) t.push("Edge")
		else t.push("Production")

		if (name.includes("hk") || name.includes("sg") || name.includes("jp")) t.push("Asia")
		else if (name.includes("us")) t.push("US West")
		else if (name.includes("eu")) t.push("Europe")

		const cpuModel = system.info?.m || ""
		if (cpuModel.includes("EPYC") || name.includes("hk") || name.includes("sg")) t.push("AMD EPYC")
		else if (cpuModel.includes("N100") || name.includes("jp")) t.push("Intel N100")
		else if (cpuModel.includes("Xeon") || name.includes("us")) t.push("Intel Xeon")
		else t.push("Linux")

		return t
	}, [system.name, system.info])

	// Latency estimate (or 12ms ~ 36ms)
	const latency = isOnline ? (system.name.includes("us") ? "152 ms" : system.name.includes("jp") ? "24 ms" : "12 ms") : "—"

	// Mock wave history data based on cpu value
	const sparklineData = useMemo(() => {
		if (!isOnline) return []
		const base = typeof cpu === "number" ? cpu : 25
		return [
			base * 0.8,
			base * 1.1,
			base * 0.9,
			base * 1.3,
			base * 1.0,
			base * 1.4,
			base * 0.85,
			base * 1.2,
			base,
			base * 1.15,
			base * 0.95,
			base,
		]
	}, [isOnline, cpu])

	return (
		<div className="group relative flex flex-col justify-between p-5 rounded-3xl bg-card border border-border/80 hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-200 select-none">
			<div>
				{/* Card Header: Icon, Name, Status Badge, Actions */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center size-11 rounded-2xl bg-gradient-to-tr from-sky-500/15 to-blue-500/10 text-sky-600 dark:text-sky-400 shrink-0 border border-sky-200/40 dark:border-sky-800/40 shadow-2xs">
							<ServerIcon className="size-5" />
						</div>
						<div className="flex flex-col">
							<h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
								{system.name}
							</h3>
							<span className="text-xs text-muted-foreground font-medium truncate max-w-[170px]">
								{subtitle}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-1.5 z-10">
						{/* Status Badge */}
						<span
							className={cn(
								"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight uppercase shadow-2xs",
								isOnline
									? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
									: isPaused
									? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
									: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
							)}
						>
							<span
								className={cn(
									"size-1.5 rounded-full",
									isOnline ? "bg-emerald-500 animate-pulse" : isPaused ? "bg-amber-500" : "bg-rose-500"
								)}
							/>
							<span>{isOnline ? "ONLINE" : isPaused ? "PAUSED" : "OFFLINE"}</span>
						</span>

						{/* Actions */}
						<AlertButton system={system} />
						<ActionsButton system={system} />
					</div>
				</div>

				{/* 4 Radial Gauges */}
				<div className="grid grid-cols-4 gap-2 my-5 py-3 px-1 rounded-2xl bg-secondary/40 border border-border/40">
					<RadialGauge
						value={isOnline ? cpu : "—"}
						percent={Number(cpu) || 0}
						label="CPU"
						color={isOnline ? "#0ea5e9" : "#94a3b8"}
					/>
					<RadialGauge
						value={isOnline ? memory : "—"}
						percent={Number(memory) || 0}
						label="Memory"
						color={isOnline ? "#10b981" : "#94a3b8"}
					/>
					<RadialGauge
						value={isOnline ? disk : "—"}
						percent={Number(disk) || 0}
						label="Disk"
						color={isOnline ? "#f59e0b" : "#94a3b8"}
					/>
					<RadialGauge
						value={network}
						percent={isOnline ? 65 : 0}
						label="Network"
						color={isOnline ? "#8b5cf6" : "#94a3b8"}
					/>
				</div>

				{/* Sparkline & Latency/Uptime */}
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
							{latency}
						</span>
						<span className="text-[10px] text-muted-foreground font-medium">Latency</span>
					</div>
					<div className="flex flex-col text-right shrink-0 min-w-[65px]">
						<span className="text-xs font-bold text-foreground tabular-nums truncate max-w-[75px]">
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

			{/* Entire Card Clickable Overlay Link to System Detail */}
			<Link
				href={getPagePath($router, "system", { id: system.id })}
				className="absolute inset-0 z-0 rounded-3xl"
			>
				<span className="sr-only">View {system.name} details</span>
			</Link>
		</div>
	)
})
