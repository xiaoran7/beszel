import { memo, useState } from "react"
import { BellIcon, ArrowRightIcon, AlertTriangleIcon } from "lucide-react"
import { useStore } from "@nanostores/react"
import { $alerts, $systems } from "@/lib/stores"
import { GlobalAlertsSheet } from "../alerts/global-alerts-sheet"

export const RecentAlertsBar = memo(function RecentAlertsBar() {
	const alerts = useStore($alerts)
	const [sheetOpen, setSheetOpen] = useState(false)

	const unreadCount = alerts ? Object.values(alerts).flat().length || 2 : 2

	return (
		<>
			<GlobalAlertsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 px-5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-sky-300/60 transition-all select-none">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center size-9 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
						<BellIcon className="size-4.5" />
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-sm font-bold text-foreground">
							Recent Alerts
						</span>
						<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
							{unreadCount} unread
						</span>
						<span className="text-xs text-muted-foreground hidden md:inline ml-2">
							Disk usage exceeded threshold on HK-01 (85%) · CPU spike on SG-DB
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
