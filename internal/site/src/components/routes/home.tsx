import { memo, useState, useMemo, useEffect } from "react"
import { useStore } from "@nanostores/react"
import { LayoutGridIcon, LayoutListIcon, ArrowUpDownIcon } from "lucide-react"
import { $systems, $upSystems, $downSystems } from "@/lib/stores"
import { SystemStatus } from "@/lib/enums"
import type { SystemRecord } from "@/types"
import { DashboardMetricsHeader } from "../dashboard/dashboard-metrics-header"
import { ServerGridCard } from "../dashboard/server-grid-card"
import { AddServerCard } from "../dashboard/add-server-card"
import { RecentAlertsBar } from "../dashboard/recent-alerts-bar"
import { AronaCompanionPanel } from "../dashboard/arona-companion-panel"
import SystemsTable from "../systems-table/systems-table"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Fallback high-fidelity sample servers matching Reference Image 1 when no backend servers exist yet
const SAMPLE_SERVERS: SystemRecord[] = [
	{
		id: "hk-01",
		name: "HK-01",
		host: "Hong Kong · Production",
		status: SystemStatus.Up,
		created: "2025-03-17",
		updated: "2026-09-22",
		info: {
			h: "hk-01",
			m: "AMD EPYC 7763",
			c: 16,
			t: 32,
			u: 2381040, // 27d 14h
			cpu_percent: 24,
			mp: 62,
			dp: 48,
			b: 125829120, // 120 Mbps
		},
	},
	{
		id: "jp-home",
		name: "JP-HOME",
		host: "Tokyo · Homelab",
		status: SystemStatus.Up,
		created: "2025-05-10",
		updated: "2026-09-22",
		info: {
			h: "jp-home",
			m: "Intel N100",
			c: 4,
			t: 4,
			u: 1058400, // 12d 6h
			cpu_percent: 8,
			mp: 36,
			dp: 22,
			b: 18874368, // 18 Mbps
		},
	},
	{
		id: "sg-db",
		name: "SG-DB",
		host: "Singapore · Database",
		status: SystemStatus.Up,
		created: "2025-01-05",
		updated: "2026-09-22",
		info: {
			h: "sg-db",
			m: "AMD EPYC 9654",
			c: 32,
			t: 64,
			u: 6750000, // 78d 3h
			cpu_percent: 42,
			mp: 71,
			dp: 63,
			b: 99614720, // 95 Mbps
		},
	},
	{
		id: "us-01",
		name: "US-01",
		host: "US West · Production",
		status: SystemStatus.Up,
		created: "2025-02-14",
		updated: "2026-09-22",
		info: {
			h: "us-01",
			m: "Intel Xeon Gold",
			c: 16,
			t: 32,
			u: 3013200, // 34d 21h
			cpu_percent: 28,
			mp: 55,
			dp: 41,
			b: 220200960, // 210 Mbps
		},
	},
	{
		id: "eu-edge",
		name: "EU-EDGE",
		host: "Frankfurt · Edge Node",
		status: SystemStatus.Down,
		created: "2025-04-01",
		updated: "2026-09-22",
		info: {
			h: "eu-edge",
			m: "N/A",
			c: 2,
			t: 2,
			u: 0,
			cpu_percent: 0,
			mp: 0,
			dp: 0,
			b: 0,
		},
	},
]

export default memo(function Home() {
	const realSystems = useStore($systems)
	const upSystems = useStore($upSystems)
	const downSystems = useStore($downSystems)

	const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
	const [sortBy, setSortBy] = useState<"name" | "status" | "cpu" | "memory">("name")

	useEffect(() => {
		document.title = "Dashboard / Beszel"
	}, [])

	// Determine active systems list (real systems from PocketBase or Reference 1 Samples)
	const displaySystems = useMemo(() => {
		const source = realSystems.length > 0 ? realSystems : SAMPLE_SERVERS
		const copy = [...source]

		if (sortBy === "name") {
			copy.sort((a, b) => a.name.localeCompare(b.name))
		} else if (sortBy === "status") {
			copy.sort((a, b) => (a.status === SystemStatus.Up ? -1 : 1))
		} else if (sortBy === "cpu") {
			copy.sort((a, b) => ((b.info?.cpu_percent ?? 0) - (a.info?.cpu_percent ?? 0)))
		} else if (sortBy === "memory") {
			copy.sort((a, b) => ((b.info?.mp ?? 0) - (a.info?.mp ?? 0)))
		}

		return copy
	}, [realSystems, sortBy])

	const upCount = realSystems.length > 0 ? Object.keys(upSystems).length : 4
	const downCount = realSystems.length > 0 ? Object.keys(downSystems).length : 1

	return (
		<div className="flex flex-col lg:flex-row gap-6 w-full pb-10">
			{/* Main Content Column */}
			<div className="flex-1 min-w-0 flex flex-col gap-6">
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
					<div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5">
						{displaySystems.map((system) => (
							<ServerGridCard key={system.id} system={system} />
						))}
						{/* "+ Add Server" Tile */}
						<AddServerCard />
					</div>
				) : (
					<div className="bg-card rounded-2xl border border-border/80 p-2">
						<SystemsTable />
					</div>
				)}

				{/* 4. Bottom Recent Alerts Bar */}
				<RecentAlertsBar />
			</div>

			{/* 5. Right Arona Wall Companion Panel (From Reference 1) */}
			<AronaCompanionPanel />
		</div>
	)
})
