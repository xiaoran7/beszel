import { describe, expect, test } from "bun:test"
import { axisEndPadding, cachedAxisFits, xAxisDomain } from "../src/lib/chart-axis"

const HOUR = 3600_000
const MINUTE = 60_000

const minusHour = (endTime: Date) => new Date(endTime.getTime() - HOUR)
const minusMinute = (endTime: Date) => new Date(endTime.getTime() - MINUTE)

describe("chart x axis window", () => {
	test("keeps a sample that lags the wall clock by two hours inside the window", () => {
		const now = Date.parse("2026-10-26T05:45:00Z")
		const lastCreated = now - 2 * HOUR
		const [start, end] = xAxisDomain(lastCreated, minusHour)
		expect(lastCreated).toBeGreaterThanOrEqual(start)
		expect(lastCreated).toBeLessThanOrEqual(end)
	})

	test("window length follows the range and ignores the wall clock", () => {
		const lastCreated = Date.parse("2026-10-26T05:45:00Z")
		const [start, end] = xAxisDomain(lastCreated, minusHour)
		expect(end - start).toBe(HOUR)
		expect(end).toBe(lastCreated + axisEndPadding)

		const [mStart, mEnd] = xAxisDomain(lastCreated, minusMinute)
		expect(mEnd - mStart).toBe(MINUTE)
	})

	test("reuses a cached window that still contains the sample", () => {
		const lastCreated = Date.parse("2026-10-26T05:45:00Z")
		expect(cachedAxisFits(xAxisDomain(lastCreated, minusHour), lastCreated)).toBe(true)
	})

	test("rejects a cached window built for a fresher system so it cannot clip a lagging one", () => {
		const fresh = Date.parse("2026-10-26T05:45:00Z")
		const lagging = fresh - 2 * HOUR
		expect(cachedAxisFits(xAxisDomain(fresh, minusHour), lagging)).toBe(false)
	})

	test("rejects a cached window that ends before a newer sample", () => {
		const older = Date.parse("2026-10-26T03:45:00Z")
		const newer = Date.parse("2026-10-26T05:45:00Z")
		expect(cachedAxisFits(xAxisDomain(older, minusHour), newer)).toBe(false)
	})

	test("accepts a sample that moved earlier but is still inside the cached window", () => {
		const newest = Date.parse("2026-10-26T05:45:00Z")
		const earlier = newest - 5 * MINUTE
		expect(cachedAxisFits(xAxisDomain(newest, minusHour), earlier)).toBe(true)
	})
})
