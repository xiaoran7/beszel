import { memo, useState } from "react"
import { useStore } from "@nanostores/react"
import { getPagePath } from "@nanostores/router"
import {
	SearchIcon,
	MenuIcon,
	ChevronRightIcon,
	ServerIcon,
	PlusIcon,
	ChevronDownIcon,
	LogOutIcon,
	SettingsIcon,
	GlobeIcon,
	UserIcon,
	BellIcon,
} from "lucide-react"
import { $router, basePath, Link, navigate } from "../router"
import { $systems } from "@/lib/stores"
import { ModeToggle } from "../mode-toggle"
import { pb, logOut } from "@/lib/api"
import { AddSystemDialog } from "../add-system"
import CommandPalette from "../command-palette"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface TopbarProps {
	onToggleSidebar: () => void
	onOpenAlerts?: () => void
}

export const Topbar = memo(({ onToggleSidebar, onOpenAlerts }: TopbarProps) => {
	const page = useStore($router)
	const systems = useStore($systems)
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
	const [addSystemDialogOpen, setAddSystemDialogOpen] = useState(false)

	const isMac = typeof navigator !== "undefined" && navigator.platform?.toUpperCase().includes("MAC")

	// Determine current system name for breadcrumb if in system route
	const currentSystem =
		page?.route === "system" && page.params?.id
			? systems.find((s) => s.id === page.params.id)
			: null

	return (
		<>
			<CommandPalette open={commandPaletteOpen} setOpen={setCommandPaletteOpen} />
			<AddSystemDialog open={addSystemDialogOpen} setOpen={setAddSystemDialogOpen} />

			<header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-card/85 backdrop-blur-md border-b border-border/70 transition-all select-none">
				{/* Left Area: Mobile Menu Toggle & Breadcrumbs */}
				<div className="flex items-center gap-3">
					<button
						onClick={onToggleSidebar}
						className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60 md:hidden"
						aria-label="Toggle menu"
					>
						<MenuIcon className="size-5" />
					</button>

					{/* Breadcrumbs or Subtitle */}
					{currentSystem ? (
						<div className="flex items-center gap-2 text-sm">
							<Link
								href={basePath || "/"}
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
							>
								<ServerIcon className="size-4" />
								<span>Servers</span>
							</Link>
							<ChevronRightIcon className="size-4 text-muted-foreground/60" />
							<span className="font-semibold text-foreground tracking-tight">
								{currentSystem.name}
							</span>
						</div>
					) : (
						<div className="hidden sm:flex flex-col">
							<div className="flex items-center gap-2">
								<span className="text-base font-bold text-foreground tracking-tight font-sans">
									Beszel
								</span>
								<span className="text-xs text-muted-foreground font-medium">
									Server Monitoring Hub
								</span>
							</div>
							<span className="text-[11px] text-sky-600/80 dark:text-sky-400/80 font-sans tracking-wide">
								つながる、見守る、ずっと。
							</span>
						</div>
					)}
				</div>

				{/* Center: Global Search Bar with Ctrl+K */}
				<div className="flex-1 max-w-md mx-4 hidden md:block">
					<button
						type="button"
						onClick={() => setCommandPaletteOpen(true)}
						className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary/90 border border-border/60 text-xs text-muted-foreground transition-all shadow-2xs group"
					>
						<div className="flex items-center gap-2">
							<SearchIcon className="size-3.5 text-muted-foreground/80 group-hover:text-primary transition-colors" />
							<span className="truncate">Search servers, regions, or tags...</span>
						</div>
						<div className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-card border border-border/70 text-[10px] font-mono font-medium text-muted-foreground shadow-2xs">
							<span>{isMac ? "⌘" : "Ctrl"}</span>
							<span>K</span>
						</div>
					</button>
				</div>

				{/* Right Area: Action Controls & User Avatar */}
				<div className="flex items-center gap-2 sm:gap-3">
					{/* Add System quick button */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setAddSystemDialogOpen(true)}
						className="hidden lg:flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
					>
						<PlusIcon className="size-3.5" />
						<span>Add Server</span>
					</Button>

					{/* Search icon for mobile */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setCommandPaletteOpen(true)}
						className="rounded-full size-8 md:hidden text-muted-foreground"
					>
						<SearchIcon className="size-4" />
					</Button>

					{/* Theme Mode Toggle */}
					<ModeToggle />

					{/* Alerts Bell */}
					<Button
						variant="ghost"
						size="icon"
						onClick={onOpenAlerts}
						className="relative rounded-full size-8 text-muted-foreground hover:text-foreground"
						aria-label="Alerts"
					>
						<BellIcon className="size-4.5" />
						<span className="absolute top-1 right-1 size-2 rounded-full bg-rose-500 ring-2 ring-card animate-pulse" />
					</Button>

						{/* Sensei User Profile Button & Menu (Aligned with Reference & Highlighted Box) */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-card/90 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/80 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs group">
									<div className="relative size-7.5 rounded-full overflow-hidden ring-1 ring-sky-300/80 dark:ring-sky-500/70 bg-sky-100/50 flex-shrink-0 shadow-2xs">
										<img
											src="/assets/sensei_avatar.png"
											alt="Sensei"
											className="w-full h-full object-cover group-hover:scale-105 transition-transform"
											onError={(e) => {
												(e.target as HTMLElement).style.display = "none"
											}}
										/>
										<div className="w-full h-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
											S
										</div>
									</div>
										<div className="flex flex-col text-left">
											<span className="text-xs font-bold text-foreground leading-tight tracking-tight">
												{pb.authStore.record?.name || "Sensei"}
											</span>
											<span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold leading-tight flex items-center gap-1">
												<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
												Online
											</span>
										</div>
										<ChevronDownIcon className="size-3.5 text-muted-foreground/70 ml-0.5 group-hover:text-foreground transition-colors" />
									</button>
								</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-lg border-border/80">
								<DropdownMenuLabel className="px-3 py-2 font-normal">
									<div className="flex flex-col space-y-1">
										<p className="text-xs font-bold leading-none text-foreground">
											{pb.authStore.record?.name || "Sensei"}
										</p>
										<p className="text-[11px] leading-none text-muted-foreground truncate">
											{pb.authStore.record?.email || "sensei@schale.edu"}
										</p>
									</div>
								</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem
									onClick={() => navigate(getPagePath($router, "settings", { name: "general" }))}
									className="rounded-xl cursor-pointer text-xs py-2"
								>
									<SettingsIcon className="mr-2 size-4 text-muted-foreground" />
									<span>Settings</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => navigate(getPagePath($router, "settings", { name: "users" }))}
									className="rounded-xl cursor-pointer text-xs py-2"
								>
									<UserIcon className="mr-2 size-4 text-muted-foreground" />
									<span>Profile & Keys</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => logOut()}
								className="rounded-xl cursor-pointer text-xs py-2 text-rose-500 hover:text-rose-600 focus:text-rose-600"
							>
								<LogOutIcon className="mr-2 size-4" />
								<span>Log Out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>
		</>
	)
})
