import { useEffect, useMemo, useState } from "react"
import { pb } from "@/lib/api"
import type { SystemDetailsRecord } from "@/types"

/** Details are static per agent process, so results are cached for the session. */
const detailsCache: Record<string, SystemDetailsRecord> = {}
let detailsPromise: Promise<void> | undefined

const DETAILS_FIELDS = "system,hostname,kernel,cores,threads,cpu,os,os_name,memory,podman"

async function fetchMissingDetails(ids: string[]) {
	if (detailsPromise) return detailsPromise
	const missing = ids.filter((id) => !detailsCache[id])
	if (!missing.length) return

	detailsPromise = pb
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
			detailsPromise = undefined
		})
	return detailsPromise
}

/**
 * Map of system ID to its static details record (cores, threads, CPU model, OS).
 * Modern agents keep these out of the systems record, so cards that show them
 * need this extra source. New systems are picked up on the next render pass.
 */
export function useSystemDetails(systemIds: string[]) {
	const idsKey = useMemo(() => [...systemIds].sort().join(","), [systemIds])
	const [version, setVersion] = useState(0)

	useEffect(() => {
		const ids = idsKey ? idsKey.split(",") : []
		if (!ids.some((id) => !detailsCache[id])) return
		let cancelled = false
		fetchMissingDetails(ids).then(() => {
			if (!cancelled) setVersion((v) => v + 1)
		})
		return () => {
			cancelled = true
		}
	}, [idsKey])

	return useMemo(() => ({ ...detailsCache }), [idsKey, version])
}
