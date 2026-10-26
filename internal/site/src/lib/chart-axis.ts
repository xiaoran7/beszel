/** Room left past the newest sample so the line never sits on the axis edge. */
export const axisEndPadding = 500

/**
 * Time window for a chart x axis, anchored to the newest sample rather than to the wall clock.
 * Anchoring to Date.now() combined with allowDataOverflow clips every point once the newest
 * sample falls more than one window behind (stale agent, dropped realtime, clock skew), which
 * leaves the axes and y labels drawn over an empty plot.
 *
 * `windowMs` is derived from the range's own getOffset so the window length always matches
 * the selected range.
 */
export function xAxisDomain(
	lastCreated: number,
	getOffset: (endTime: Date) => Date
): [number, number] {
	const axisEndTime = lastCreated + axisEndPadding
	const startTime = getOffset(new Date(axisEndTime)).getTime()
	return [startTime, axisEndTime]
}

/**
 * A cached window is reusable only when it still contains the newest sample. The cache is
 * shared by every chart of the same time range, so a window built for a fresher system would
 * otherwise clip a lagging one.
 */
export function cachedAxisFits(domain: readonly [number, number], lastCreated: number): boolean {
	return lastCreated + axisEndPadding <= domain[1] && lastCreated >= domain[0]
}
