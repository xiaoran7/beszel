import { t } from "@lingui/core/macro"
import { Trans, useLingui } from "@lingui/react/macro"
import { useStore } from "@nanostores/react"
import { XIcon } from "lucide-react"
import React, { type JSX, memo, useCallback, useEffect, useState } from "react"
import { $containerFilter, $maxValues } from "@/lib/stores"
import { useIntersectionObserver } from "@/lib/use-intersection-observer"
import { cn } from "@/lib/utils"
import Spinner from "../../spinner"
import { Button } from "../../ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { ChartAverage, ChartMax } from "../../ui/icons"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"

export function FilterBar({ store = $containerFilter }: { store?: typeof $containerFilter }) {
	const storeValue = useStore(store)
	const [inputValue, setInputValue] = useState(storeValue)
	const { t } = useLingui()

	useEffect(() => {
		setInputValue(storeValue)
	}, [storeValue])

	useEffect(() => {
		if (inputValue === storeValue) {
			return
		}
		const handle = window.setTimeout(() => store.set(inputValue), 80)
		return () => clearTimeout(handle)
	}, [inputValue, storeValue, store])

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setInputValue(value)
	}, [])

	const handleClear = useCallback(() => {
		setInputValue("")
		store.set("")
	}, [store])

	return (
		<>
			<Input
				placeholder={t`Filter...`}
				className="ps-4 pe-8 w-full sm:w-44 rounded-xl"
				onChange={handleChange}
				value={inputValue}
			/>
			{inputValue && (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Clear"
					className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
					onClick={handleClear}
				>
					<XIcon className="h-4 w-4" />
				</Button>
			)}
		</>
	)
}

export const SelectAvgMax = memo(function SelectAvgMax({ max }: { max: boolean }) {
	const Icon = max ? ChartMax : ChartAverage
	return (
		<Select value={max ? "max" : "avg"} onValueChange={(e) => $maxValues.set(e === "max")}>
			<SelectTrigger className="relative ps-10 pe-5 w-full sm:w-36 h-8 text-xs rounded-xl">
				<Icon className="h-4 w-4 absolute start-3 top-1/2 -translate-y-1/2 opacity-85" />
				<SelectValue />
			</SelectTrigger>
			<SelectContent className="rounded-xl text-xs">
				<SelectItem key="avg" value="avg">
					<Trans>Average</Trans>
				</SelectItem>
				<SelectItem key="max" value="max">
					<Trans comment="Chart select field. Please try to keep this short.">Max 1 min</Trans>
				</SelectItem>
			</SelectContent>
		</Select>
	)
})

export function ChartCard({
	title,
	description,
	children,
	grid,
	empty,
	cornerEl,
	legend,
	icon: Icon,
	statBadge,
	className,
}: {
	title: string
	description?: React.ReactNode
	children: React.ReactNode
	grid?: boolean
	empty?: boolean
	cornerEl?: JSX.Element | null
	legend?: boolean
	icon?: React.ComponentType<{ className?: string }>
	statBadge?: React.ReactNode
	className?: string
}) {
	const { isIntersecting, ref } = useIntersectionObserver()

	return (
		<Card
			className={cn(
				"p-5 sm:p-6 rounded-3xl border border-border/80 bg-card shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between select-none",
				{ "col-span-full": !grid },
				className
			)}
			ref={ref}
		>
			<CardHeader className="flex flex-row items-center justify-between pb-3 p-0 mb-2 gap-3">
				<div className="flex items-center gap-2.5 min-w-0">
					{Icon && (
						<div className="flex items-center justify-center size-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
							<Icon className="size-4.5" />
						</div>
					)}
					<div className="flex flex-col min-w-0">
						<CardTitle className="text-base font-bold text-foreground truncate">
							{title}
						</CardTitle>
						{description && (
							<CardDescription className="text-xs text-muted-foreground truncate">
								{description}
							</CardDescription>
						)}
					</div>
				</div>

				{(statBadge || cornerEl) && (
					<div className="flex items-center gap-2 shrink-0">
						{statBadge && (
							<div className="text-xs font-semibold text-muted-foreground">
								{statBadge}
							</div>
						)}
						{cornerEl}
					</div>
				)}
			</CardHeader>

			<div className={cn("relative group w-full", legend ? "h-52 md:h-56" : "h-48 md:h-52")}>
				<Spinner
					msg={empty ? t`Waiting for enough records to display` : undefined}
					className="group-has-[.opacity-100]:invisible duration-100"
				/>
				{isIntersecting && children}
			</div>
		</Card>
	)
}
