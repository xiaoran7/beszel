import { memo, useMemo, useState } from "react"
import { BellIcon, ArrowRightIcon, CheckCircle2Icon } from "lucide-react"
import { useStore } from "@nanostores/react"
import { $alerts, $allSystemsById } from "@/lib/stores"
import { alertInfo } from "@/lib/alerts"
import type { AlertRecord } from "@/types"
import { GlobalAlertsSheet } from "../alerts/global-alerts-sheet"

export const RecentAlertsBar = memo(function RecentAlertsBar() {
	const alerts = useStore($alerts)
	const systems = useStore($allSystemsById)
	const [sheetOpen, setSheetOpen] = useState(false)

	const { activeAlerts, summaryText } = useMemo(() => {
		const activeList: AlertRecord[] = []
		for (const systemId of Object.keys(alerts)) {
			for (const alert of alerts[systemId].values()) {
				if (alert.triggered && alert.name in alertInfo) {
					activeList.push(alert)
				}
			}
		}

		if (activeList.length === 0) {
			return {
				activeAlerts: [],
				summaryText: "All systems operating normally without active warnings.",
			}
		}

		const summaries = activeList.slice(0, 3).map((al) => {
			const sysName = systems[al.system]?.name || "System"
			const info = alertInfo[al.name as keyof typeof alertInfo]
			const metricName = info ? info.name() : al.name
			return `${metricName} threshold on ${sysName}`
		})

		return {
			activeAlerts: activeList,
			summaryText: summaries.join(" · "),
		}
	}, [alerts, systems])

	const count = activeAlerts.length

	return (
		<>
			<GlobalAlertsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 px-5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-sky-300/60 transition-all select-none">
				<div className="flex items-center gap-3">
					<div
						className={`flex items-center justify-center size-9 rounded-xl shrink-0 ${
							count > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
						}`}
					>
						{count > 0 ? <BellIcon className="size-4.5" /> : <CheckCircle2Icon className="size-4.5" />}
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-sm font-bold text-foreground">
							{count > 0 ? "Recent Alerts" : "System Status"}
						</span>
						{count > 0 ? (
							<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
								{count} active
							</span>
						) : (
							<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
								Healthy
							</span>
						)}
						<span className="text-xs text-muted-foreground hidden md:inline ml-2">
							{summaryText}
						</span>
					</div>
				</div>

				<button
					type="button"
					onClick={() => setSheetOpen(true)}
					className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:underline shrink-0 cursor-pointer"
				>
					<span>View all alerts</span>
					<ArrowRightIcon className="size-3.5" />
				</button>
			</div>
		</>
	)
})

