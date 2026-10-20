import { SystemStatus } from "@/lib/enums"
import type { MonitorStats, SystemDetailsRecord, SystemInfo, SystemRecord, SystemStats } from "@/types"

/** Per-second metrics payload pushed by the hub on the `rt_metrics` topic. */
export interface RealtimeSystemMetrics {
	stats: SystemStats
	info: SystemInfo
	Monitors?: Record<string, MonitorStats>
}

/**
 * Dashboard-facing view model for one system.
 *
 * The dashboard cards read a per-second `rt_metrics` payload when it is
 * available and fall back to the 60s `systems` record otherwise. That
 * fallback chain used to be copy-pasted into every card, and the copies
 * drifted (one guarded an empty GPU map, the other produced `-Infinity`).
 * Keep the single copy here.
 */
export interface SystemCardStats {
	isOnline: boolean
	isPaused: boolean
	/** Live stats payload, or undefined while the record fallback is in use. */
	liveStats: SystemStats | undefined
	cpu: number
	memory: number
	disk: number
	/** Highest GPU utilization, or null when the agent reports no GPU. */
	gpu: number | null
	cores: number | undefined
	threads: number | undefined
	loadAverage: [number, number, number] | null
	/** Uptime in seconds, or undefined when the agent has not reported it. */
	uptimeSeconds: number | undefined
	memTotalGb: number | undefined
	memUsedGb: number | undefined
	diskTotalGb: number | undefined
	diskUsedGb: number | undefined
	sentBytesPerSec: number | undefined
	recvBytesPerSec: number | undefined
	totalOutBytes: number | undefined
	totalInBytes: number | undefined
}

/**
 * Highest GPU utilization across all devices.
 * An empty map means "no GPU reported"; `Math.max()` of nothing is
 * `-Infinity`, which is truthy and would render as `-Infinity%`.
 */
function highestGpuUsage(liveStats: SystemStats | undefined): number | undefined {
	if (!liveStats?.g) return undefined
	const usages = Object.values(liveStats.g).map((gpu) => gpu.u ?? 0)
	return usages.length ? Math.max(...usages) : undefined
}

export function deriveSystemCardStats(
	system: SystemRecord,
	realtime: RealtimeSystemMetrics | undefined,
	details: SystemDetailsRecord | undefined
): SystemCardStats {
	const isOnline = system.status === SystemStatus.Up
	const isPaused = system.status === SystemStatus.Paused

	const liveStats = isOnline ? realtime?.stats : undefined
	const liveInfo = isOnline ? realtime?.info : undefined

	const cpu = isOnline ? (liveStats?.cpu ?? system.info?.cpu ?? 0) : 0
	const memory = isOnline ? (liveStats?.mp ?? system.info?.mp ?? 0) : 0
	const disk = isOnline ? (liveStats?.dp ?? system.info?.dp ?? 0) : 0
	// 0 is a valid idle GPU reading, so only null means "no GPU reported"
	const gpu = isOnline ? (liveInfo?.g ?? highestGpuUsage(liveStats) ?? system.info?.g ?? null) : null

	// `info.c` is a deprecated field the agent no longer emits (cores moved to
	// system_details). Keep only the live source so the fallback chain cannot
	// silently resolve to a stale value.
	const cores = details?.cores || undefined
	const threads = details?.threads || system.info?.t || undefined

	const la = liveStats?.la ?? liveInfo?.la ?? system.info?.la
	const loadAverage = isOnline && la && la.length ? la : null

	const memTotalGb = liveStats?.m ?? (details?.memory ? details.memory / 1024 ** 3 : undefined)
	// Used memory: live value, otherwise derived from the real percentage × real total
	const memUsedGb = liveStats?.mu ?? (memTotalGb != null ? (memory / 100) * memTotalGb : undefined)

	// stats.b = [sent bytes/s, recv bytes/s]. The field is omitted when both are
	// zero, so a present payload without `b` genuinely means 0 B/s, not "unknown".
	const sentBytesPerSec = liveStats ? (liveStats.b?.[0] ?? 0) : undefined
	const recvBytesPerSec = liveStats ? (liveStats.b?.[1] ?? 0) : undefined

	// stats.ni[nic] = [up, down, total up, total down] cumulative since boot
	let totalOutBytes: number | undefined
	let totalInBytes: number | undefined
	if (liveStats?.ni) {
		let out = 0
		let inbound = 0
		for (const totals of Object.values(liveStats.ni)) {
			out += totals?.[2] ?? 0
			inbound += totals?.[3] ?? 0
		}
		totalOutBytes = out
		totalInBytes = inbound
	}

	return {
		isOnline,
		isPaused,
		liveStats,
		cpu,
		memory,
		disk,
		gpu,
		cores,
		threads,
		loadAverage,
		uptimeSeconds: liveInfo?.u ?? system.info?.u,
		memTotalGb,
		memUsedGb,
		diskTotalGb: liveStats?.d,
		diskUsedGb: liveStats?.du,
		sentBytesPerSec,
		recvBytesPerSec,
		totalOutBytes,
		totalInBytes,
	}
}

