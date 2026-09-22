import { memo, useState } from "react"
import { PlusIcon } from "lucide-react"
import { AddSystemDialog } from "../add-system"

export const AddServerCard = memo(function AddServerCard() {
	const [open, setOpen] = useState(false)

	return (
		<>
			<AddSystemDialog open={open} setOpen={setOpen} />
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="group relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-sky-300/60 dark:border-sky-800/60 hover:border-sky-500 bg-sky-50/20 hover:bg-sky-50/40 dark:bg-sky-950/10 dark:hover:bg-sky-950/20 transition-all duration-200 cursor-pointer min-h-[290px] select-none text-center"
			>
				<div className="flex items-center justify-center size-13 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
					<PlusIcon className="size-7" />
				</div>
				<h3 className="text-base font-bold text-foreground mt-4 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
					Add Server
				</h3>
				<p className="text-xs text-muted-foreground mt-1 max-w-[210px] leading-relaxed">
					Connect a new server to your Beszel hub.
				</p>
			</button>
		</>
	)
})
