import { memo, useState } from "react"
import { ChevronRightIcon, ChevronLeftIcon, SparklesIcon, HeartHandshakeIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export const AronaCompanionPanel = memo(function AronaCompanionPanel() {
	const [collapsed, setCollapsed] = useState(false)

	return (
		<aside
			className={cn(
				"relative transition-all duration-300 hidden xl:flex flex-col shrink-0 select-none",
				collapsed ? "w-10" : "w-80 2xl:w-92"
			)}
		>
			{/* Collapse/Expand Toggle Button */}
			<button
				onClick={() => setCollapsed((v) => !v)}
				className="absolute -left-3 top-6 z-20 size-6 rounded-full bg-card border border-border/80 shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-110 transition-all cursor-pointer"
				title={collapsed ? "Expand Arona Companion" : "Collapse"}
			>
				{collapsed ? <ChevronLeftIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
			</button>

			{collapsed ? (
				<div className="h-full rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col items-center py-6 gap-4 text-muted-foreground">
					<SparklesIcon className="size-4 text-sky-400 animate-spin" style={{ animationDuration: "6s" }} />
					<span className="text-[11px] font-bold writing-mode-vertical tracking-widest text-sky-600/80">
						ARONA
					</span>
				</div>
			) : (
				<div className="relative h-full min-h-[640px] rounded-3xl border border-sky-200/60 dark:border-sky-900/40 bg-gradient-to-b from-sky-50/50 via-card to-sky-100/30 dark:from-sky-950/20 dark:via-card dark:to-sky-950/30 overflow-hidden shadow-sm flex flex-col">
					{/* Top Motto */}
					<div className="p-5 z-10">
						<div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 text-xs font-bold tracking-tight">
							<SparklesIcon className="size-3.5" />
							<span>S.C.H.A.L.E. AI ASSISTANT</span>
						</div>
						<h4 className="text-sm font-semibold text-foreground mt-1 tracking-tight">
							Small Servers
						</h4>
						<h4 className="text-lg font-bold text-sky-600 dark:text-sky-400 leading-tight">
							Big Tomorrows.
						</h4>
					</div>

					{/* Arona Illustration Banner */}
					<div className="relative flex-1 flex items-center justify-center px-2">
						<img
							src="/assets/arona_panel.png"
							alt="Arona Assistant"
							className="w-full h-auto max-h-[520px] object-contain object-center drop-shadow-md transition-transform hover:scale-[1.02] duration-300 pointer-events-none"
						/>
					</div>

					{/* Bottom Handwritten Japanese Greeting */}
					<div className="p-5 pt-0 z-10 text-center">
						<div className="bg-card/80 backdrop-blur-xs rounded-2xl p-3 border border-sky-200/50 dark:border-sky-900/40 shadow-2xs">
							<p className="text-sm font-bold text-sky-800 dark:text-sky-200 tracking-wide font-sans">
								今日も、よくがんばりました。
							</p>
							<p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
								<span>GOOD SERVERS</span>
								<span>·</span>
								<span>GOOD STUDENTS</span>
							</p>
							<div className="mt-2 text-[10px] text-sky-600/70 dark:text-sky-400/70 font-semibold tracking-widest uppercase">
								A BRIGHTER TOMORROW
							</div>
						</div>
					</div>
				</div>
			)}
		</aside>
	)
})
