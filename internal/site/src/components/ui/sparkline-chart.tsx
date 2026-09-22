import { memo, useMemo } from "react"
import { cn } from "@/lib/utils"

interface SparklineChartProps {
	data?: number[]
	color?: string
	height?: number
	width?: string | number
	className?: string
	isOffline?: boolean
}

export const SparklineChart = memo(function SparklineChart({
	data = [20, 25, 22, 35, 28, 45, 30, 48, 40, 52, 38, 46],
	color = "#38bdf8",
	height = 42,
	className,
	isOffline = false,
}: SparklineChartProps) {
	const { pathD, areaD } = useMemo(() => {
		if (!data || data.length === 0 || isOffline) {
			return { pathD: "", areaD: "" }
		}

		const minVal = Math.min(...data)
		const maxVal = Math.max(...data)
		const range = maxVal - minVal || 1
		const padding = 4

		const points = data.map((val, i) => {
			const x = (i / (data.length - 1)) * 100
			const y = height - padding - ((val - minVal) / range) * (height - 2 * padding)
			return { x, y }
		})

		// Generate SVG smooth cubic bezier path
		let d = `M ${points[0].x} ${points[0].y}`
		for (let i = 0; i < points.length - 1; i++) {
			const curr = points[i]
			const next = points[i + 1]
			const cx1 = curr.x + (next.x - curr.x) / 2
			const cy1 = curr.y
			const cx2 = curr.x + (next.x - curr.x) / 2
			const cy2 = next.y
			d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${next.x} ${next.y}`
		}

		const a = `${d} L 100 ${height} L 0 ${height} Z`
		return { pathD: d, areaD: a }
	}, [data, height, isOffline])

	if (isOffline) {
		return (
			<div className={cn("relative flex flex-col items-center justify-center w-full h-[42px] border-b border-dashed border-rose-300/40", className)}>
				<div className="w-full flex items-center justify-between px-2">
					{Array.from({ length: 12 }).map((_, i) => (
						<span key={i} className="size-1 rounded-full bg-rose-400/40" />
					))}
				</div>
				<span className="text-[10px] text-rose-500/70 font-medium tracking-tight mt-0.5">
					No recent data
				</span>
			</div>
		)
	}

	const gradientId = useMemo(() => `spark-${Math.random().toString(36).substr(2, 9)}`, [])

	return (
		<div className={cn("relative w-full overflow-hidden", className)} style={{ height }}>
			<svg
				viewBox={`0 0 100 ${height}`}
				preserveAspectRatio="none"
				className="w-full h-full overflow-visible"
			>
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={color} stopOpacity="0.28" />
						<stop offset="100%" stopColor={color} stopOpacity="0.0" />
					</linearGradient>
				</defs>
				{/* Gradient Fill */}
				<path d={areaD} fill={`url(#${gradientId})`} />
				{/* Smooth Stroke */}
				<path
					d={pathD}
					fill="none"
					stroke={color}
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	)
})
