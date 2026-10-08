import { memo, useState } from "react"
import { Trans } from "@lingui/react/macro"
import { compareSemVer, parseSemVer, supportsNetworkMonitors } from "@/lib/utils"
import type { GPUData } from "@/types"
import { useSystemData } from "./system/use-system-data"
import { CpuChart, ContainerCpuChart } from "./system/charts/cpu-charts"
import { MemoryChart, ContainerMemoryChart, SwapChart } from "./system/charts/memory-charts"
import { DiskUsageChart, DiskIOChart, RootDiskCharts, ExtraFsCharts } from "./system/charts/disk-charts"
import { ZfsCharts } from "./system/charts/storage-pool-charts"
import { BandwidthChart, ContainerNetworkChart } from "./system/charts/network-charts"
import { TemperatureChart, FanChart, BatteryChart } from "./system/charts/sensor-charts"
import { GpuPowerChart, GpuCharts } from "./system/charts/gpu-charts"
import {
	LazyContainersTable,
	LazyNetworkMonitorsTable,
	LazySmartTable,
	LazySystemdTable,
	LazyZfsTable,
} from "./system/lazy-tables"
import { LoadAverageChart } from "./system/charts/load-average-chart"
import {
	BoxesIcon,
	CpuIcon,
	HardDriveIcon,
	NetworkIcon,
	TerminalSquareIcon,
	LayoutDashboardIcon,
	LayoutGridIcon,
	Maximize2Icon,
} from "lucide-react"
import { GpuIcon } from "../ui/icons"
import { SystemHeroHeader } from "./system/system-hero-header"
import { SystemKpiCards } from "./system/system-kpi-cards"
import { SystemDockerCard } from "./system/system-docker-card"
import { SystemInfoOverviewCard } from "./system/system-info-overview-card"
import { CitySkylineCard } from "./system/city-skyline-card"
import ChartTimeSelect from "../charts/chart-time-select"
import { cn } from "@/lib/utils"

const SEMVER_0_14_0 = parseSemVer("0.14.0")
const SEMVER_0_15_0 = parseSemVer("0.15.0")

