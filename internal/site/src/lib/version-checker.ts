import { map } from "nanostores"

export interface FrontendUpdateState {
	hasUpdate: boolean
	currentVersion: string
	newVersion?: string
	currentScript: string
	newScript?: string
	dismissed: boolean
}

export const $frontendUpdate = map<FrontendUpdateState>({
	hasUpdate: false,
	currentVersion: "",
	currentScript: "",
	dismissed: false,
})

export interface Fingerprint {
	version: string
	scriptSrc: string
}

/**
 * Normalize script path to just its path without leading dot or slash,
 * ensuring robust comparison between relative ("./assets/...") and absolute ("/assets/...").
 */
export function normalizeScriptSrc(src: string): string {
	return src.split("?")[0].replace(/^\.?\//, "").trim()
}

/**
 * Parse the entry script src and HUB_VERSION from the HTML text.
 */
export function parseHTMLFingerprint(html: string): Fingerprint {
	let scriptSrc = ""
	let version = ""

	// Match entry script tag pointing to assets/index-*.js
	const scriptMatch =
		html.match(/<script\b[^>]*?\bsrc=["']([^"']*?assets\/index-[^"']+\.js)["'][^>]*?>/i) ||
		html.match(/<script\b[^>]*?\bsrc=["']([^"']+\.js)["'][^>]*?>/i)
	if (scriptMatch && scriptMatch[1]) {
		scriptSrc = scriptMatch[1]
	}

	// Match HUB_VERSION inside globalThis.BESZEL JSON
	const versionMatch = html.match(/["']?HUB_VERSION["']?\s*:\s*["']([^"']+)["']/i)
	if (versionMatch && versionMatch[1]) {
		version = versionMatch[1]
	}

	return { version, scriptSrc }
}

/**
 * Retrieve the current page's baseline fingerprint from DOM and global state.
 */
export function getCurrentFingerprint(): Fingerprint {
	if (typeof document === "undefined") {
		return { version: "", scriptSrc: "" }
	}

	const version = globalThis.BESZEL?.HUB_VERSION || ""
	const scriptEl =
		document.querySelector<HTMLScriptElement>('script[src*="assets/index-"]') ||
		document.querySelector<HTMLScriptElement>('script[type="module"][src]')
	const scriptSrc = scriptEl?.getAttribute("src") || ""

	return { version, scriptSrc }
}

let baselineFingerprint: Fingerprint = { version: "", scriptSrc: "" }
let isChecking = false

/**
 * Query Hub for the latest HTML document and compare fingerprints.
 */
export async function checkForUpdate(): Promise<boolean> {
	if (typeof window === "undefined" || isChecking) {
		return false
	}

	// In development mode, Vite handles HMR; skip automatic polling
	if (import.meta.env.DEV) {
		return false
	}

	// Ensure baseline is established
	if (!baselineFingerprint.scriptSrc && !baselineFingerprint.version) {
		baselineFingerprint = getCurrentFingerprint()
	}

	const currentScriptNorm = normalizeScriptSrc(baselineFingerprint.scriptSrc)
	const currentVersion = baselineFingerprint.version

	// If neither baseline script nor version is known, cannot compare reliably
	if (!currentScriptNorm && !currentVersion) {
		return false
	}

	try {
		isChecking = true
		const basePath = globalThis.BESZEL?.BASE_PATH || "/"
		const targetUrl = basePath.endsWith("/") ? basePath : `${basePath}/`

		// Fetch root document bypassing browser cache
		const response = await fetch(targetUrl, {
			cache: "no-cache",
			headers: { Accept: "text/html" },
		})

		if (!response.ok) {
			// Hub might be restarting or returning 502/503; silently ignore
			return false
		}

		const html = await response.text()
		const latest = parseHTMLFingerprint(html)
		const latestScriptNorm = normalizeScriptSrc(latest.scriptSrc)

		const scriptChanged = Boolean(
			currentScriptNorm && latestScriptNorm && currentScriptNorm !== latestScriptNorm
		)
		const versionChanged = Boolean(
			currentVersion && latest.version && currentVersion !== latest.version
		)

		if (scriptChanged || versionChanged) {
			$frontendUpdate.setKey("hasUpdate", true)
			if (latest.version) {
				$frontendUpdate.setKey("newVersion", latest.version)
			}
			if (latest.scriptSrc) {
				$frontendUpdate.setKey("newScript", latest.scriptSrc)
			}
			return true
		}
	} catch {
		// Network errors or offline — ignore silently
	} finally {
		isChecking = false
	}

	return false
}

/**
 * Dismiss the refresh banner for the current session.
 */
export function dismissUpdate() {
	$frontendUpdate.setKey("dismissed", true)
}

/**
 * Reload the page to load fresh frontend bundles.
 */
export function reloadPage() {
	if (typeof window !== "undefined") {
		window.location.reload()
	}
}

const POLL_INTERVAL = 300_000 // 5 minutes
const MIN_VISIBILITY_INTERVAL = 60_000 // 1 minute

/**
 * Initialize version checking lifecycle:
 * - Establish baseline fingerprint
 * - Periodic polling every 5 minutes while active
 * - Immediate check upon returning to tab (visibilitychange)
 * - Check upon network reconnection
 */
export function initVersionChecker(): () => void {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return () => {}
	}

	// Capture initial state
	baselineFingerprint = getCurrentFingerprint()
	$frontendUpdate.setKey("currentVersion", baselineFingerprint.version)
	$frontendUpdate.setKey("currentScript", baselineFingerprint.scriptSrc)

	let lastCheckTime = Date.now()

	const check = () => {
		lastCheckTime = Date.now()
		checkForUpdate()
	}

	// Listen for visibility changes (user switches back to tab)
	const onVisibilityChange = () => {
		if (document.visibilityState === "visible") {
			const now = Date.now()
			if (now - lastCheckTime >= MIN_VISIBILITY_INTERVAL) {
				check()
			}
		}
	}

	// Listen for network recovery
	const onOnline = () => {
		check()
	}

	document.addEventListener("visibilitychange", onVisibilityChange)
	window.addEventListener("online", onOnline)

	// Periodic timer
	const timerId = setInterval(() => {
		if (document.visibilityState === "visible") {
			check()
		}
	}, POLL_INTERVAL)

	// Initial check delayed slightly to allow main app data streams to settle
	const initialTimerId = setTimeout(() => {
		if (document.visibilityState === "visible") {
			check()
		}
	}, 15_000)

	return () => {
		clearInterval(timerId)
		clearTimeout(initialTimerId)
		document.removeEventListener("visibilitychange", onVisibilityChange)
		window.removeEventListener("online", onOnline)
	}
}
