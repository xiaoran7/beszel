import { memo, useMemo } from "react"
import { useStore } from "@nanostores/react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { $systems } from "@/lib/stores"
import { AlertDialogContent } from "./alerts-sheet"

export const GlobalAlertsSheet = memo(function GlobalAlertsSheet({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const systems = useStore($systems)
	const primarySystem = useMemo(() => systems[0], [systems])

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="max-h-full overflow-auto w-160 !max-w-full p-4 sm:p-6 bg-card border-border/80">
				<SheetHeader className="mb-4">
					<SheetTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<span>Alert Management</span>
					</SheetTitle>
				</SheetHeader>
				{primarySystem ? (
					<AlertDialogContent system={primarySystem} />
				) : (
					<div className="text-center py-12 text-muted-foreground text-sm">
						No systems available to configure alerts. Please add a system first.
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
})
