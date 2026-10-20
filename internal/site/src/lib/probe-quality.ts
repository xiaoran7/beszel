import type { NetworkMonitorRecord } from "@/types"

export type MonitorProtocol = NetworkMonitorRecord["protocol"]

/**
 * Probe quality tiers, in microseconds.
 *
 * This is the single source of truth for every surface that colours a probe
 * result: the network monitors table and the dashboard card must agree, and
 * they previously carried two hand-copied literals that could drift.
 */
export const RESPONSE_TIME_THRESHOLDS: Record<MonitorProtocol, { warning: number; critical: number }> = {
	http: { warning: 800_000, critical: 3_000_000 },
	tcp: { warning: 500_000, critical: 2_000_000 },
	icmp: { warning: 100_000, critical: 500_000 },
	dns: { warning: 150_000, critical: 800_000 },
}

/** Packet loss tiers in percent. Matches the monitors table loss column. */
export const LOSS_WARN_PCT = 0
export const LOSS_BAD_PCT = 20

export type QualityLevel = "good" | "warn" | "bad" | "idle"

/** Classify a probe response time (microseconds) into a quality tier. */
export function latencyQuality(responseTimeUs: number | undefined): QualityLevel {
	if (!responseTimeUs || !Number.isFinite(responseTimeUs)) return "idle"
	const thresholds = RESPONSE_TIME_THRESHOLDS.icmp
	return responseTimeUs > thresholds.critical ? "bad" : responseTimeUs > thresholds.warning ? "warn" : "good"
}

/** Classify a probe response time for a specific protocol. */
export function latencyQualityFor(
	protocol: MonitorProtocol | string,
	responseTimeUs: number | undefined
): QualityLevel {
	if (!responseTimeUs || !Number.isFinite(responseTimeUs)) return "idle"
	const thresholds = RESPONSE_TIME_THRESHOLDS[protocol as MonitorProtocol] ?? RESPONSE_TIME_THRESHOLDS.icmp
	return responseTimeUs > thresholds.critical ? "bad" : responseTimeUs > thresholds.warning ? "warn" : "good"
}

/** Classify a packet-loss percentage into a quality tier. */
export function lossQuality(lossPercent: number | undefined): QualityLevel {
	if (lossPercent === undefined || !Number.isFinite(lossPercent)) return "idle"
	return lossPercent > LOSS_BAD_PCT ? "bad" : lossPercent > LOSS_WARN_PCT ? "warn" : "good"
}
