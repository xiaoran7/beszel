import { memo, useEffect, useRef, useState } from "react"
import { useStore } from "@nanostores/react"
import { RefreshCwIcon, PauseIcon, XIcon, SparklesIcon } from "lucide-react"
import { $frontendUpdate } from "@/lib/stores"
import { dismissUpdate, reloadPage } from "@/lib/version-checker"
import { Button } from "@/components/ui/button"

const COUNTDOWN_SECONDS = 15

export const VersionRefreshBanner = memo(() => {
	const update = useStore($frontendUpdate)
	const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
	const [isPaused, setIsPaused] = useState(false)
	const timerRef = useRef<number | null>(null)

	// Check if user is currently typing in an input or a modal dialog is open
	const checkUserInteracting = () => {
		if (typeof document === "undefined") return false
		const active = document.activeElement
		if (active) {
			const tag = active.tagName.toUpperCase()
			if (
				tag === "INPUT" ||
				tag === "TEXTAREA" ||
				tag === "SELECT" ||
				active.getAttribute("contenteditable") === "true"
			) {
				return true
			}
		}
		// Also check if any open dialog or sheet exists
		if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"]')) {
			return true
		}
		return false
	}

	useEffect(() => {
		if (!update.hasUpdate || update.dismissed) {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
			return
		}

		// Reset countdown when update is first flagged
		setCountdown(COUNTDOWN_SECONDS)

		timerRef.current = window.setInterval(() => {
			const activeInteracting = checkUserInteracting()
			setIsPaused(activeInteracting)

			if (!activeInteracting) {
				setCountdown((prev) => {
					if (prev <= 1) {
						if (timerRef.current) {
							clearInterval(timerRef.current)
							timerRef.current = null
						}
						reloadPage()
						return 0
					}
					return prev - 1
				})
			}
		}, 1000)

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
		}
	}, [update.hasUpdate, update.dismissed])

	if (!update.hasUpdate || update.dismissed) {
		return null
	}

	const progressPercent = Math.max(0, Math.min(100, (countdown / COUNTDOWN_SECONDS) * 100))

	const hasVersionDiff =
		update.newVersion && update.currentVersion && update.newVersion !== update.currentVersion

	return (
		<aside
			role="status"
			aria-live="polite"
			className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] sm:w-96 rounded-2xl bg-card/95 border border-sky-500/30 dark:border-sky-400/20 shadow-2xl backdrop-blur-xl p-4 text-foreground select-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
		>
			{/* Top Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-2.5">
					<div className="flex items-center justify-center size-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
						<RefreshCwIcon className="size-4 animate-spin [animation-duration:3.5s]" />
					</div>
					<div>
						<div className="flex items-center gap-1.5 font-bold text-sm tracking-tight">
							<span>发现新版本</span>
							<SparklesIcon className="size-3 text-amber-500" />
						</div>
						<div className="text-xs text-muted-foreground font-mono">
							{hasVersionDiff ? (
								<span>
									{update.currentVersion} →{" "}
									<span className="text-sky-600 dark:text-sky-400 font-semibold">
										{update.newVersion}
									</span>
								</span>
							) : (
								<span>前端资源已更新 (Bundle Updated)</span>
							)}
						</div>
					</div>
				</div>

				<button
					type="button"
					onClick={dismissUpdate}
					className="p-1 -mr-1 -mt-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/60 transition-colors"
					aria-label="稍后提醒 (Dismiss)"
					title="稍后提醒"
				>
					<XIcon className="size-4" />
				</button>
			</div>

			{/* Subtitle / Status */}
			<div className="mt-3 flex items-center justify-between text-xs">
				{isPaused ? (
					<span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
						<PauseIcon className="size-3" /> 检测到正在输入，自动刷新已暂停
					</span>
				) : (
					<span className="text-muted-foreground">
						页面将在 <span className="font-semibold text-foreground">{countdown}</span> 秒后自动刷新
					</span>
				)}
				<span className="font-mono text-[10px] text-muted-foreground">
					{countdown}s / {COUNTDOWN_SECONDS}s
				</span>
			</div>

			{/* Progress Bar */}
			<div className="mt-1.5 h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden">
				<div
					className={`h-full transition-all duration-1000 ease-linear rounded-full ${
						isPaused ? "bg-amber-500/80" : "bg-sky-500 dark:bg-sky-400"
					}`}
					style={{ width: `${progressPercent}%` }}
				/>
			</div>

			{/* Bottom Action Buttons */}
			<div className="mt-3.5 flex items-center justify-end gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={dismissUpdate}
					className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
				>
					稍后提醒
				</Button>
				<Button
					size="sm"
					onClick={reloadPage}
					className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 dark:bg-sky-500 dark:text-white dark:hover:bg-sky-600 shadow-sm"
				>
					<RefreshCwIcon className="size-3.5 mr-1.5" />
					立即刷新
				</Button>
			</div>
		</aside>
	)
})
