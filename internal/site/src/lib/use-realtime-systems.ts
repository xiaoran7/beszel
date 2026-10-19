import { useEffect, useMemo, useRef, useState } from "react"
import { useStore } from "@nanostores/react"
import { pb } from "@/lib/api"
import { SystemStatus } from "@/lib/enums"
import { $systems } from "@/lib/stores"
import { compareSemVer, parseSemVer } from "@/lib/utils"
import type { MonitorStats, SystemInfo, SystemStats } from "@/types"

/** Per-second metrics payload pushed by the hub on the `rt_metrics` topic. */
export interface RealtimeSystemMetrics {
	stats: SystemStats
	info: SystemInfo
	Monitors?: Record<string, MonitorStats>
}

/** Realtime metrics require an agent new enough to serve 1s cache windows. */
const MIN_REALTIME_AGENT_VERSION = parseSemVer("0.13.0")

interface UseRealtimeSystemsOptions {
	/** Set false to release every subscription (e.g. while a view shows no live metrics). */
	enabled?: boolean
}

/**
 * Subscribe to the hub's per-second `rt_metrics` stream for every online system.
 * The hub runs its realtime worker only while a client is subscribed, so the
 * dashboard keeps one subscription per visible system and drops them all when
 * the tab is hidden or the caller disables it.
 */
export function useRealtimeSystems(options: UseRealtimeSystemsOptions = {}) {
	const { enabled = true } = options
	const systems = useStore($systems)
	const [metrics, setMetrics] = useState<Record<string, RealtimeSystemMetrics>>({})
	const [isVisible, setIsVisible] = useState(
		() => typeof document === "undefined" || document.visibilityState === "visible"
	)
	const unsubsRef = useRef(new Map<string, () => void>())

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

		if (!enabled || !isVisible) {
			for (const unsubscribe of active.values()) unsubscribe()
			active.clear()
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
		for (const id of ids) {
			if (active.has(id)) continue
			pb.realtime
				.subscribe<RealtimeSystemMetrics>(
					"rt_metrics",
					(data) => setMetrics((prev) => ({ ...prev, [id]: data })),
					{ query: { system: id } }
				)
				.then((unsubscribe) => {
					if (cancelled) {
						unsubscribe()
					} else {
						active.set(id, unsubscribe)
					}
				})
				.catch((error) => {
					console.error(`Failed to subscribe to realtime metrics for ${id}:`, error)
				})
		}
		return () => {
			cancelled = true
		}
	}, [enabled, isVisible, idsKey])

	// release every subscription on unmount
	useEffect(() => {
		const active = unsubsRef.current
		return () => {
			for (const unsubscribe of active.values()) unsubscribe()
			active.clear()
		}
	}, [])

	return { metrics }
}
