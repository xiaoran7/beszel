import { memo, useMemo } from "react"
import { ClockIcon, ActivityIcon, ThermometerIcon, MapPinIcon } from "lucide-react"
import { secondsToUptimeString } from "@/lib/utils"
import type { SystemRecord, SystemDetailsRecord } from "@/types"

interface SystemKpiCardsProps {
	system: SystemRecord
	details?: SystemDetailsRecord | null
}

export const SystemKpiCards = memo(function SystemKpiCards({ system, details }: SystemKpiCardsProps) {
	// 1. Calculate Uptime
	const uptimeString = useMemo(() => {
		if (!system.info?.u) return "—"
		return secondsToUptimeString(system.info.u)
	}, [system.info?.u])

	// 2. Load Average
	const loadString = useMemo(() => {
		const la = system.info?.la
		if (Array.isArray(la) && la.length >= 3) {
			return `${la[0].toFixed(2)} / ${la[1].toFixed(2)} / ${la[2].toFixed(2)}`
		}
		return "—"
	}, [system.info?.la])

	// 3. CPU Temperature
	const tempString = useMemo(() => {
		const temp = system.info?.dt ?? system.info?.t_c
		if (temp) return `${Math.round(temp)}°C`
		return "—"
	}, [system.info])

	// 4. Host Address & Port
	const hostAddress = useMemo(() => {
		if (system.host) {
			return system.port ? `${system.host}:${system.port}` : system.host
		}
		return "—"
	}, [system.host, system.port])

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
			{/* KPI 1: Uptime */}
			<div className="flex items-center gap-4 p-4.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-sky-300/60 transition-all">
				<div className="flex items-center justify-center size-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
					<ClockIcon className="size-6" />
				</div>
				<div className="flex flex-col min-w-0">
					<span className="text-xs font-medium text-muted-foreground">
						Uptime
					</span>
					<span className="text-lg font-bold tracking-tight text-foreground truncate mt-0.5">
						{uptimeString}
					</span>
					<span className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
						{system.status === "up" ? "Running continuously" : "System Offline"}
					</span>
				</div>
			</div>

			{/* KPI 2: Load Average */}
			<div className="flex items-center gap-4 p-4.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-sky-300/60 transition-all">
				<div className="flex items-center justify-center size-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
					<ActivityIcon className="size-6" />
				</div>
				<div className="flex flex-col min-w-0">
					<span className="text-xs font-medium text-muted-foreground">
						Load Average
					</span>
					<span className="text-lg font-bold tracking-tight text-foreground truncate mt-0.5 font-mono">
						{loadString}
					</span>
					<span className="text-[11px] text-muted-foreground/80 mt-0.5">
						1 / 5 / 15 minutes
					</span>
				</div>
			</div>

			{/* KPI 3: CPU Temperature */}
			<div className="flex items-center gap-4 p-4.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-sky-300/60 transition-all">
				<div className="flex items-center justify-center size-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
					<ThermometerIcon className="size-6" />
				</div>
				<div className="flex flex-col min-w-0">
					<span className="text-xs font-medium text-muted-foreground">
						CPU Temperature
					</span>
					<span className="text-lg font-bold tracking-tight text-foreground truncate mt-0.5">
						{tempString}
					</span>
					<span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
						<span className="size-1.5 rounded-full bg-emerald-500" />
						{tempString !== "—" ? "Monitored" : "Not available"}
					</span>
				</div>
			</div>

			{/* KPI 4: Host Address */}
			<div className="flex items-center gap-4 p-4.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-sky-300/60 transition-all">
				<div className="flex items-center justify-center size-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
					<MapPinIcon className="size-6" />
				</div>
				<div className="flex flex-col min-w-0">
					<span className="text-xs font-medium text-muted-foreground">
						Host Address
					</span>
					<span className="text-lg font-bold tracking-tight text-foreground truncate mt-0.5 font-mono" title={hostAddress}>
						{hostAddress}
					</span>
					<span className="text-[11px] text-muted-foreground/90 font-medium mt-0.5 flex items-center gap-1">
						<span>Node Location</span>
					</span>
				</div>
			</div>
		</div>
	)
})
