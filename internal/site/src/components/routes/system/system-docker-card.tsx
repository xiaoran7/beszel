import { memo, useEffect, useState, useMemo } from "react"
import { BoxesIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { pb } from "@/lib/api"
import type { ContainerRecord } from "@/types"
import { decimalString, formatBytes } from "@/lib/utils"

export const SystemDockerCard = memo(function SystemDockerCard({
	systemId,
}: {
	systemId?: string
}) {
	const [containers, setContainers] = useState<ContainerRecord[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!systemId) {
			setContainers([])
			setLoading(false)
			return
		}

		let active = true

		pb.collection<ContainerRecord>("containers")
			.getList(0, 50, {
				fields: "id,name,image,cpu,memory,net,status,updated",
				filter: pb.filter("system={:system}", { system: systemId }),
				sort: "-cpu",
			})
			.then(({ items }) => {
				if (active) {
					setContainers(items)
					setLoading(false)
				}
			})
			.catch(() => {
				if (active) {
					setContainers([])
					setLoading(false)
				}
			})

		return () => {
			active = false
		}
	}, [systemId])

	const formattedContainers = useMemo(() => {
		return containers.map((c) => {
			const initial = (c.name || "C").charAt(0).toUpperCase()
			// Palette hashing for aesthetic container badge
			const colors = [
				"bg-emerald-600",
				"bg-blue-600",
				"bg-slate-700 dark:bg-slate-600",
				"bg-rose-600",
				"bg-amber-600",
				"bg-indigo-600",
			]
			const colorIndex = Math.abs(
				c.name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
			) % colors.length

			const memBytes = (c.memory || 0) * 1024 * 1024
			const memFormatted = formatBytes(memBytes, false)

			return {
				id: c.id,
				name: c.name,
				iconBg: colors[colorIndex],
				iconText: initial,
				status: c.status || "running",
				cpu: `${decimalString(c.cpu || 0, 1)}%`,
				memory: `${decimalString(memFormatted.value, 1)} ${memFormatted.unit}`,
			}
		})
	}, [containers])

	return (
		<Card className="rounded-3xl border border-border/80 bg-card shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between select-none">
			<CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-5">
				<div className="flex items-center gap-2.5">
					<div className="flex items-center justify-center size-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
						<BoxesIcon className="size-4.5" />
					</div>
					<CardTitle className="text-base font-bold text-foreground">
						Containers
					</CardTitle>
				</div>
					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-full">
							{formattedContainers.length} running
						</span>
					</div>
			</CardHeader>

			<CardContent className="px-6 pb-5 pt-1">
				<div className="w-full overflow-x-auto min-h-[160px] flex flex-col justify-center">
					{loading ? (
						<div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
							Loading container metrics...
						</div>
					) : formattedContainers.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
							<span className="text-xs font-medium">No active containers found</span>
							<span className="text-[11px] opacity-75 mt-0.5">Docker/Podman containers will appear here when running</span>
						</div>
					) : (
						<table className="w-full text-xs text-left">
							<thead>
								<tr className="border-b border-border/60 text-muted-foreground font-semibold">
									<th className="pb-2.5 font-medium">Name</th>
									<th className="pb-2.5 font-medium">Status</th>
									<th className="pb-2.5 font-medium text-right">CPU</th>
									<th className="pb-2.5 font-medium text-right">Memory</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/40">
								{formattedContainers.slice(0, 5).map((c) => (
									<tr key={c.id} className="hover:bg-secondary/30 transition-colors group">
										<td className="py-2.5 pr-2 flex items-center gap-2.5 font-semibold text-foreground">
											<div
												className={`size-6 rounded-md ${c.iconBg} text-white flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0`}
											>
												{c.iconText}
											</div>
											<span className="truncate max-w-[140px] font-mono group-hover:text-primary transition-colors">
												{c.name}
											</span>
										</td>
										<td className="py-2.5 px-2">
											<span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
												<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
												{c.status}
											</span>
										</td>
										<td className="py-2.5 px-2 text-right font-mono text-foreground font-medium">
											{c.cpu}
										</td>
										<td className="py-2.5 pl-2 text-right font-mono text-muted-foreground">
											{c.memory}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</CardContent>
		</Card>
	)
})

