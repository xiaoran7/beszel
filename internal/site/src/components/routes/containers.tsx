import { useLingui } from "@lingui/react/macro"
import { memo, useEffect } from "react"
import ContainersTable from "@/components/containers-table/containers-table"
import { ActiveAlerts } from "@/components/active-alerts"
import { FooterRepoLink } from "@/components/footer-repo-link"
import { BoxesIcon } from "lucide-react"

export default memo(function Containers() {
	const { t } = useLingui()

	useEffect(() => {
		document.title = `${t`All Containers`} / Beszel`
	}, [t])

	return (
		<div className="flex flex-col gap-6 w-full p-4 md:p-6 lg:p-7 pb-16">
			{/* Page Header Banner */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-2xs select-none">
				<div className="flex items-center gap-3.5">
					<div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-500/10 text-sky-600 dark:text-sky-400 shrink-0 border border-sky-300/40 dark:border-sky-800/40 shadow-xs">
						<BoxesIcon className="size-6" />
					</div>
					<div className="flex flex-col">
						<h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-sans">
							Containers & Workloads
						</h1>
						<p className="text-xs text-muted-foreground font-medium mt-0.5">
							Live Docker and Podman container telemetry, resource consumption, and logs across connected nodes
						</p>
					</div>
				</div>
			</div>

			{/* Active Alerts if any */}
			<ActiveAlerts />

			{/* Containers Table */}
			<div className="bg-card rounded-3xl border border-border/80 p-2 sm:p-4 shadow-2xs">
				<ContainersTable />
			</div>

			<FooterRepoLink />
		</div>
	)
})
