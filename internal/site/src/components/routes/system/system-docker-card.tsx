import { memo } from "react"
import { BoxesIcon, MoreVerticalIcon, CheckCircle2Icon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface ContainerItem {
	name: string
	iconBg: string
	iconText: string
	status: string
	cpu: string
	memory: string
	uptime: string
}

const DEFAULT_CONTAINERS: ContainerItem[] = [
	{
		name: "nginx",
		iconBg: "bg-emerald-600",
		iconText: "N",
		status: "Running",
		cpu: "0.4%",
		memory: "68 MB",
		uptime: "27d",
	},
	{
		name: "postgres",
		iconBg: "bg-blue-600",
		iconText: "P",
		status: "Running",
		cpu: "2.1%",
		memory: "1.2 GB",
		uptime: "27d",
	},
	{
		name: "agenthub",
		iconBg: "bg-slate-700 dark:bg-slate-600",
		iconText: "A",
		status: "Running",
		cpu: "0.7%",
		memory: "512 MB",
		uptime: "26d",
	},
	{
		name: "redis",
		iconBg: "bg-rose-600",
		iconText: "R",
		status: "Running",
		cpu: "0.3%",
		memory: "128 MB",
		uptime: "27d",
	},
]

export const SystemDockerCard = memo(function SystemDockerCard({
	containers = DEFAULT_CONTAINERS,
}: {
	containers?: ContainerItem[]
}) {
	return (
		<Card className="rounded-3xl border border-border/80 bg-card shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between select-none">
			<CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-5">
				<div className="flex items-center gap-2.5">
					<div className="flex items-center justify-center size-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
						<BoxesIcon className="size-4.5" />
					</div>
					<CardTitle className="text-base font-bold text-foreground">
						Docker Containers
					</CardTitle>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-xs font-semibold text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-full">
						{containers.length} / {containers.length} running
					</span>
					<button className="text-muted-foreground hover:text-foreground p-1">
						<MoreVerticalIcon className="size-4" />
					</button>
				</div>
			</CardHeader>

			<CardContent className="px-6 pb-5 pt-1">
				<div className="w-full overflow-x-auto">
					<table className="w-full text-xs text-left">
						<thead>
							<tr className="border-b border-border/60 text-muted-foreground font-semibold">
								<th className="pb-2.5 font-medium">Name</th>
								<th className="pb-2.5 font-medium">Status</th>
								<th className="pb-2.5 font-medium text-right">CPU</th>
								<th className="pb-2.5 font-medium text-right">Memory</th>
								<th className="pb-2.5 font-medium text-right">Uptime</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/40">
							{containers.map((c, i) => (
								<tr key={i} className="hover:bg-secondary/30 transition-colors group">
									<td className="py-2.5 pr-2 flex items-center gap-2.5 font-semibold text-foreground">
										<div
											className={`size-6 rounded-md ${c.iconBg} text-white flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0`}
										>
											{c.iconText}
										</div>
										<span className="truncate max-w-[120px] font-mono group-hover:text-primary transition-colors">
											{c.name}
										</span>
									</td>
									<td className="py-2.5 px-2">
										<span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
											<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
											{c.status}
										</span>
									</td>
									<td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
										{c.cpu}
									</td>
									<td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
										{c.memory}
									</td>
									<td className="py-2.5 pl-2 text-right font-mono text-muted-foreground">
										{c.uptime}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	)
})
