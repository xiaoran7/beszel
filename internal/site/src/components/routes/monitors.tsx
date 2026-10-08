import { useLingui } from "@lingui/react/macro"
import { memo, useEffect } from "react"
import NetworkMonitorsTableNew from "@/components/network-monitors-table/network-monitors-table"
import { ActiveAlerts } from "@/components/active-alerts"
import { FooterRepoLink } from "@/components/footer-repo-link"
import { useNetworkMonitors } from "@/lib/use-network-monitors"
import { $allSystemsById } from "@/lib/stores"
import { supportsNetworkMonitors } from "@/lib/utils"
import { useStore } from "@nanostores/react"
import { NetworkIcon } from "lucide-react"

export default memo(function Monitors() {
	const { t } = useLingui()
	const { monitors, isLoading } = useNetworkMonitors({})
	const systems = useStore($allSystemsById)
	const visibleMonitors = monitors.filter((monitor) => {
		const system = systems[monitor.system]
		return !system || supportsNetworkMonitors(system)
	})

	useEffect(() => {
		document.title = `${t`Network Monitors`} / Beszel`
	}, [t])

	return (
		<div className="flex flex-col gap-6 w-full p-4 md:p-6 lg:p-7 pb-16">
			{/* Page Header Banner */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-2xs select-none">
				<div className="flex items-center gap-3.5">
					<div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-500/10 text-sky-600 dark:text-sky-400 shrink-0 border border-sky-300/40 dark:border-sky-800/40 shadow-xs">
						<NetworkIcon className="size-6" />
					</div>
					<div className="flex flex-col">
						<h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-sans">
							Network Monitors
						</h1>
						<p className="text-xs text-muted-foreground font-medium mt-0.5">
							External HTTP endpoint status, TCP reachability, and ICMP ping latency tracking
						</p>
					</div>
				</div>
			</div>

			{/* Active Alerts if any */}
			<ActiveAlerts />

			{/* Network Monitors Table */}
			<div className="bg-card rounded-3xl border border-border/80 p-2 sm:p-4 shadow-2xs">
				<NetworkMonitorsTableNew monitors={visibleMonitors} isLoading={isLoading} />
			</div>

			<FooterRepoLink />
		</div>
	)
})