/** Short CPU brand label derived from the agent's full CPU model string. */
export function getCpuBrandLabel(model: string | undefined, maxLength = 16): string | undefined {
	if (!model) return undefined
	if (model.includes("EPYC")) return "AMD EPYC"
	if (model.includes("Ryzen")) return "AMD Ryzen"
	if (model.includes("Xeon")) return "Intel Xeon"
	if (model.includes("Intel")) return "Intel"
	if (
		model.includes("Apple") ||
		model.includes("M1") ||
		model.includes("M2") ||
		model.includes("M3") ||
		model.includes("M4")
	) {
		return "Apple Silicon"
	}
	if (model.includes("ARM") || model.includes("aarch64")) return "ARM64"
	return model.slice(0, maxLength)
}

/**
 * `4C · 9.7G` spec chip text, or an empty string when nothing is known.
 *
 * Uses logical CPU count to match how hosting providers advertise a machine
 * ("4C" on a 2-core/4-thread VM) and how every other surface counts capacity.
 */
export function formatSpecChip(
	cores: number | undefined,
	threads: number | undefined,
	memTotalGb: number | undefined
): string {
	const parts: string[] = []
	const cpuCount = threads || cores
	if (cpuCount) parts.push(`${cpuCount}C`)
	if (memTotalGb) parts.push(`${memTotalGb >= 10 ? memTotalGb.toFixed(0) : memTotalGb.toFixed(1)}G`)
	return parts.join(" · ")
}

/**
 * Load average as a percentage of available CPU capacity.
 *
 * Linux load average counts runnable + uninterruptible tasks, so the value that
 * means "fully busy" is the number of *logical* CPUs (`threads`), not physical
 * cores. `top`, `htop` and the systems table all normalise by logical CPUs;
 * dividing by physical cores double-counts SMT and reports a 4 vCPU box running
 * at 39% as 78%.
 */
export function loadPercent(load1: number | undefined, stats: Pick<SystemCardStats, "cores" | "threads">): number {
	if (load1 === undefined || !Number.isFinite(load1)) return 0
	const capacity = stats.threads || stats.cores || 1
	return Math.max(0, Math.min(100, (load1 / capacity) * 100))
}

/** Load severity tiers, aligned with the systems table warn/crit defaults. */
export function loadLevel(load1: number | undefined, stats: Pick<SystemCardStats, "cores" | "threads">) {
	if (load1 === undefined || !Number.isFinite(load1)) return null
	const percent = loadPercent(load1, stats)
	if (percent < 65)
		return {
			label: "Optimal",
			color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
		}
	if (percent < 90) return { label: "Normal", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20" }
	return { label: "Heavy", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" }
}
