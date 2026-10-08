import { memo, useState, useMemo } from "react"
import { ServerIcon, Edit2Icon, CheckIcon, SparklesIcon, GlobeIcon, ChevronRightSquareIcon } from "lucide-react"
import { ConnectionType, connectionTypeLabels, SystemStatus } from "@/lib/enums"
import { cn, getServerPublicIp } from "@/lib/utils"
import type { SystemRecord } from "@/types"
import AlertButton from "@/components/alerts/alert-button"
import { ActionsButton } from "@/components/systems-table/systems-table-columns"
import { WebSocketIcon } from "@/components/ui/icons"

interface SystemHeroHeaderProps {
	system: SystemRecord
	onUpdateName?: (name: string) => void
}

export const SystemHeroHeader = memo(function SystemHeroHeader({
	system,
	onUpdateName,
}: SystemHeroHeaderProps) {
	const publicIp = useMemo(() => getServerPublicIp(system.host), [system.host])
	const [editing, setEditing] = useState(false)
	const [description, setDescription] = useState(
		system.host ? `${system.host}` : "Production Server"
	)

	const isOnline = system.status === SystemStatus.Up
	const isPaused = system.status === SystemStatus.Paused

	return (
		<div className="relative flex flex-col lg:flex-row items-stretch justify-between p-6 rounded-3xl bg-card border border-border/80 shadow-xs overflow-hidden select-none gap-6">
			{/* Left Column: Server Identification, Status & Actions */}
			<div className="flex items-start sm:items-center gap-4 z-10 flex-1">
				<div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-sky-400/10 to-indigo-500/10 text-sky-600 dark:text-sky-400 shrink-0 border border-sky-300/40 dark:border-sky-800/40 shadow-xs">
					<ServerIcon className="size-8" />
				</div>
				<div className="flex flex-col min-w-0 flex-1">
					<div className="flex items-center gap-3 flex-wrap">
						<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans truncate">
							{system.name}
						</h1>
						{/* Status Badge */}
						<span
							className={cn(
								"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-tight uppercase shadow-2xs shrink-0",
								isOnline
									? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
									: isPaused
									? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
									: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
							)}
						>
							<span
								className={cn(
									"size-2 rounded-full",
									isOnline ? "bg-emerald-500 animate-pulse" : isPaused ? "bg-amber-500" : "bg-rose-500"
								)}
							/>
							<span>{isOnline ? "ONLINE" : isPaused ? "PAUSED" : "OFFLINE"}</span>
						</span>

						{/* Connection Protocol Badge */}
						{system.info?.ct && (
							<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/60">
								{system.info.ct === ConnectionType.WebSocket ? (
									<WebSocketIcon className="size-3 text-sky-500" />
								) : (
									<ChevronRightSquareIcon className="size-3 text-muted-foreground" strokeWidth={2} />
								)}
								<span>{connectionTypeLabels[system.info.ct as ConnectionType] || "Agent"}</span>
							</span>
						)}

						{/* Actions Toolbar */}
						<div className="flex items-center gap-1.5 ml-auto sm:ml-0 bg-secondary/60 border border-border/60 rounded-xl px-1.5 py-0.5 [&_button]:size-7 [&_button]:p-0">
							<AlertButton system={system} />
							<ActionsButton system={system} />
						</div>
					</div>

					{/* Description & Inline Edit */}
					<div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground font-medium flex-wrap">
						{publicIp && (
							<span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold text-xs px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 tabular-nums">
								<GlobeIcon className="size-3" />
								<span>Public: {publicIp}</span>
							</span>
						)}
						{editing ? (
							<div className="flex items-center gap-1.5">
								<input
									type="text"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="px-2 py-0.5 text-xs rounded-md bg-secondary border border-border text-foreground focus:outline-hidden focus:ring-1 focus:ring-sky-400"
									autoFocus
								/>
								<button
									onClick={() => setEditing(false)}
									className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
								>
									<CheckIcon className="size-3.5" />
								</button>
							</div>
						) : (
							<div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setEditing(true)}>
								<span>Mesh: {description}</span>
								<Edit2Icon className="size-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Center: Arona Heartfelt Reassurance Speech Bubble */}
			<div className="hidden 2xl:flex items-center justify-center z-10 px-2">
				<div className="relative px-4 py-2.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/50 shadow-2xs flex flex-col">
					<div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 text-xs font-bold">
						<SparklesIcon className="size-3.5 text-sky-400" />
						<span className="font-sans">「今日も、きっと大丈夫です。」</span>
					</div>
					<span className="text-[11px] text-muted-foreground font-medium mt-0.5">
						All systems are running well today.
					</span>
				</div>
			</div>

			{/* Right: Authentic Arona Header Illustration from Reference 2 */}
			<div className="relative hidden md:flex items-center justify-end z-10 shrink-0 h-32 w-72 lg:w-84 overflow-hidden rounded-2xl">
				<img
					src="/assets/arona_header.png"
					alt="Arona S.C.H.A.L.E."
					className="w-full h-full object-contain object-right pointer-events-none drop-shadow-xs"
				/>
			</div>

			{/* Background Ambient Glow */}
			<div className="absolute top-0 right-0 w-[420px] h-full bg-gradient-to-l from-sky-300/10 via-sky-400/5 to-transparent pointer-events-none" />
		</div>
	)
})
