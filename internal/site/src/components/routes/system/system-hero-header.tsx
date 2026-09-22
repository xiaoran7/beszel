import { memo, useState } from "react"
import { ServerIcon, Edit2Icon, CheckIcon, SparklesIcon, HeartIcon } from "lucide-react"
import { SystemStatus } from "@/lib/enums"
import { cn } from "@/lib/utils"
import type { SystemRecord } from "@/types"

interface SystemHeroHeaderProps {
	system: SystemRecord
	onUpdateName?: (name: string) => void
}

export const SystemHeroHeader = memo(function SystemHeroHeader({
	system,
	onUpdateName,
}: SystemHeroHeaderProps) {
	const [editing, setEditing] = useState(false)
	const [description, setDescription] = useState(
		system.host ? `${system.host}` : "Production Server"
	)

	const isOnline = system.status === SystemStatus.Up

	return (
		<div className="relative flex flex-col lg:flex-row items-stretch justify-between p-6 rounded-3xl bg-card border border-border/80 shadow-xs overflow-hidden select-none gap-6">
			{/* Left Column: Server Identification & Status */}
			<div className="flex items-center gap-4 z-10">
				<div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-sky-400/10 to-indigo-500/10 text-sky-600 dark:text-sky-400 shrink-0 border border-sky-300/40 dark:border-sky-800/40 shadow-xs">
					<ServerIcon className="size-8" />
				</div>
				<div className="flex flex-col">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
							{system.name}
						</h1>
						{/* Status Badge */}
						<span
							className={cn(
								"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-tight uppercase shadow-2xs",
								isOnline
									? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
									: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
							)}
						>
							<span
								className={cn(
									"size-2 rounded-full",
									isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
								)}
							/>
							<span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
						</span>
					</div>

					{/* Description & Inline Edit */}
					<div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground font-medium">
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
								<span>{description}</span>
								<Edit2Icon className="size-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Center: Arona Heartfelt Reassurance Speech Bubble */}
			<div className="hidden xl:flex items-center justify-center flex-1 z-10 px-4">
				<div className="relative px-5 py-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/50 shadow-2xs flex flex-col">
					<div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 text-xs font-bold">
						<SparklesIcon className="size-3.5 text-sky-400" />
						<span className="font-sans">「今日も、きっと大丈夫です。」</span>
					</div>
					<span className="text-[11px] text-muted-foreground font-medium mt-0.5">
						All systems are running well today.
					</span>
					{/* Decorative Speech Bubble Tail */}
					<div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-b-6 border-b-transparent border-l-6 border-l-sky-200/60 dark:border-l-sky-800/50" />
				</div>
			</div>

			{/* Right: Arona Illustration & S.C.H.A.L.E. Halo Banner */}
			<div className="relative flex items-center justify-end z-10 shrink-0">
				<div className="flex items-center gap-4">
					<div className="flex flex-col text-right">
						<span className="text-sm font-bold text-sky-800 dark:text-sky-200 tracking-wide font-sans">
							ずっと、見守っていますよ。
						</span>
						<span className="text-[11px] text-muted-foreground font-medium">
							I'm always keeping an eye on things.
						</span>
						<div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-sky-600/70 dark:text-sky-400/70 uppercase tracking-widest mt-1">
							<span>S.C.H.A.L.E.</span>
							<span>·</span>
							<span>FOR A MORE STABLE TOMORROW</span>
						</div>
					</div>

					{/* Arona Avatar Frame with Ring */}
					<div className="relative size-15 rounded-2xl overflow-hidden ring-2 ring-sky-300/60 dark:ring-sky-600/40 shadow-sm shrink-0 bg-sky-100/40 dark:bg-sky-950/40">
						<img
							src="/assets/arona_head.png"
							alt="Arona S.C.H.A.L.E."
							className="w-full h-full object-cover object-top scale-110 pointer-events-none"
							onError={(e) => {
								(e.target as HTMLElement).style.display = "none"
							}}
						/>
						{/* Subtle Angelic Halo Light */}
						<span className="absolute -top-2 -right-2 size-6 rounded-full bg-sky-400/30 blur-xs" />
					</div>
				</div>
			</div>

			{/* Background Ambient Glow */}
			<div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-sky-400/8 via-indigo-400/4 to-transparent pointer-events-none" />
		</div>
	)
})