export default memo(function SystemDetail({ id }: { id: string }) {
	const systemData = useSystemData(id)

	const {
		system,
		systemStats,
		containerData,
		chartData,
		containerChartConfigs,
		details,
		grid,
		setGrid,
		displayMode,
		setDisplayMode,
		maxValues,
		isLongerChart,
		showMax,
		dataEmpty,
		isPodman,
		lastGpus,
		hasGpuData,
		hasGpuEnginesData,
		hasGpuPowerData,
	} = systemData

	const [pageBottomExtraMargin, setPageBottomExtraMargin] = useState(0)
	const [activeSectionTab, setActiveSectionTab] = useState<
		"overview" | "core" | "containers" | "network" | "storage" | "gpu" | "services"
	>("overview")

	if (!system.id) {
		return null
	}

	const hasContainers = containerData.length > 0
	const maybeHasSmartData = compareSemVer(chartData.agentVersion, SEMVER_0_15_0) >= 0
	const hasContainersTable = hasContainers && compareSemVer(chartData.agentVersion, SEMVER_0_14_0) >= 0
	const hasSystemd = Boolean(system.info?.sv)
	const hasGpu = hasGpuData || hasGpuPowerData
	const hasZfs = Object.keys(systemStats.at(-1)?.stats?.z ?? {}).length > 0
	const hasNetworkMonitors = supportsNetworkMonitors(system)

	const coreProps = { chartData, grid, dataEmpty, showMax, isLongerChart, maxValues }

	const tabsList = [
		{ id: "overview", label: "Overview", icon: LayoutDashboardIcon },
		{ id: "core", label: "Core", icon: CpuIcon },
		...(hasContainers ? [{ id: "containers", label: "Containers", icon: BoxesIcon }] : []),
		{ id: "network", label: "Network", icon: NetworkIcon },
		{ id: "storage", label: "Storage", icon: HardDriveIcon },
		...(hasGpu ? [{ id: "gpu", label: "GPU", icon: GpuIcon }] : []),
		...(hasSystemd ? [{ id: "services", label: "Services", icon: TerminalSquareIcon }] : []),
	] as const

	return (
		<div className="flex flex-col gap-6 w-full p-4 md:p-6 lg:p-7 pb-16">
			{/* 1. Top Server Hero Header with Online Badge, IP, Arona Bubble & Actions */}
			<SystemHeroHeader system={system} />

			{/* 2. 4 Main KPI Cards (Uptime, Load Average, CPU Temp, Network IP) */}
			<SystemKpiCards system={system} details={details} />

			{/* 3. Navigation Controls Bar: Tabs, Time Selector, Grid Width */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
				{/* Tab Selector Buttons */}
				<div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/60 border border-border/70 overflow-x-auto scrollbar-hide">
					{tabsList.map((tab) => {
						const Icon = tab.icon
						const isActive = activeSectionTab === tab.id
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveSectionTab(tab.id as typeof activeSectionTab)}
								className={cn(
									"flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer select-none",
									isActive
										? "bg-card text-sky-600 dark:text-sky-400 shadow-2xs font-bold"
										: "text-muted-foreground hover:text-foreground hover:bg-card/50"
								)}
							>
								<Icon className={cn("size-3.5", isActive ? "text-sky-500" : "text-muted-foreground")} />
								<span>{tab.label}</span>
							</button>
						)
					})}
				</div>

				{/* Right Controls: Time Range & Layout Width */}
				<div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
					<ChartTimeSelect
						agentVersion={chartData.agentVersion}
						className="h-8 w-32 text-xs rounded-xl bg-card border-border/80 shadow-2xs"
					/>

					{/* Grid vs Full Width Toggle */}
					<button
						type="button"
						onClick={() => setGrid(!grid)}
						className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary/60 shadow-2xs transition-all cursor-pointer select-none"
						title={grid ? "Switch to single column full width" : "Switch to multi-column grid"}
					>
						{grid ? (
							<>
								<LayoutGridIcon className="size-3.5 text-sky-500" />
								<span className="hidden md:inline">Grid</span>
							</>
						) : (
							<>
								<Maximize2Icon className="size-3.5 text-indigo-500" />
								<span className="hidden md:inline">Full</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* 4. Tab Views Content */}
			{/* --- TAB 1: OVERVIEW (Comprehensive Complete View) --- */}
			{activeSectionTab === "overview" && (
				<div className="flex flex-col gap-6">
					{/* Core Metrics 6-Grid */}
					<div
						className={cn(
							"grid gap-5 sm:gap-6",
							grid ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1"
						)}
					>
						<CpuChart {...coreProps} />
						<MemoryChart {...coreProps} />
						<DiskUsageChart systemData={systemData} />
						<BandwidthChart {...coreProps} systemStats={systemStats} />
						<DiskIOChart systemData={systemData} />
						<LoadAverageChart chartData={chartData} grid={grid} dataEmpty={dataEmpty} />
					</div>

					{/* Container Telemetry Charts (Multi-line CPU, Memory, Network) */}
					{hasContainers && (
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-2 pt-2 px-1">
								<BoxesIcon className="size-4 text-sky-500" />
								<h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
									Container Workloads
								</h3>
								<span className="text-xs text-muted-foreground">· Live Docker / Podman metrics</span>
							</div>

							<div
								className={cn(
									"grid gap-5 sm:gap-6",
									grid ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1"
								)}
							>
								<ContainerCpuChart
									chartData={chartData}
									grid={grid}
									dataEmpty={dataEmpty}
									isPodman={isPodman}
									cpuConfig={containerChartConfigs.cpu}
								/>
								<ContainerMemoryChart
									chartData={chartData}
									grid={grid}
									dataEmpty={dataEmpty}
									isPodman={isPodman}
									memoryConfig={containerChartConfigs.memory}
								/>
								<ContainerNetworkChart
									chartData={chartData}
									grid={grid}
									dataEmpty={dataEmpty}
									isPodman={isPodman}
									networkConfig={containerChartConfigs.network}
								/>
							</div>

							{/* Container Running Processes Card */}
							<SystemDockerCard systemId={system.id} />
						</div>
					)}

					{/* GPU Charts if system has GPU */}
					{hasGpu && (
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-2 pt-2 px-1">
								<GpuIcon className="size-4 text-sky-500" />
								<h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
									GPU Accelerators
								</h3>
								<span className="text-xs text-muted-foreground">· Utilization, memory and thermal stats</span>
							</div>

							{hasGpuData && lastGpus && (
								<GpuCharts
									chartData={chartData}
									grid={grid}
									dataEmpty={dataEmpty}
									lastGpus={lastGpus as Record<string, GPUData>}
									hasGpuEnginesData={hasGpuEnginesData}
								>
									{hasGpuPowerData && <GpuPowerChart chartData={chartData} grid={grid} dataEmpty={dataEmpty} />}
								</GpuCharts>
							)}
						</div>
					)}

					{/* Hardware Sensors & Auxiliary Charts */}
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-2 pt-2 px-1">
							<CpuIcon className="size-4 text-indigo-500" />
							<h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
								Sensors & Thermal Telemetry
							</h3>
						</div>

						<div
							className={cn(
								"grid gap-5 sm:gap-6",
								grid ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1"
							)}
						>
							<SwapChart chartData={chartData} grid={grid} dataEmpty={dataEmpty} systemStats={systemStats} />
							<TemperatureChart {...coreProps} setPageBottomExtraMargin={setPageBottomExtraMargin} />
							<FanChart {...coreProps} />
							<BatteryChart system={system} {...coreProps} />
						</div>
					</div>

					{/* Extra Partitions & Storage Pools */}
					<ExtraFsCharts systemData={systemData} />
					{hasZfs && <ZfsCharts systemData={systemData} />}
					{hasZfs && <LazyZfsTable systemId={system.id} />}
					{maybeHasSmartData && <LazySmartTable systemId={system.id} />}
					{hasContainersTable && <LazyContainersTable systemId={system.id} />}
					{hasSystemd && <LazySystemdTable systemId={system.id} />}
					{hasNetworkMonitors && <LazyNetworkMonitorsTable systemId={system.id} />}

					{/* Bottom System Information Overview & City Skyline */}
					<div className="grid grid-cols-1 2xl:grid-cols-3 gap-5 sm:gap-6 pt-2">
						<div className="2xl:col-span-2">
							<SystemInfoOverviewCard system={system} details={details} />
						</div>
						<div className="2xl:col-span-1">
							<CitySkylineCard cityName={system.name} />
						</div>
					</div>
				</div>
			)}

			{/* --- TAB 2: CORE (CPU, Load, Memory, Swap, Thermals) --- */}
			{activeSectionTab === "core" && (
				<div className="flex flex-col gap-6">
					<div
						className={cn(
							"grid gap-5 sm:gap-6",
							grid ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
						)}
					>
						<CpuChart {...coreProps} />
						<LoadAverageChart chartData={chartData} grid={grid} dataEmpty={dataEmpty} />
						<MemoryChart {...coreProps} />
						<SwapChart chartData={chartData} grid={grid} dataEmpty={dataEmpty} systemStats={systemStats} />
						<TemperatureChart {...coreProps} setPageBottomExtraMargin={setPageBottomExtraMargin} />
						<FanChart {...coreProps} />
						<BatteryChart system={system} {...coreProps} />
					</div>
				</div>
			)}

			{/* --- TAB 3: CONTAINERS (Multi-line Charts + Table) --- */}
			{activeSectionTab === "containers" && hasContainers && (
				<div className="flex flex-col gap-6">
					<div
						className={cn(
							"grid gap-5 sm:gap-6",
							grid ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1"
						)}
					>
						<ContainerCpuChart
							chartData={chartData}
							grid={grid}
							dataEmpty={dataEmpty}
							isPodman={isPodman}
							cpuConfig={containerChartConfigs.cpu}
						/>
						<ContainerMemoryChart
							chartData={chartData}
							grid={grid}
							dataEmpty={dataEmpty}
							isPodman={isPodman}
							memoryConfig={containerChartConfigs.memory}
						/>
						<ContainerNetworkChart
							chartData={chartData}
							grid={grid}
							dataEmpty={dataEmpty}
							isPodman={isPodman}
							networkConfig={containerChartConfigs.network}
						/>
					</div>

					{/* Full Interactive Containers Table */}
					<div className="bg-card rounded-3xl border border-border/80 p-2 sm:p-4 shadow-2xs">
						<LazyContainersTable systemId={system.id} />
					</div>
				</div>
			)}

			{/* --- TAB 4: NETWORK (Traffic + Network Monitors) --- */}
			{activeSectionTab === "network" && (
				<div className="flex flex-col gap-6">
					<div
						className={cn(
							"grid gap-5 sm:gap-6",
							grid ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
						)}
					>
						<BandwidthChart {...coreProps} systemStats={systemStats} />
						{hasContainers && (
							<ContainerNetworkChart
								chartData={chartData}
								grid={grid}
								dataEmpty={dataEmpty}
								isPodman={isPodman}
								networkConfig={containerChartConfigs.network}
							/>
						)}
					</div>

					{hasNetworkMonitors && (
						<div className="bg-card rounded-3xl border border-border/80 p-2 sm:p-4 shadow-2xs">
							<LazyNetworkMonitorsTable systemId={system.id} />
						</div>
					)}
				</div>
			)}

			{/* --- TAB 5: STORAGE (Root Disks, Extra FS, ZFS, S.M.A.R.T.) --- */}
			{activeSectionTab === "storage" && (
				<div className="flex flex-col gap-6">
					<div
						className={cn(
							"grid gap-5 sm:gap-6",
							grid ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
						)}
					>
						<RootDiskCharts systemData={systemData} />
					</div>

					<ExtraFsCharts systemData={systemData} />

					{hasZfs && (
						<>
							<ZfsCharts systemData={systemData} />
							<LazyZfsTable systemId={system.id} />
						</>
					)}

					{maybeHasSmartData && (
						<div className="bg-card rounded-3xl border border-border/80 p-2 sm:p-4 shadow-2xs">
							<LazySmartTable systemId={system.id} />
						</div>
					)}
				</div>
			)}

			{/* --- TAB 6: GPU (Utilization, Memory, Temp, Power) --- */}
			{activeSectionTab === "gpu" && hasGpu && (
				<div className="flex flex-col gap-6">
					{hasGpuData && lastGpus && (
						<GpuCharts
							chartData={chartData}
							grid={grid}
							dataEmpty={dataEmpty}
							lastGpus={lastGpus as Record<string, GPUData>}
							hasGpuEnginesData={hasGpuEnginesData}
						>
							{hasGpuPowerData && <GpuPowerChart chartData={chartData} grid={grid} dataEmpty={dataEmpty} />}
						</GpuCharts>
					)}
				</div>
			)}

			{/* --- TAB 7: SERVICES (Systemd Services Table) --- */}
			{activeSectionTab === "services" && hasSystemd && (
				<div className="flex flex-col gap-6">
					<div className="bg-card rounded-3xl border border-border/80 p-2 sm:p-4 shadow-2xs">
						<LazySystemdTable systemId={system.id} />
					</div>
				</div>
			)}
		</div>
	)
})
