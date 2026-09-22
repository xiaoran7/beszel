import { memo, useMemo } from "react"
import { ServerIcon, CheckCircle2Icon, AlertCircleIcon, TrendingUpIcon } from "lucide-react"
import type { SystemRecord } from "@/types"

interface DashboardMetricsHeaderProps {
	systems: SystemRecord[]
	upCount: number
	downCount: number
}

export const DashboardMetricsHeader = memo(function DashboardMetricsHeader({
	systems,
	upCount,
	downCount,
}: DashboardMetricsHeaderProps) {
	const totalCount = systems.length
	const safeUpCount = upCount
	const safeDownCount = downCount

	// Calculate overall average uptime (or fallback to 99.9%)
	const overallUptime = useMemo(() => {
		if (totalCount === 0) return "100%"
		const percentage = (safeUpCount / totalCount) * 100
		return percentage === 100 ? "99.9%" : `${percentage.toFixed(1)}%`
	}, [safeUpCount, totalCount])

	return (
		<div className="flex flex-col gap-6">
			{/* Sensei Morning Greeting Banner */}
			<div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
				<div className="flex flex-col">
					<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
						Good morning, Sensei.
					</h1>
					<p className="text-sm text-muted-foreground mt-1 font-medium">
						All systems at a glance.{" "}
						<strong className="text-foreground font-bold">{safeUpCount} of {totalCount}</strong> servers are{" "}
						<span className="text-emerald-500 font-semibold">online</span>.
					</p>
				</div>

				{/* Japanese Handwriting Slogan Badge */}
				<div className="relative flex items-center md:justify-end">
					<div className="relative flex flex-col items-end text-right select-none">
						<span className="text-xs sm:text-sm font-semibold text-sky-700/80 dark:text-sky-300/80 tracking-wider font-sans">
							いつも、どこでも。
						</span>
						<span className="text-xs sm:text-sm font-bold text-sky-800 dark:text-sky-200 tracking-wider">
							みんなの「あたりまえ」を支える。
						</span>
						<span className="text-[10px] font-bold text-sky-600/70 dark:text-sky-400/70 tracking-widest uppercase mt-0.5">
							MONITOR TODAY, A BRIGHTER TOMORROW.
						</span>
					</div>
				</div>
			</div>

			{/* 4 Summary Metric Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{/* 1. Total Servers */}
				<div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:shadow-xs transition-all">
					<div className="flex items-center justify-center size-11 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
						<ServerIcon className="size-5.5" />
					</div>
					<div className="flex flex-col">
						<span className="text-2xl font-bold tracking-tight text-foreground leading-none">
							{totalCount}
						</span>
						<span className="text-xs font-medium text-muted-foreground mt-1">
							Total Servers
						</span>
					</div>
				</div>

				{/* 2. Online */}
				<div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:shadow-xs transition-all">
					<div className="flex items-center justify-center size-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
						<span className="size-3 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse" />
					</div>
					<div className="flex flex-col">
						<span className="text-2xl font-bold tracking-tight text-foreground leading-none">
							{safeUpCount}
						</span>
						<span className="text-xs font-medium text-muted-foreground mt-1">
							Online
						</span>
					</div>
				</div>

				{/* 3. Offline */}
				<div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:shadow-xs transition-all">
					<div className="flex items-center justify-center size-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
						<span className="size-3 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" />
					</div>
					<div className="flex flex-col">
						<span className="text-2xl font-bold tracking-tight text-foreground leading-none">
							{safeDownCount}
						</span>
						<span className="text-xs font-medium text-muted-foreground mt-1">
							Offline
						</span>
					</div>
				</div>

				{/* 4. Overall Uptime (30d) */}
				<div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:shadow-xs transition-all">
					<div className="flex items-center justify-center size-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
						<TrendingUpIcon className="size-5.5" />
					</div>
					<div className="flex flex-col">
						<span className="text-2xl font-bold tracking-tight text-foreground leading-none">
							{overallUptime}
						</span>
						<span className="text-xs font-medium text-muted-foreground mt-1">
							Overall Uptime (30d)
						</span>
					</div>
				</div>
			</div>
		</div>
	)
})
