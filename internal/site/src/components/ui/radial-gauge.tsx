import { memo } from "react"
import { cn } from "@/lib/utils"

interface RadialGaugeProps {
	value: number | string
	unit?: string
	percent: number
	label: string
	color?: string
	size?: number
	strokeWidth?: number
	className?: string
}

export const RadialGauge = memo(function RadialGauge({
	value,
	unit,
	percent,
	label,
	color = "#0ea5e9", // Sky-500
	size = 48,
	strokeWidth = 4,
	className,
}: RadialGaugeProps) {
	const safePercent = Math.min(100, Math.max(0, isNaN(percent) ? 0 : percent))
	const radius = (size - strokeWidth) / 2
	const circumference = 2 * Math.PI * radius
	const strokeDashoffset = circumference - (safePercent / 100) * circumference

	// Parse value & unit cleanly (support string splitting like "214 KB/s" or explicit unit)
	let displayValue: string = ""
	let displayUnit: string | undefined = unit

	if (typeof value === "number") {
		displayValue = `${Math.round(value)}%`
	} else if (typeof value === "string") {
		const trimmed = value.trim()
		if (!displayUnit && trimmed.includes(" ")) {
			const parts = trimmed.split(/\s+/)
			if (parts.length >= 2) {
				displayValue = parts[0]
				displayUnit = parts.slice(1).join(" ")
			} else {
				displayValue = trimmed
			}
		} else {
			displayValue = trimmed
		}
	}

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
				<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none leading-none">
					{displayUnit ? (
						<div className="flex flex-col items-center justify-center leading-none">
							<span
								className={cn(
									"font-bold tracking-tight text-foreground font-sans tabular-nums",
									displayValue.length > 3 ? "text-[10px]" : "text-[11px]"
								)}
							>
								{displayValue}
							</span>
							<span className="text-[7.5px] font-semibold text-muted-foreground/80 tracking-tighter mt-0.5 uppercase">
								{displayUnit}
							</span>
						</div>
					) : (
						<span
							className={cn(
								"font-bold tracking-tight text-foreground font-sans tabular-nums leading-none",
								displayValue.length > 3 ? "text-[10px]" : "text-[11px]"
							)}
						>
							{displayValue}
						</span>
					)}
				</div>
			</div>
			<span className="text-[10px] font-medium text-muted-foreground mt-1 tracking-tight">
				{label}
			</span>
		</div>
	)
})
