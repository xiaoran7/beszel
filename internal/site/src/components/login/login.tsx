import { t } from "@lingui/core/macro"
import { useStore } from "@nanostores/react"
import type { AuthMethodsList } from "pocketbase"
import { useEffect, useMemo, useState } from "react"
import { UserAuthForm } from "@/components/login/auth-form"
import { pb } from "@/lib/api"
import { ModeToggle } from "../mode-toggle"
import { $router } from "../router"
import ForgotPassword from "./forgot-pass-form"
import { OtpRequestForm } from "./otp-forms"

export default function Login() {
	const page = useStore($router)
	const [isFirstRun, setFirstRun] = useState(false)
	const [authMethods, setAuthMethods] = useState<AuthMethodsList>()

	useEffect(() => {
		document.title = "Sign In / Beszel"

		pb.send("/api/beszel/first-run", {}).then(({ firstRun }) => {
			setFirstRun(firstRun)
		})
	}, [])

	useEffect(() => {
		pb.collection("users")
			.listAuthMethods()
			.then((methods) => {
				setAuthMethods(methods)
			})
			.catch(() => {
				// Fallback mock methods for offline / dev preview
				setAuthMethods({ authProviders: [] } as any)
			})
	}, [])

	const subtitle = useMemo(() => {
		if (isFirstRun) {
			return "Please create an admin account"
		} else if (page?.route === "forgot_password") {
			return "Enter email address to reset password"
		} else if (page?.route === "request_otp") {
			return "Request a one-time password"
		} else {
			return "Please sign in with your Sensei account"
		}
	}, [isFirstRun, page])

	return (
		<div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-sky-50/50 via-background to-sky-100/30 dark:from-sky-950/20 dark:via-background dark:to-sky-950/20 select-none overflow-hidden">
			{/* Top Right Theme Toggle */}
			<div className="absolute top-4 right-4 z-20">
				<ModeToggle />
			</div>

			{/* Main Login Card */}
			<div className="relative z-10 w-full max-w-sm p-8 rounded-3xl bg-card border border-border/80 shadow-xl shadow-sky-500/5 flex flex-col gap-6">
				{/* Brand Logo & Schale Halo Accent */}
				<div className="flex flex-col items-center text-center">
					<div className="relative flex items-center justify-center size-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 mb-3">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.4"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="size-7"
						>
							<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
						</svg>
						<span className="absolute -top-1.5 -right-1.5 size-4 rounded-full border-2 border-sky-300 bg-sky-100 dark:bg-sky-950 animate-pulse" />
					</div>
					<h1 className="text-2xl font-extrabold tracking-tight text-foreground font-sans">
						Beszel
					</h1>
					<p className="text-xs text-sky-600 dark:text-sky-400 font-semibold tracking-wide font-sans mt-0.5">
						Server Monitoring Hub · S.C.H.A.L.E.
					</p>
					<p className="text-xs text-muted-foreground mt-2">
						{subtitle}
					</p>
				</div>

				{/* Auth Form Views */}
				{page?.route === "forgot_password" ? (
					<ForgotPassword />
				) : page?.route === "request_otp" ? (
					<OtpRequestForm />
				) : (
					<UserAuthForm isFirstRun={isFirstRun} authMethods={authMethods ?? ({ authProviders: [] } as any)} />
				)}

				{/* Footer Motto */}
				<div className="pt-2 border-t border-border/50 text-center">
					<span className="text-[11px] text-muted-foreground/80 font-medium">
						Keep your world online, together.
					</span>
				</div>
			</div>

			{/* Background Ambient Decorative Light */}
			<div className="absolute top-1/4 -left-20 size-80 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />
			<div className="absolute bottom-1/4 -right-20 size-80 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
		</div>
	)
}
