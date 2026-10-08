import { memo, useMemo, useState, useEffect } from "react"
import { useStore } from "@nanostores/react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { $systems, $alerts } from "@/lib/stores"
import { AlertDialogContent } from "./alerts-sheet"
import { ServerIcon, BellIcon, CheckCircle2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { SystemStatus } from "@/lib/enums"

export const GlobalAlertsSheet = memo(function GlobalAlertsSheet({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const systems = useStore($systems)
	const alerts = useStore($alerts)
	const [selectedSystemId, setSelectedSystemId] = useState<string>("")

	// If no selected system or selected system no longer exists, default to first system with active alerts or first system
	useEffect(() => {
		if (systems.length > 0) {
			if (!selectedSystemId || !systems.some((s) => s.id === selectedSystemId)) {
				// Find first system with triggered alerts, otherwise first system
				const sysWithAlert = systems.find((s) => {
					const sysAlerts = alerts[s.id]
					if (!sysAlerts) return false
					for (const al of sysAlerts.values()) {
						if (al.triggered) return true
					}
					return false
				})
				setSelectedSystemId(sysWithAlert?.id || systems[0].id)
			}
		}
	}, [systems, selectedSystemId, alerts])

	const currentSystem = useMemo(() => {
		return systems.find((s) => s.id === selectedSystemId) || systems[0]
	}, [systems, selectedSystemId])

	// Calculate counts of active alerts per system
	const systemAlertCounts = useMemo(() => {
		const counts: Record<string, number> = {}
		for (const sys of systems) {
			let c = 0
			const sysAlerts = alerts[sys.id]
			if (sysAlerts) {
				for (const al of sysAlerts.values()) {
					if (al.triggered) c++
				}
			}
			counts[sys.id] = c
		}
		return counts
	}, [systems, alerts])

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="max-h-full overflow-auto w-160 !max-w-full p-4 sm:p-6 bg-card border-border/80">
				<SheetHeader className="mb-4">
					<SheetTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<BellIcon className="size-5 text-sky-500" />
						<span>Alert Management</span>
					</SheetTitle>
				</SheetHeader>

				{systems.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground text-sm">
						No systems available to configure alerts. Please add a system first.
					</div>
				) : (
					<div className="flex flex-col gap-5">
						{/* Server Selector Chips */}
						{systems.length > 1 && (
							<div className="flex flex-col gap-2">
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									Select Server
								</label>
								<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
									{systems.map((s) => {
										const isSelected = s.id === currentSystem?.id
										const alertCount = systemAlertCounts[s.id] || 0
										const isOnline = s.status === SystemStatus.Up

										return (
											<button
												key={s.id}
												type="button"
												onClick={() => setSelectedSystemId(s.id)}
												className={cn(
													"flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer shrink-0 select-none",
													isSelected
														? "bg-sky-500/10 border-sky-500/40 text-sky-600 dark:text-sky-400 font-bold shadow-2xs"
														: "bg-secondary/60 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
												)}
											>
												<span
													className={cn(
														"size-1.5 rounded-full shrink-0",
														isOnline ? "bg-emerald-500" : "bg-rose-500"
													)}
												/>
												<span className="truncate max-w-[120px]">{s.name}</span>
												{alertCount > 0 && (
													<span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0">
														{alertCount}
													</span>
												)}
											</button>
										)
									})}
								</div>
							</div>
						)}

						{/* Alert Configuration Content for Selected Server */}
						{currentSystem && <AlertDialogContent system={currentSystem} />}
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
})
