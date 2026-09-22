import { memo } from "react"
import { useStore } from "@nanostores/react"
import { getPagePath } from "@nanostores/router"
import {
	LayoutDashboardIcon,
	ServerIcon,
	BellIcon,
	SettingsIcon,
	HardDriveIcon,
	BoxesIcon,
	FileTextIcon,
	PuzzleIcon,
	XIcon,
} from "lucide-react"
import { $router, basePath, Link, navigate } from "../router"
import { $alerts } from "@/lib/stores"
import { cn } from "@/lib/utils"

interface SidebarProps {
	mobileOpen?: boolean
	setMobileOpen?: (open: boolean) => void
	onOpenAlerts?: () => void
}

export const Sidebar = memo(({ mobileOpen, setMobileOpen, onOpenAlerts }: SidebarProps) => {
	const page = useStore($router)
	const alerts = useStore($alerts)
	const unreadAlertsCount = alerts ? Object.values(alerts).flat().length : 2

	const currentRoute = page?.route ?? "home"

	const navItems = [
		{
			id: "dashboard",
			label: "Dashboard",
			icon: LayoutDashboardIcon,
			href: basePath || "/",
			active: currentRoute === "home",
		},
		{
			id: "servers",
			label: "Servers",
			icon: ServerIcon,
			href: basePath || "/",
			active: currentRoute === "system",
		},
		{
			id: "alerts",
			label: "Alerts",
			icon: BellIcon,
			badge: unreadAlertsCount > 0 ? unreadAlertsCount : 2,
			onClick: () => {
				onOpenAlerts?.()
				setMobileOpen?.(false)
			},
			active: false,
		},
		{
			id: "settings",
			label: "Settings",
			icon: SettingsIcon,
			href: getPagePath($router, "settings"),
			active: currentRoute === "settings",
		},
	]

	const monitorItems = [
		{
			id: "infrastructure",
			label: "Infrastructure",
			icon: HardDriveIcon,
			href: basePath || "/",
			active: false,
		},
		{
			id: "containers",
			label: "Containers",
			icon: BoxesIcon,
			href: getPagePath($router, "containers"),
			active: currentRoute === "containers",
		},
		{
			id: "logs",
			label: "Logs",
			icon: FileTextIcon,
			href: getPagePath($router, "smart"),
			active: currentRoute === "smart",
		},
		{
			id: "integrations",
			label: "Integrations",
			icon: PuzzleIcon,
			href: getPagePath($router, "monitors"),
			active: currentRoute === "monitors",
		},
	]

	return (
		<>
			{/* Mobile Backdrop */}
			{mobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
					onClick={() => setMobileOpen?.(false)}
				/>
			)}

				<aside
					className={cn(
						"fixed top-0 bottom-0 left-0 z-50 flex flex-col w-52 bg-card border-r border-border/80 transition-transform duration-300 md:translate-x-0 select-none shadow-xs",
						mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
					)}
				>
					{/* Top Logo Area */}
					<div className="flex items-center justify-between px-4 pt-5 pb-3">
						<Link
							href={basePath || "/"}
							className="flex items-center gap-2.5 group"
							onClick={() => setMobileOpen?.(false)}
						>
							<div className="relative flex items-center justify-center size-8.5 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/25 flex-shrink-0">
								{/* Blue Archive / Schale Geometric Logo Mark */}
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.4"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="size-4.5"
								>
									<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
								</svg>
								{/* Halo Accent */}
								<span className="absolute -top-1 -right-0.5 size-2.5 rounded-full border-1.5 border-sky-300 bg-sky-100 dark:bg-sky-950 animate-pulse" />
							</div>
							<div className="flex flex-col">
								<span className="text-base font-bold tracking-tight text-foreground font-sans flex items-center leading-none">
									Beszel
								</span>
								<span className="text-[10px] text-muted-foreground font-medium tracking-tight mt-1 leading-none">
									Server Monitoring Hub
								</span>
							</div>
						</Link>

						{mobileOpen && (
							<button
								onClick={() => setMobileOpen?.(false)}
								className="p-1 rounded-lg text-muted-foreground hover:bg-accent md:hidden"
							>
								<XIcon className="size-4" />
							</button>
						)}
					</div>

					{/* Main Navigation Links */}
					<nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-hide">
						{navItems.map((item) => {
							const Icon = item.icon
							const isActive = item.active

							if (item.onClick) {
								return (
									<button
										key={item.id}
										onClick={item.onClick}
										className={cn(
											"w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-[13px] transition-all duration-150 group",
											isActive
												? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold"
												: "text-muted-foreground hover:text-foreground hover:bg-accent/60"
										)}
									>
										<div className="flex items-center gap-2.5">
											<Icon
												className={cn(
													"size-4.5 transition-transform group-hover:scale-105",
													isActive ? "text-sky-500" : "text-muted-foreground"
												)}
											/>
											<span>{item.label}</span>
										</div>
										{item.badge !== undefined && (
											<span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-xs">
												{item.badge}
											</span>
										)}
									</button>
								)
							}

							return (
								<Link
									key={item.id}
									href={item.href!}
									onClick={() => setMobileOpen?.(false)}
									className={cn(
										"flex items-center justify-between px-3 py-2 rounded-xl font-medium text-[13px] transition-all duration-150 group",
										isActive
											? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold shadow-xs"
											: "text-muted-foreground hover:text-foreground hover:bg-accent/60"
									)}
								>
									<div className="flex items-center gap-2.5">
										<Icon
											className={cn(
												"size-4.5 transition-transform group-hover:scale-105",
												isActive ? "text-sky-500" : "text-muted-foreground"
											)}
										/>
										<span>{item.label}</span>
									</div>
									{item.badge !== undefined && (
										<span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
											{item.badge}
										</span>
									)}
								</Link>
							)
						})}

						{/* Section: MONITOR */}
						<div className="pt-4 pb-1 px-2.5">
							<span className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
								MONITOR
							</span>
						</div>

						{monitorItems.map((item) => {
							const Icon = item.icon
							const isActive = item.active

							return (
								<Link
									key={item.id}
									href={item.href}
									onClick={() => setMobileOpen?.(false)}
									className={cn(
										"flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[13px] transition-all duration-150 group",
										isActive
											? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold shadow-xs"
											: "text-muted-foreground hover:text-foreground hover:bg-accent/60"
									)}
								>
									<Icon
										className={cn(
											"size-4.5 transition-transform group-hover:scale-105",
											isActive ? "text-sky-500" : "text-muted-foreground"
										)}
									/>
									<span>{item.label}</span>
								</Link>
							)
						})}
					</nav>

					{/* Bottom City Skyline & Blue Archive / S.C.H.A.L.E Motto */}
					<div className="relative mt-auto border-t border-border/50 overflow-hidden bg-gradient-to-b from-transparent to-sky-50/40 dark:to-sky-950/20">
						<div className="relative z-10 px-4 pt-3 pb-3">
							<p className="text-[11px] font-semibold text-sky-700/80 dark:text-sky-300/80 tracking-wide font-sans leading-tight">
								いつも、
							</p>
							<p className="text-[12px] font-bold text-sky-800 dark:text-sky-200 tracking-wide leading-tight mt-0.5">
								安定した運用を。
							</p>
							<p className="text-[9.5px] text-muted-foreground/80 mt-1 leading-tight font-medium">
								A more peaceful infrastructure, together.
							</p>
							<div className="mt-2 pt-1.5 border-t border-sky-200/40 dark:border-sky-800/40 flex items-center justify-between text-[8.5px] font-bold text-sky-600/70 dark:text-sky-400/70 tracking-widest uppercase">
								<span>S.C.H.A.L.E.</span>
								<span>SYSTEMS</span>
							</div>
						</div>
					<img
						src="/assets/sidebar_footer.png"
						alt="Skyline"
						className="absolute bottom-0 left-0 right-0 w-full h-24 object-cover object-top opacity-20 pointer-events-none"
					/>
				</div>
			</aside>
		</>
	)
})
