import "./index.css"
import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { useStore } from "@nanostores/react"
import { DirectionProvider } from "@radix-ui/react-direction"
import { lazy, memo, Suspense, useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import { $router } from "@/components/router.tsx"
import Settings from "@/components/routes/settings/layout.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/toaster.tsx"
import { alertManager } from "@/lib/alerts"
import { isAdmin, pb, updateUserSettings } from "@/lib/api.ts"
import { dynamicActivate, getLocale } from "@/lib/i18n"
import {
	$authenticated,
	$copyContent,
	$direction,
	$newVersion,
	$publicKey,
	$userSettings,
} from "@/lib/stores.ts"
import * as systemsManager from "@/lib/systemsManager.ts"
import type { BeszelInfo, UpdateInfo } from "./types"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { GlobalAlertsSheet } from "@/components/alerts/global-alerts-sheet"

const LoginPage = lazy(() => import("@/components/login/login.tsx"))
const Home = lazy(() => import("@/components/routes/home.tsx"))
const Containers = lazy(() => import("@/components/routes/containers.tsx"))
const Smart = lazy(() => import("@/components/routes/smart.tsx"))
const Monitors = lazy(() => import("@/components/routes/monitors.tsx"))
const SystemDetail = lazy(() => import("@/components/routes/system.tsx"))
const CopyToClipboardDialog = lazy(() => import("@/components/copy-to-clipboard.tsx"))

const App = memo(() => {
	const page = useStore($router)

	useEffect(() => {
		// change auth store on auth change
		const unsubscribeAuth = pb.authStore.onChange(() => {
			$authenticated.set(pb.authStore.isValid)
		})
		// get general info for authenticated users, such as public key and version
		pb.send<BeszelInfo>("/api/beszel/info", {}).then((data) => {
			$publicKey.set(data.key)
			// check for updates if enabled
			if (data.cu && isAdmin()) {
				pb.send<UpdateInfo>("/api/beszel/update", {}).then($newVersion.set)
			}
		})
		// get user settings
		updateUserSettings()
		// need to get system list before alerts
		systemsManager.init()
		systemsManager
			// get current systems list
			.refresh()
			// subscribe to new system updates
			.then(systemsManager.subscribe)
			// get current alerts
			.then(alertManager.refresh)
			// subscribe to new alert updates
			.then(alertManager.subscribe)
		return () => {
			unsubscribeAuth()
			alertManager.unsubscribe()
			systemsManager.unsubscribe()
		}
	}, [])

	if (!page) {
		return <h1 className="text-3xl text-center my-14">404</h1>
	} else if (page.route === "home") {
		return <Home />
	} else if (page.route === "system") {
		return <SystemDetail id={page.params.id} />
	} else if (page.route === "containers") {
		return <Containers />
	} else if (page.route === "smart") {
		return <Smart />
	} else if (page.route === "monitors") {
		return <Monitors />
	} else if (page.route === "settings") {
		return <Settings />
	}
})

const Layout = () => {
	const authenticated = useStore($authenticated)
	const copyContent = useStore($copyContent)
	const direction = useStore($direction)
	const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
	const [alertsSheetOpen, setAlertsSheetOpen] = useState(false)

	useEffect(() => {
		document.documentElement.dir = direction
	}, [direction])

	return (
		<DirectionProvider dir={direction}>
			{!authenticated ? (
				<Suspense>
					<LoginPage />
				</Suspense>
			) : (
				<div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased selection:bg-sky-500/20 selection:text-sky-600">
					{/* Left Sidebar */}
					<Sidebar
						mobileOpen={sidebarMobileOpen}
						setMobileOpen={setSidebarMobileOpen}
						onOpenAlerts={() => setAlertsSheetOpen(true)}
					/>

					{/* Right Content Area */}
					<div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
						<Topbar
							onToggleSidebar={() => setSidebarMobileOpen((prev) => !prev)}
							onOpenAlerts={() => setAlertsSheetOpen(true)}
						/>
						<main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1720px] w-full mx-auto">
							<App />
						</main>
					</div>

					{/* Global Alerts Drawer */}
					<GlobalAlertsSheet open={alertsSheetOpen} onOpenChange={setAlertsSheetOpen} />

					{copyContent && (
						<Suspense>
							<CopyToClipboardDialog content={copyContent} />
						</Suspense>
					)}
				</div>
			)}
		</DirectionProvider>
	)
}

const I18nApp = () => {
	useEffect(() => {
		// Activate a locale so I18nProvider can mount App and load the account settings.
		dynamicActivate(getLocale())
	}, [])

	return (
		<I18nProvider i18n={i18n}>
			<ThemeProvider>
				<Layout />
				<Toaster />
			</ThemeProvider>
		</I18nProvider>
	)
}

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
	<I18nApp />
)
