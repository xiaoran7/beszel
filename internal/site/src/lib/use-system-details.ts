import { useEffect, useState } from "react"
import { pb } from "@/lib/api"
import type { SystemDetailsRecord } from "@/types"

/** Details are static per agent process, so a single fetch per session is enough. */
let detailsCache: Record<string, SystemDetailsRecord> | undefined
let detailsPromise: Promise<Record<string, SystemDetailsRecord>> | undefined

const DETAILS_FIELDS = "system,hostname,kernel,cores,threads,cpu,os,os_name,memory,podman"

async function fetchSystemDetails() {
	if (detailsCache) return detailsCache
	if (!detailsPromise) {
		detailsPromise = pb
			.collection<SystemDetailsRecord>("system_details")
			.getFullList({ fields: DETAILS_FIELDS })
			.then((records) => {
				const map: Record<string, SystemDetailsRecord> = {}
				for (const record of records) {
					map[record.system] = record
				}
				detailsCache = map
				return map
			})
			.catch((error) => {
				console.error("Failed to fetch system details:", error)
				detailsPromise = undefined
				return {}
			})
	}
	return detailsPromise
}

/**
 * Map of system ID to its static details record (cores, threads, CPU model, OS).
 * Modern agents keep these out of the systems record, so cards that show them
 * need this extra source.
 */
export function useSystemDetails() {
	const [details, setDetails] = useState<Record<string, SystemDetailsRecord>>(detailsCache ?? {})

	useEffect(() => {
		let cancelled = false
		fetchSystemDetails().then((map) => {
			if (!cancelled) setDetails(map)
		})
		return () => {
			cancelled = true
		}
	}, [])

	return details
}
