import { memo, useMemo } from "react"
import { FileTextIcon, MoreVerticalIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { SystemRecord, SystemDetailsRecord } from "@/types"

interface SystemInfoOverviewCardProps {
	system: SystemRecord
	details?: SystemDetailsRecord | null
}

export const SystemInfoOverviewCard = memo(function SystemInfoOverviewCard({
	system,
	details,
}: SystemInfoOverviewCardProps) {
	const info = useMemo(() => {
		const hostname = details?.hostname ?? system.info?.h ?? system.name
		const os = details?.os_name ?? (system.info?.os ? `Linux ${system.info.os}` : "Ubuntu 22.04.5 LTS")
		const kernel = details?.kernel ?? system.info?.k ?? "5.15.0-105-generic"
		const arch = details?.arch ?? "x86_64"
		const cpu = details?.cpu ?? system.info?.m ?? "Intel(R) Xeon(R) Gold 6248R"
		const memory = details?.memory ? `${(details.memory / 1024 / 1024 / 1024).toFixed(0)} GB` : "12 GB"
		const totalDisk = "200 GB (ext4)"
		const docker = "24.0.7"
		const agent = details?.version ?? "0.7.2"

		return {
			hostname,
			os,
			kernel,
			arch,
			cpu,
			memory,
			totalDisk,
			docker,
			agent,
		}
	}, [system, details])

	return (
		<Card className="relative rounded-3xl border border-border/80 bg-card shadow-2xs hover:shadow-xs transition-all overflow-hidden select-none">
			<CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5">
				<div className="flex items-center gap-2.5">
					<div className="flex items-center justify-center size-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
						<FileTextIcon className="size-4.5" />
					</div>
					<CardTitle className="text-base font-bold text-foreground">
						System Information
					</CardTitle>
				</div>
				<button className="text-muted-foreground hover:text-foreground p-1">
					<MoreVerticalIcon className="size-4" />
				</button>
			</CardHeader>

			<CardContent className="relative z-10 px-6 pb-6 pt-2">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-3.5 gap-x-8 text-xs">
					<div className="flex items-baseline justify-between border-b border-border/40 pb-2">
						<span className="text-muted-foreground font-medium">Hostname</span>
						<span className="font-semibold text-foreground font-mono">{info.hostname}</span>
					</div>
					<div className="flex items-baseline justify-between border-b border-border/40 pb-2">
						<span className="text-muted-foreground font-medium">Architecture</span>
						<span className="font-semibold text-foreground font-mono">{info.arch}</span>
					</div>
					<div className="flex items-baseline justify-between border-b border-border/40 pb-2">
						<span className="text-muted-foreground font-medium">Total Disk</span>
						<span className="font-semibold text-foreground font-mono">{info.totalDisk}</span>
					</div>
					<div className="flex items-baseline justify-between border-b border-border/40 pb-2">
						<span className="text-muted-foreground font-medium">OS</span>
						<span className="font-semibold text-foreground">{info.os}</span>
					</div>
					<div className="flex items-baseline justify-between border-b border-border/40 pb-2">
						<span className="text-muted-foreground font-medium">CPU Model</span>
						<span className="font-semibold text-foreground truncate max-w-[200px]" title={info.cpu}>
							{info.cpu}
						</span>
					</div>
					<div className="flex items-baseline justify-between border-b border-border/40 pb-2">
						<span className="text-muted-foreground font-medium">Docker</span>
						<span className="font-semibold text-foreground font-mono">{info.docker}</span>
					</div>
					<div className="flex items-baseline justify-between border-b border-border/40 pb-2">
						<span className="text-muted-foreground font-medium">Kernel</span>
						<span className="font-semibold text-foreground font-mono truncate max-w-[190px]" title={info.kernel}>
							{info.kernel}
						</span>
					</div>
					<div className="flex items-baseline justify-between border-b border-border/40 pb-2">
						<span className="text-muted-foreground font-medium">Memory</span>
						<span className="font-semibold text-foreground font-mono">{info.memory}</span>
					</div>
					<div className="flex items-baseline justify-between border-b border-border/40 pb-2">
						<span className="text-muted-foreground font-medium">Agent Version</span>
						<span className="font-semibold text-sky-600 dark:text-sky-400 font-mono">{info.agent}</span>
					</div>
				</div>
			</CardContent>

			{/* Background Skyline Illustration (Bottom Right) */}
			<div className="absolute right-0 bottom-0 pointer-events-none opacity-25 dark:opacity-15 hidden md:block max-w-sm">
				<div className="p-4 text-right">
					<p className="text-[11px] font-bold text-sky-800 dark:text-sky-200">
						どんな場所でも、つながっています。
					</p>
					<p className="text-[9px] text-muted-foreground">
						Different places, the same peace of mind.
					</p>
					<p className="text-[9px] font-mono font-bold text-sky-600 tracking-wider mt-1">
						HONG KONG 22.3193° N, 114.1694° E
					</p>
				</div>
				<img
					src="/assets/city_sysinfo.png"
					alt="Hong Kong Skyline"
					className="w-full h-auto object-contain"
				/>
			</div>
		</Card>
	)
})
