import { useEffect, useMemo, useRef, useState } from "react"
import { useStore } from "@nanostores/react"
import { pb } from "@/lib/api"
import { SystemStatus } from "@/lib/enums"
import { $systems } from "@/lib/stores"
import type { RealtimeSystemMetrics } from "@/lib/system-card-stats"
import { compareSemVer, parseSemVer } from "@/lib/utils"

export type { RealtimeSystemMetrics }

/** Realtime metrics require an agent new enough to serve 1s cache windows. */
const MIN_REALTIME_AGENT_VERSION = parseSemVer("0.13.0")

/** Delay before retrying a failed subscription so a hub restart can recover. */
const RESUBSCRIBE_DELAY_MS = 5_000

interface UseRealtimeSystemsOptions {
	/** Set false to release every subscription (e.g. while a view shows no live metrics). */
	enabled?: boolean
}

/**
 * Subscribe to the hub's per-second `rt_metrics` stream for every online system.
 * The hub runs its realtime worker only while a client is subscribed, so the
 * dashboard keeps one subscription per visible system and drops them all when
 * the tab is hidden or the caller disables it.
 *
 * Payloads arrive as one websocket message per system per second. They are
 * coalesced into a single state update per animation frame, otherwise N online
 * systems would re-render the whole dashboard N times every second.
 */
export function useRealtimeSystems(options: UseRealtimeSystemsOptions = {}) {
	const { enabled = true } = options
	const systems = useStore($systems)
	const [metrics, setMetrics] = useState<Record<string, RealtimeSystemMetrics>>({})
	const [isVisible, setIsVisible] = useState(
		() => typeof document === "undefined" || document.visibilityState === "visible"
	)
	const unsubsRef = useRef(new Map<string, () => void>())
	const pendingIdsRef = useRef(new Set<string>())
	const pendingMetricsRef = useRef<Record<string, RealtimeSystemMetrics>>({})
	const flushHandleRef = useRef<number | null>(null)

	const idsKey = useMemo(() => {
		return systems
			.filter(
				(system) =>
					system.status === SystemStatus.Up &&
					compareSemVer(parseSemVer(system.info?.v), MIN_REALTIME_AGENT_VERSION) >= 0
			)
			.map((system) => system.id)
			.sort()
			.join(",")
	}, [systems])

	useEffect(() => {
		const onVisibilityChange = () => setIsVisible(document.visibilityState === "visible")
		document.addEventListener("visibilitychange", onVisibilityChange)
		return () => document.removeEventListener("visibilitychange", onVisibilityChange)
	}, [])

	useEffect(() => {
		const active = unsubsRef.current
		const pendingIds = pendingIdsRef.current

		const flushPending = () => {
			flushHandleRef.current = null
			const pending = pendingMetricsRef.current
			pendingMetricsRef.current = {}
			setMetrics((prev) => ({ ...prev, ...pending }))
		}

		const queueMetrics = (id: string, data: RealtimeSystemMetrics) => {
			pendingMetricsRef.current[id] = data
			if (flushHandleRef.current === null) {
				flushHandleRef.current = requestAnimationFrame(flushPending)
			}
		}

		if (!enabled || !isVisible) {
			for (const unsubscribe of active.values()) unsubscribe()
			active.clear()
			pendingIds.clear()
			// Drop payloads and state for systems that are no longer streamed, so a
			// server that went offline while the view was inactive cannot keep
			// showing a stale "live" indicator when the view comes back.
			pendingMetricsRef.current = {}
			setMetrics((prev) => (Object.keys(prev).length ? {} : prev))
			return
		}

		const ids = idsKey ? idsKey.split(",") : []
		const wanted = new Set(ids)

		// drop subscriptions for systems that went offline or were removed
		for (const [id, unsubscribe] of active) {
			if (wanted.has(id)) continue
			unsubscribe()
			active.delete(id)
			setMetrics((prev) => {
				if (!(id in prev)) return prev
				const next = { ...prev }
				delete next[id]
				return next
			})
		}

		let cancelled = false
		const retryTimers: ReturnType<typeof setTimeout>[] = []

		const subscribeToSystem = (id: string) => {
			if (cancelled || active.has(id) || pendingIds.has(id)) return
			pendingIds.add(id)
			pb.realtime
				.subscribe("rt_metrics", (data: RealtimeSystemMetrics) => queueMetrics(id, data), {
					query: { system: id },
				})
				.then((unsubscribe) => {
					pendingIds.delete(id)
					if (cancelled) {
						unsubscribe()
					} else {
						active.set(id, unsubscribe)
					}
				})
				.catch((error) => {
					pendingIds.delete(id)
					console.error(`Failed to subscribe to realtime metrics for ${id}:`, error)
					// A hub restart or a network blip should not silence this system for
					// the rest of the session.
					if (!cancelled) {
						retryTimers.push(setTimeout(() => subscribeToSystem(id), RESUBSCRIBE_DELAY_MS))
					}
				})
		}

		for (const id of ids) {
			subscribeToSystem(id)
		}

		return () => {
			cancelled = true
			for (const timer of retryTimers) clearTimeout(timer)
		}
	}, [enabled, isVisible, idsKey])

	// release every subscription and cancel a queued flush on unmount
	useEffect(() => {
		const active = unsubsRef.current
		const pendingIds = pendingIdsRef.current
		return () => {
			for (const unsubscribe of active.values()) unsubscribe()
			active.clear()
			pendingIds.clear()
			if (flushHandleRef.current !== null) {
				cancelAnimationFrame(flushHandleRef.current)
				flushHandleRef.current = null
			}
		}
	}, [])

	return { metrics }
}
