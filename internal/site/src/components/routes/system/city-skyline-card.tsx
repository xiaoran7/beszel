import { memo } from "react"
import { Card } from "@/components/ui/card"

interface CitySkylineCardProps {
	cityName?: string
}

export const CitySkylineCard = memo(function CitySkylineCard({ cityName }: CitySkylineCardProps) {
	return (
		<Card className="relative rounded-3xl border border-sky-200/70 dark:border-sky-800/60 bg-gradient-to-tr from-sky-50/70 via-card to-sky-100/40 dark:from-sky-950/30 dark:via-card dark:to-sky-950/30 shadow-2xs hover:shadow-xs transition-all overflow-hidden select-none min-h-[160px] flex items-center justify-center">
			<img
				src="/assets/city_hk.png"
				alt={cityName || "Hong Kong Skyline"}
				className="w-full h-full object-cover object-center pointer-events-none drop-shadow-2xs"
			/>
		</Card>
	)
})
