import { memo } from "react"
import { cn } from "@/lib/utils"

interface RadialGaugeProps {
	value: number | string
	percent: number
	label: string
	color?: string
	size?: number
	strokeWidth?: number
	className?: string
}

export const RadialGauge = memo(function RadialGauge({
	value,
	percent,
	label,
	color = "#0ea5e9", // Sky-500
	size = 54,
	strokeWidth = 5,
	className,
}: RadialGaugeProps) {
	const safePercent = Math.min(100, Math.max(0, isNaN(percent) ? 0 : percent))
	const radius = (size - strokeWidth) / 2
	const circumference = 2 * Math.PI * radius
	const strokeDashoffset = circumference - (safePercent / 100) * circumference

	return (
		<div className={cn("flex flex-col items-center justify-center text-center", className)}>
			<div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
				<svg width={size} height={size} className="transform -rotate-90">
					{/* Background Circle */}
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="currentColor"
						strokeWidth={strokeWidth}
						fill="transparent"
						className="text-secondary/80 dark:text-secondary/40"
					/>
					{/* Progress Circle */}
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke={color}
						strokeWidth={strokeWidth}
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="round"
						fill="transparent"
						className="transition-all duration-700 ease-out"
					/>
				</svg>
				{/* Center Value */}
				<span className="absolute text-[11px] font-bold tracking-tight text-foreground font-sans">
					{typeof value === "number" ? `${Math.round(value)}%` : value}
				</span>
			</div>
			<span className="text-[10px] font-medium text-muted-foreground mt-1 tracking-tight">
				{label}
			</span>
		</div>
	)
})
