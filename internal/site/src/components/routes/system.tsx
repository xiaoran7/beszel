import { memo, useState } from "react"
import { Trans } from "@lingui/react/macro"
import { compareSemVer, parseSemVer, supportsNetworkMonitors } from "@/lib/utils"
import type { GPUData } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { ContainerIcon, CpuIcon, HardDriveIcon, NetworkIcon, TerminalSquareIcon, SlidersHorizontalIcon, HistoryIcon } from "lucide-react"
import { GpuIcon } from "../ui/icons"
import { SystemHeroHeader } from "./system/system-hero-header"
import { SystemKpiCards } from "./system/system-kpi-cards"
import { SystemDockerCard } from "./system/system-docker-card"
import { SystemInfoOverviewCard } from "./system/system-info-overview-card"
import { CitySkylineCard } from "./system/city-skyline-card"
import ChartTimeSelect from "../charts/chart-time-select"

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
		activeTab,
		setActiveTab,
		mountedTabs,
		tabsRef,
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
	const [showAdvancedPanels, setShowAdvancedPanels] = useState(false)

	if (!system.id) {
		return null
	}

	const hasContainers = containerData.length > 0
	const maybeHasSmartData = compareSemVer(chartData.agentVersion, SEMVER_0_15_0) >= 0
	const hasContainersTable = hasContainers && compareSemVer(chartData.agentVersion, SEMVER_0_14_0) >= 0
	const hasSystemd = system.info?.sv
	const hasGpu = hasGpuData || hasGpuPowerData
	const hasZfs = Object.keys(systemStats.at(-1)?.stats?.z ?? {}).length > 0
	const hasNetworkMonitors = supportsNetworkMonitors(system)

	const tabs = ["core", "network", "disk"]
	if (hasGpu) tabs.push("gpu")
	if (hasContainers) tabs.push("containers")
	if (hasSystemd) tabs.push("services")
	tabsRef.current = tabs

		const coreProps = { chartData, grid, dataEmpty, showMax, isLongerChart, maxValues }

		return (
			<div className="flex flex-col gap-6 w-full p-4 md:p-6 lg:p-7 pb-16">
				{/* 1. Top Server Hero Header (HK-01, ONLINE, Arona Bubble & Banner from Ref 2) */}
				<SystemHeroHeader system={system} />

				{/* 2. 4 Main KPI Cards (Uptime, Load Average, CPU Temp, IP from Ref 2) */}
				<SystemKpiCards system={system} details={details} />

				{/* Controls bar: Time Range & Advanced toggle */}
				<div className="flex items-center justify-between gap-3 px-1">
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold text-foreground font-sans uppercase tracking-wider">
							Telemetry Charts
						</span>
						<span className="text-xs text-muted-foreground hidden sm:inline">
							· Real-time metrics
						</span>
					</div>

					<div className="flex items-center gap-2">
						{/* Compact Time Selector */}
						<ChartTimeSelect
							agentVersion={chartData.agentVersion}
							className="h-8 w-32 text-xs rounded-xl bg-card border-border/80 shadow-2xs"
						/>

						<button
							type="button"
							onClick={() => setShowAdvancedPanels((v) => !v)}
							className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 transition-all cursor-pointer"
						>
							<SlidersHorizontalIcon className="size-3.5" />
							<span>{showAdvancedPanels ? "Hide Extended" : "More Sensors"}</span>
						</button>
					</div>
				</div>

				{/* 3. Main 6-Grid Core Charts (Matching Reference Image 2: 3 cols x 2 rows) */}
				<div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 sm:gap-6">
					{/* Row 1, Col 1: CPU Usage */}
					<CpuChart {...coreProps} />

					{/* Row 1, Col 2: Memory Usage */}
					<MemoryChart {...coreProps} />

					{/* Row 1, Col 3: Disk Usage */}
					<DiskUsageChart systemData={systemData} />

					{/* Row 2, Col 1: Network Traffic (Bandwidth) */}
					<BandwidthChart {...coreProps} systemStats={systemStats} />

					{/* Row 2, Col 2: Disk IO Throughput */}
					<DiskIOChart systemData={systemData} />

					{/* Row 2, Col 3: Docker Containers Table Card */}
					<SystemDockerCard systemId={system.id} />
				</div>

				{/* 4. Bottom System Information Card with Skyline (Reference Image 2: 2 cols Info + 1 col City Skyline) */}
				<div className="grid grid-cols-1 2xl:grid-cols-3 gap-5 sm:gap-6">
					<div className="2xl:col-span-2">
						<SystemInfoOverviewCard system={system} details={details} />
					</div>
					<div className="2xl:col-span-1">
						<CitySkylineCard cityName={system.name} />
					</div>
				</div>

			{/* 5. Extended / Advanced Panels (Sensors, GPU, Smart, Systemd, Extra Disks) */}
			{showAdvancedPanels && (
				<div className="flex flex-col gap-6 pt-4 border-t border-border/60">
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
						<LoadAverageChart chartData={chartData} grid={grid} dataEmpty={dataEmpty} />
						<SwapChart chartData={chartData} grid={grid} dataEmpty={dataEmpty} systemStats={systemStats} />
						<TemperatureChart {...coreProps} setPageBottomExtraMargin={setPageBottomExtraMargin} />
						<FanChart {...coreProps} />
						<BatteryChart system={system} {...coreProps} />
						{hasGpuPowerData && <GpuPowerChart chartData={chartData} grid={grid} dataEmpty={dataEmpty} />}
					</div>

					{hasGpuData && lastGpus && (
						<GpuCharts
							chartData={chartData}
							grid={grid}
							dataEmpty={dataEmpty}
							lastGpus={lastGpus as Record<string, GPUData>}
							hasGpuEnginesData={hasGpuEnginesData}
						/>
					)}

					<ExtraFsCharts systemData={systemData} />

					{hasZfs && <ZfsCharts systemData={systemData} />}
					{hasZfs && <LazyZfsTable systemId={system.id} />}
					{maybeHasSmartData && <LazySmartTable systemId={system.id} />}
					{hasContainersTable && <LazyContainersTable systemId={system.id} />}
					{hasSystemd && <LazySystemdTable systemId={system.id} />}
					{hasNetworkMonitors && <LazyNetworkMonitorsTable systemId={system.id} />}
				</div>
			)}
		</div>
	)
})
