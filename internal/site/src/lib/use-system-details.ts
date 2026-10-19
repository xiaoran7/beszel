import { useEffect, useMemo, useState } from "react"
import { pb } from "@/lib/api"
import type { SystemDetailsRecord } from "@/types"

/** Details are static per agent process, so results are cached for the session. */
const detailsCache: Record<string, SystemDetailsRecord> = {}
let detailsPromise: Promise<void> | undefined

const DETAILS_FIELDS = "system,hostname,kernel,cores,threads,cpu,os,os_name,memory,podman"
/** A details row can appear shortly after the system itself, so retry a few times. */
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5_000

/** Drop cached details so the next consumer re-fetches (called on logout). */
export function clearSystemDetailsCache() {
	for (const key of Object.keys(detailsCache)) {
		delete detailsCache[key]
	}
	detailsPromise = undefined
}

/**
 * Fetch every system_details record and fill the cache.
 * Resolves `true` once every requested id is cached, `false` otherwise, so the
 * caller can decide whether to retry.
 */
function fetchMissingDetails(ids: string[]): Promise<boolean> {
	const missing = ids.filter((id) => !detailsCache[id])
	if (!missing.length) return Promise.resolve(true)
	// An in-flight fetch will populate the whole collection anyway.
	if (detailsPromise) return detailsPromise.then(() => ids.every((id) => id in detailsCache))

	const promise = pb
		.collection<SystemDetailsRecord>("system_details")
		.getFullList({ fields: DETAILS_FIELDS })
		.then((records) => {
			for (const record of records) {
				detailsCache[record.system] = record
			}
		})
		.catch((error) => {
			console.error("Failed to fetch system details:", error)
		})
		.finally(() => {
			if (detailsPromise === promise) detailsPromise = undefined
		})
	detailsPromise = promise
	return promise.then(() => ids.every((id) => id in detailsCache))
}

/**
 * Map of system ID to its static details record (cores, threads, CPU model, OS).
 * Modern agents keep these out of the systems record, so cards that show them
 * need this extra source.
 */
export function useSystemDetails(systemIds: string[]) {
	const idsKey = useMemo(() => [...systemIds].sort().join(","), [systemIds])
	const [version, setVersion] = useState(0)

	useEffect(() => {
		const ids = idsKey ? idsKey.split(",") : []
		if (!ids.some((id) => !detailsCache[id])) return
		let cancelled = false
		let timer: ReturnType<typeof setTimeout> | undefined

		// A failed fetch (or a details row that does not exist yet) is retried a
		// bounded number of times instead of blanking the spec line for the session.
		const attempt = (remaining: number) => {
			fetchMissingDetails(ids).then((complete) => {
				if (cancelled) return
				if (complete) {
					setVersion((v) => v + 1)
				} else if (remaining > 0) {
					timer = setTimeout(() => attempt(remaining - 1), RETRY_DELAY_MS)
				}
			})
		}
		attempt(MAX_RETRIES)

		return () => {
			cancelled = true
			if (timer) clearTimeout(timer)
		}
	}, [idsKey])

	return useMemo(() => ({ ...detailsCache }), [idsKey, version])
}
