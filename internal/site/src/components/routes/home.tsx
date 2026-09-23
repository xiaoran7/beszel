import { memo, useState, useMemo, useEffect } from "react"
import { useStore } from "@nanostores/react"
import { LayoutGridIcon, LayoutListIcon, PlusIcon, ServerIcon } from "lucide-react"
import { $systems, $upSystems, $downSystems } from "@/lib/stores"
import { SystemStatus } from "@/lib/enums"
import * as systemsManager from "@/lib/systemsManager"
import { DashboardMetricsHeader } from "../dashboard/dashboard-metrics-header"
import { ServerGridCard } from "../dashboard/server-grid-card"
import { AddServerCard } from "../dashboard/add-server-card"
import { RecentAlertsBar } from "../dashboard/recent-alerts-bar"
import { AronaCompanionPanel } from "../dashboard/arona-companion-panel"
import SystemsTable from "../systems-table/systems-table"
import { AddSystemDialog } from "../add-system"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default memo(function Home() {
	const realSystems = useStore($systems)
	const upSystems = useStore($upSystems)
	const downSystems = useStore($downSystems)

	const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
	const [sortBy, setSortBy] = useState<"name" | "status" | "cpu" | "memory">("name")
	const [addDialogOpen, setAddDialogOpen] = useState(false)

	useEffect(() => {
		document.title = "Dashboard / Beszel"
		// Periodic safety refresh every 15s to keep dashboard synchronized with background hub polls
		const interval = setInterval(() => {
			systemsManager.refresh()
		}, 15000)
		return () => clearInterval(interval)
	}, [])

	// Determine active systems list directly from PocketBase store
	const displaySystems = useMemo(() => {
		const copy = [...realSystems]

		if (sortBy === "name") {
			copy.sort((a, b) => a.name.localeCompare(b.name))
		} else if (sortBy === "status") {
			copy.sort((a, b) => (a.status === SystemStatus.Up ? -1 : 1))
			} else if (sortBy === "cpu") {
				copy.sort((a, b) => ((b.info?.cpu ?? b.info?.cpu_percent ?? 0) - (a.info?.cpu ?? a.info?.cpu_percent ?? 0)))
			} else if (sortBy === "memory") {
			copy.sort((a, b) => ((b.info?.mp ?? 0) - (a.info?.mp ?? 0)))
		}

		return copy
	}, [realSystems, sortBy])

	const upCount = Object.keys(upSystems).length
	const downCount = Object.keys(downSystems).length

	return (
		<div className="relative w-full min-h-[calc(100vh-4rem)] pb-12">
			{/* Integrated Ambient Kivotos Panorama: Skyline, Clock Tower, Window, and Arona */}
			<AronaCompanionPanel />

			{/* Main Interactive Content Workspace */}
			<div className="relative z-10 w-full p-4 md:p-6 lg:p-7 2xl:pr-[310px] flex flex-col gap-6">
				{/* 1. Sensei Morning Welcome & 4 Metric Cards */}
				<DashboardMetricsHeader
					systems={displaySystems}
					upCount={upCount}
					downCount={downCount}
				/>

				{/* 2. Server Overview Toolbar */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
					<div>
						<h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
							Server Overview
						</h2>
						<p className="text-xs text-muted-foreground font-medium mt-0.5">
							Real-time status and performance metrics
						</p>
					</div>

					<div className="flex items-center gap-2 self-start sm:self-auto">
						{/* Sort by Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="h-8 px-3 rounded-xl text-xs font-medium bg-card border-border/80 flex items-center gap-1.5"
								>
									<span className="text-muted-foreground">Sort by</span>
									<span className="font-semibold text-foreground">
										{sortBy === "name"
											? "Name (A → Z)"
											: sortBy === "status"
											? "Status"
											: sortBy === "cpu"
											? "CPU Usage"
											: "Memory Usage"}
									</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-44 rounded-xl">
								<DropdownMenuItem onClick={() => setSortBy("name")} className="text-xs py-2">
									Name (A → Z)
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortBy("status")} className="text-xs py-2">
									Status (Online First)
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortBy("cpu")} className="text-xs py-2">
									CPU Usage (Highest)
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortBy("memory")} className="text-xs py-2">
									Memory Usage (Highest)
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Grid / Table Toggle */}
						<div className="flex items-center p-0.5 rounded-xl bg-secondary/60 border border-border/70">
							<button
								type="button"
								onClick={() => setViewMode("grid")}
								className={`p-1.5 rounded-lg text-xs transition-all ${
									viewMode === "grid"
										? "bg-card text-sky-600 dark:text-sky-400 font-bold shadow-2xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
								title="Grid View"
							>
								<LayoutGridIcon className="size-4" />
							</button>
							<button
								type="button"
								onClick={() => setViewMode("table")}
								className={`p-1.5 rounded-lg text-xs transition-all ${
									viewMode === "table"
										? "bg-card text-sky-600 dark:text-sky-400 font-bold shadow-2xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
								title="Table View"
							>
								<LayoutListIcon className="size-4" />
							</button>
						</div>
					</div>
				</div>

				{/* 3. Server List (Grid or Table) */}
				{viewMode === "grid" ? (
					displaySystems.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-4.5">
							{displaySystems.map((system) => (
								<ServerGridCard key={system.id} system={system} />
							))}
							{/* "+ Add Server" Tile */}
							<AddServerCard />
						</div>
					) : (
						/* Empty State */
						<div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-card border border-border/80 shadow-2xs">
							<div className="size-14 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
								<ServerIcon className="size-7" />
							</div>
							<h3 className="text-lg font-bold text-foreground">No servers connected yet</h3>
							<p className="text-xs text-muted-foreground mt-1 max-w-sm">
								Install the Beszel agent on your servers to start monitoring real-time metrics in the Schale control center.
							</p>
							<Button
								onClick={() => setAddDialogOpen(true)}
								className="mt-5 rounded-2xl gap-2 bg-primary text-primary-foreground font-semibold px-5"
							>
								<PlusIcon className="size-4" />
								<span>Add First Server</span>
							</Button>
							<AddSystemDialog open={addDialogOpen} setOpen={setAddDialogOpen} />
						</div>
					)
				) : (
					<div className="bg-card rounded-2xl border border-border/80 p-2">
						<SystemsTable />
					</div>
				)}

					{/* 4. Bottom Recent Alerts Bar */}
					{displaySystems.length > 0 && <RecentAlertsBar />}
			</div>
		</div>
	)
})

