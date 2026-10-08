import { t } from "@lingui/core/macro"
import { Trans, useLingui } from "@lingui/react/macro"
import { redirectPage } from "@nanostores/router"
import {
	CheckIcon,
	ClockIcon,
	CopyIcon,
	ExternalLinkIcon,
	FingerprintIcon,
	KeyIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	RotateCwIcon,
	SearchIcon,
	ServerIcon,
	SparklesIcon,
	Trash2Icon,
} from "lucide-react"
import { memo, useEffect, useMemo, useState } from "react"
import { AddSystemDialog } from "@/components/add-system"
import {
	copyDockerCompose,
	copyDockerRun,
	copyLinuxCommand,
	copyWindowsCommand,
	type DropdownItem,
	InstallDropdown,
} from "@/components/install-dropdowns"
import { $router } from "@/components/router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppleIcon, DockerIcon, FreeBsdIcon, TuxIcon, WindowsIcon } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { isReadOnlyUser, pb } from "@/lib/api"
import { $publicKey } from "@/lib/stores"
import { cn, copyToClipboard, generateToken, getHubURL, tokenMap } from "@/lib/utils"
import type { FingerprintRecord } from "@/types"

const pbFingerprintOptions = {
	expand: "system",
	fields: "id,fingerprint,token,system,expand.system.name",
}

function sortFingerprints(fingerprints: FingerprintRecord[]) {
	return fingerprints.sort((a, b) =>
		(a.expand?.system?.name ?? "").localeCompare(b.expand?.system?.name ?? "")
	)
}

const SettingsFingerprintsPage = memo(() => {
	if (isReadOnlyUser()) {
		redirectPage($router, "settings", { name: "general" })
	}
	const [fingerprints, setFingerprints] = useState<FingerprintRecord[]>([])
	const [systems, setSystems] = useState<Array<{ id: string; name: string }>>([])

	// Load systems for assignment
	const fetchSystems = () => {
		pb.collection("systems")
			.getFullList<{ id: string; name: string }>({ fields: "id,name", sort: "name" })
			.then((res) => setSystems(res))
			.catch(() => {})
	}

	useEffect(() => {
		fetchSystems()
	}, [])

	// Get fingerprint records on mount
	useEffect(() => {
		pb.collection("fingerprints")
			.getFullList<FingerprintRecord>(pbFingerprintOptions)
			.then((prints) => {
				setFingerprints(sortFingerprints(prints))
			})
	}, [])

	// Subscribe to fingerprint updates
	useEffect(() => {
		let unsubscribe: (() => void) | undefined
		;(async () => {
			unsubscribe = await pb.collection("fingerprints").subscribe(
				"*",
				(res) => {
					setFingerprints((currentFingerprints) => {
						if (res.action === "create") {
							return sortFingerprints([...currentFingerprints, res.record as FingerprintRecord])
						}
						if (res.action === "update") {
							return currentFingerprints.map((fingerprint) => {
								if (fingerprint.id === res.record.id) {
									return { ...fingerprint, ...res.record } as FingerprintRecord
								}
								return fingerprint
							})
						}
						if (res.action === "delete") {
							return currentFingerprints.filter((fingerprint) => fingerprint.id !== res.record.id)
						}
						return currentFingerprints
					})
				},
				pbFingerprintOptions
			)
		})()
		return () => unsubscribe?.()
	}, [])

	// Subscribe to systems updates to keep assignment list fresh
	useEffect(() => {
		let unsubscribe: (() => void) | undefined
		;(async () => {
			unsubscribe = await pb.collection("systems").subscribe("*", () => {
				fetchSystems()
			})
		})()
		return () => unsubscribe?.()
	}, [])

	// Update token map whenever fingerprints change
	useEffect(() => {
		for (const fingerprint of fingerprints) {
			tokenMap.set(fingerprint.system, fingerprint.token)
		}
	}, [fingerprints])

	return (
		<>
			<SectionIntro />
			<Separator className="my-4" />
			<SectionUniversalToken />
			<Separator className="my-4" />
			<SectionTable
				fingerprints={fingerprints}
				systems={systems}
				onRefreshSystems={fetchSystems}
			/>
		</>
	)
})

const SectionIntro = memo(() => {
	return (
		<div>
			<h3 className="text-xl font-medium mb-2">
				<Trans>Tokens & Fingerprints</Trans>
			</h3>
			<p className="text-sm text-muted-foreground leading-relaxed">
				<Trans>Tokens and fingerprints are used to authenticate WebSocket connections to the hub.</Trans>
			</p>
			<p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
				<Trans>
					Tokens allow agents to connect and register. Fingerprints are stable identifiers unique to each system, set on
					first connection.
				</Trans>
			</p>
		</div>
	)
})

const SectionUniversalToken = memo(() => {
	const [token, setToken] = useState("")
	const [isLoading, setIsLoading] = useState(true)
	const [checked, setChecked] = useState(false)
	const [isPermanent, setIsPermanent] = useState(false)
	const publicKey = $publicKey.get()

	async function updateToken(enable: number = -1, permanent: number = -1) {
		// enable: 0 for disable, 1 for enable, -1 (unset) for get current state
		const data = await pb.send(`/api/beszel/universal-token`, {
			query: {
				token,
				enable,
				permanent,
			},
		})
		setToken(data.token)
		setChecked(data.active)
		setIsPermanent(!!data.permanent)
		setIsLoading(false)
	}

	useEffect(() => {
		updateToken()
	}, [])

	return (
		<div>
			<h3 className="text-lg font-medium mb-2">
				<Trans>Universal token</Trans>
			</h3>
			<p className="text-sm text-muted-foreground leading-relaxed">
				<Trans>When enabled, this token allows agents to self-register without prior system creation.</Trans>
			</p>
			<div className="mt-3 border rounded-md px-4 py-3 max-w-full">
				{!isLoading && (
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-4 min-w-0">
							<Switch
								checked={checked}
								onCheckedChange={(checked) => {
									// Keep current permanence preference when enabling/disabling
									updateToken(checked ? 1 : 0, isPermanent ? 1 : 0)
								}}
							/>
							<div className="min-w-0 flex-1 overflow-auto">
								<span
									className={cn(
										"text-sm text-primary opacity-60 transition-opacity",
										checked ? "opacity-100" : "select-none"
									)}
								>
									{token}
								</span>
							</div>
							<ActionsButtonUniversalToken token={token} checked={checked} />
						</div>

						{checked && (
							<div className="flex items-center gap-4 min-w-0 border-t pt-3">
								<span className="text-sm text-muted-foreground whitespace-nowrap">
									<Trans>Public key</Trans>
								</span>
								<div className="min-w-0 flex-1 truncate">
									<span className="text-sm text-primary font-mono">{publicKey}</span>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => copyToClipboard(publicKey)}
									title={t`Copy public key`}
								>
									<CopyIcon className="w-4" />
								</Button>
							</div>
						)}

						{checked && (
							<div className="border-t pt-3">
								<div className="text-sm font-medium">
									<Trans>Persistence</Trans>
								</div>
								<Tabs
									value={isPermanent ? "permanent" : "ephemeral"}
									onValueChange={(value) => updateToken(1, value === "permanent" ? 1 : 0)}
									className="mt-2"
								>
									<TabsList>
										<TabsTrigger className="xs:min-w-40" value="ephemeral">
											<Trans>Ephemeral</Trans>
										</TabsTrigger>
										<TabsTrigger className="xs:min-w-40" value="permanent">
											<Trans>Permanent</Trans>
										</TabsTrigger>
									</TabsList>
									<TabsContent value="ephemeral" className="mt-3">
										<p className="text-sm text-muted-foreground leading-relaxed">
											<Trans>Expires after one hour or on hub restart.</Trans>
										</p>
									</TabsContent>
									<TabsContent value="permanent" className="mt-3">
										<p className="text-sm text-muted-foreground leading-relaxed">
											<Trans>Saved in the database and does not expire until you disable it.</Trans>
										</p>
									</TabsContent>
								</Tabs>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
})

const ActionsButtonUniversalToken = memo(({ token, checked }: { token: string; checked: boolean }) => {
	const { t } = useLingui()
	const publicKey = $publicKey.get()
	const port = "45876"

	const dropdownItems: DropdownItem[] = [
		{
			text: t({ message: "Copy docker compose", context: "Button to copy docker compose file content" }),
			onClick: () => copyDockerCompose(port, publicKey, token),
			icons: [DockerIcon],
		},
		{
			text: t({ message: "Copy docker run", context: "Button to copy docker run command" }),
			onClick: () => copyDockerRun(port, publicKey, token),
			icons: [DockerIcon],
		},
		{
			text: t`Copy Linux command`,
			onClick: () => copyLinuxCommand(port, publicKey, token),
			icons: [TuxIcon],
		},
		{
			text: t({ message: "Homebrew command", context: "Button to copy install command" }),
			onClick: () => copyLinuxCommand(port, publicKey, token, true),
			icons: [TuxIcon, AppleIcon],
		},
		{
			text: t({ message: "Windows command", context: "Button to copy install command" }),
			onClick: () => copyWindowsCommand(port, publicKey, token),
			icons: [WindowsIcon],
		},
		{
			text: t({ message: "FreeBSD command", context: "Button to copy install command" }),
			onClick: () => copyLinuxCommand(port, publicKey, token),
			icons: [FreeBsdIcon],
		},
		{
			text: t`Manual setup instructions`,
			url: "https://beszel.dev/guide/agent-installation#binary",
			icons: [ExternalLinkIcon],
		},
	]
	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						disabled={!checked}
						className={cn("transition-opacity", !checked && "opacity-50")}
					>
						<span className="sr-only">
							<Trans>Open menu</Trans>
						</span>
						<MoreHorizontalIcon className="w-5" />
					</Button>
				</DropdownMenuTrigger>
				<InstallDropdown items={dropdownItems} />
			</DropdownMenu>
		</div>
	)
})

interface SectionTableProps {
	fingerprints?: FingerprintRecord[]
	systems: Array<{ id: string; name: string }>
	onRefreshSystems?: () => void
}

const SectionTable = memo(({ fingerprints = [], systems = [], onRefreshSystems }: SectionTableProps) => {
	const { t } = useLingui()
	const isReadOnly = isReadOnlyUser()
	const [searchQuery, setSearchQuery] = useState("")
	const [addTokenOpen, setAddTokenOpen] = useState(false)
	const [addSystemOpen, setAddSystemOpen] = useState(false)
	const [editingRecord, setEditingRecord] = useState<FingerprintRecord | null>(null)
	const [preselectedSystemId, setPreselectedSystemId] = useState<string | undefined>()

	// Calculate systems that don't have a dedicated fingerprint token
	const assignedSystemIds = useMemo(() => {
		return new Set(fingerprints.map((f) => f.system))
	}, [fingerprints])

	const unassignedSystems = useMemo(() => {
		return systems.filter((s) => !assignedSystemIds.has(s.id))
	}, [systems, assignedSystemIds])

	// Filtered list based on search query
	const filteredFingerprints = useMemo(() => {
		if (!searchQuery.trim()) {
			return fingerprints
		}
		const query = searchQuery.toLowerCase().trim()
		return fingerprints.filter((f) => {
			const systemName = (f.expand?.system?.name ?? "").toLowerCase()
			const token = (f.token ?? "").toLowerCase()
			const fingerprint = (f.fingerprint ?? "").toLowerCase()
			return systemName.includes(query) || token.includes(query) || fingerprint.includes(query)
		})
	}, [fingerprints, searchQuery])

	const headerCols = useMemo(
		() => [
			{
				label: t`System`,
				Icon: ServerIcon,
				w: "12em",
			},
			{
				label: t`Token`,
				Icon: KeyIcon,
				w: "20em",
			},
			{
				label: t`Fingerprint`,
				Icon: FingerprintIcon,
				w: "20em",
			},
		],
		[t]
	)

	const openAddTokenForSystem = (systemId?: string) => {
		setPreselectedSystemId(systemId)
		setAddTokenOpen(true)
	}

	return (
		<div className="mt-6">
			{/* Header with Title, Description, and Action Buttons */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
				<div>
					<h3 className="text-lg font-medium">
						<Trans>System tokens & fingerprints</Trans>
					</h3>
					<p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
						<Trans>Manage per-system connection tokens and hardware fingerprints.</Trans>
					</p>
				</div>
				{!isReadOnly && (
					<div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
						<Button
							variant="default"
							size="sm"
							className="gap-1.5"
							onClick={() => openAddTokenForSystem(unassignedSystems[0]?.id)}
						>
							<PlusIcon className="w-4 h-4" />
							<Trans>Add token</Trans>
						</Button>
					</div>
				)}
			</div>

			{/* Unassigned systems prompt banner */}
			{!isReadOnly && unassignedSystems.length > 0 && fingerprints.length > 0 && (
				<div className="mb-3 px-3.5 py-2.5 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between gap-3 text-sm">
					<div className="flex items-center gap-2 min-w-0">
						<SparklesIcon className="w-4 h-4 text-primary shrink-0" />
						<span className="text-muted-foreground truncate">
							<Trans>
								{unassignedSystems.length} system(s) do not have a dedicated token configured.
							</Trans>
						</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs px-2.5 shrink-0"
						onClick={() => openAddTokenForSystem(unassignedSystems[0].id)}
					>
						<Trans>Configure for {unassignedSystems[0].name}</Trans>
					</Button>
				</div>
			)}

			{/* Search input if there are multiple records */}
			{fingerprints.length > 3 && (
				<div className="relative mb-3 max-w-sm">
					<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder={t`Search systems or tokens...`}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-8 h-9 text-sm"
					/>
				</div>
			)}

			{/* Table or Empty State */}
			{fingerprints.length === 0 ? (
				<div className="rounded-lg border border-border/80 bg-card/60 p-8 text-center my-2">
					<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
						<KeyIcon className="w-6 h-6 text-primary" />
					</div>
					<h4 className="text-base font-semibold mb-1">
						<Trans>No system tokens configured</Trans>
					</h4>
					<p className="text-sm text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
						<Trans>
							System tokens authenticate individual agent connections. Configure a token for an existing system, or agents can auto-register using the universal token above.
						</Trans>
					</p>
					{!isReadOnly && (
						<div className="flex flex-wrap items-center justify-center gap-2.5">
							<Button
								variant="default"
								size="sm"
								className="gap-1.5"
								onClick={() => openAddTokenForSystem(unassignedSystems[0]?.id)}
							>
								<PlusIcon className="w-4 h-4" />
								<Trans>Add system token</Trans>
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5"
								onClick={() => setAddSystemOpen(true)}
							>
								<ServerIcon className="w-4 h-4" />
								<Trans>Add system</Trans>
							</Button>
						</div>
					)}
				</div>
			) : filteredFingerprints.length === 0 ? (
				<div className="rounded-lg border border-dashed p-8 text-center my-2 text-muted-foreground text-sm">
					<Trans>No matching records found for "{searchQuery}"</Trans>
				</div>
			) : (
				<div className="rounded-md border overflow-hidden w-full">
					<Table>
						<TableHeader>
							<tr className="border-border/50">
								{headerCols.map((col) => (
									<TableHead key={col.label} style={{ minWidth: col.w }}>
										<span className="flex items-center gap-2">
											<col.Icon className="size-4" />
											{col.label}
										</span>
									</TableHead>
								))}
								{!isReadOnly && (
									<TableHead className="w-0 text-right">
										<span className="sr-only">
											<Trans>Actions</Trans>
										</span>
									</TableHead>
								)}
							</tr>
						</TableHeader>
						<TableBody>
							{filteredFingerprints.map((fingerprint) => {
								const systemName = fingerprint.expand?.system?.name ?? t`Unknown system`
								return (
									<TableRow key={fingerprint.id}>
										<TableCell className="font-medium ps-5 py-2.5 max-w-60 truncate">
											<div className="flex items-center gap-2">
												<ServerIcon className="size-3.5 text-muted-foreground shrink-0" />
												<span className="truncate">{systemName}</span>
											</div>
										</TableCell>
										<TableCell className="py-2.5">
											<button
												type="button"
												onClick={() => {
													copyToClipboard(fingerprint.token)
													toast({ title: t`Copied`, description: t`Token copied to clipboard` })
												}}
												title={t`Click to copy token`}
												className="group font-mono text-[0.85em] bg-muted/40 hover:bg-muted px-2 py-1 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer text-left"
											>
												<span className="select-all">{fingerprint.token}</span>
												<CopyIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
											</button>
										</TableCell>
										<TableCell className="py-2.5">
											{fingerprint.fingerprint ? (
												<button
													type="button"
													onClick={() => {
														copyToClipboard(fingerprint.fingerprint)
														toast({ title: t`Copied`, description: t`Fingerprint copied to clipboard` })
													}}
													title={t`Click to copy fingerprint`}
													className="group font-mono text-[0.85em] bg-muted/40 hover:bg-muted px-2 py-1 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer text-left"
												>
													<span className="select-all">{fingerprint.fingerprint}</span>
													<CopyIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
												</button>
											) : (
												<span className="inline-flex items-center gap-1 text-xs text-muted-foreground/80 bg-muted/30 px-2 py-0.5 rounded border border-dashed border-border/70">
													<ClockIcon className="size-3" />
													<Trans>Waiting for initial connection</Trans>
												</span>
											)}
										</TableCell>
										{!isReadOnly && (
											<TableCell className="py-2.5 px-4 xl:px-2 text-right">
												<ActionsButtonTable
													fingerprint={fingerprint}
													onEdit={() => setEditingRecord(fingerprint)}
												/>
											</TableCell>
										)}
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Dialogs */}
			<AddTokenDialog
				open={addTokenOpen}
				setOpen={setAddTokenOpen}
				systems={systems}
				assignedSystemIds={assignedSystemIds}
				preselectedSystemId={preselectedSystemId}
				onOpenAddSystem={() => setAddSystemOpen(true)}
			/>

			{editingRecord && (
				<EditTokenDialog
					open={!!editingRecord}
					setOpen={(open) => {
						if (!open) setEditingRecord(null)
					}}
					fingerprint={editingRecord}
				/>
			)}

			<AddSystemDialog open={addSystemOpen} setOpen={setAddSystemOpen} />
		</div>
	)
})

interface AddTokenDialogProps {
	open: boolean
	setOpen: (open: boolean) => void
	systems: Array<{ id: string; name: string }>
	assignedSystemIds: Set<string>
	preselectedSystemId?: string
	onOpenAddSystem: () => void
}

const AddTokenDialog = memo(
	({ open, setOpen, systems, assignedSystemIds, preselectedSystemId, onOpenAddSystem }: AddTokenDialogProps) => {
		const { t } = useLingui()
		const [selectedSystemId, setSelectedSystemId] = useState("")
		const [token, setToken] = useState("")
		const [fingerprint, setFingerprint] = useState("")
		const [isSubmitting, setIsSubmitting] = useState(false)

		// Initialize values when dialog opens
		useEffect(() => {
			if (open) {
				setToken(generateToken())
				setFingerprint("")
				if (preselectedSystemId) {
					setSelectedSystemId(preselectedSystemId)
				} else {
					const firstUnassigned = systems.find((s) => !assignedSystemIds.has(s.id))
					setSelectedSystemId(firstUnassigned?.id ?? systems[0]?.id ?? "")
				}
			}
		}, [open, preselectedSystemId, systems, assignedSystemIds])

		const handleSubmit = async (e: React.FormEvent) => {
			e.preventDefault()
			if (!selectedSystemId) {
				toast({
					title: t`Error`,
					description: t`Please select a system`,
				})
				return
			}
			if (!token.trim()) {
				toast({
					title: t`Error`,
					description: t`Token cannot be empty`,
				})
				return
			}

			setIsSubmitting(true)
			try {
				await pb.collection("fingerprints").create({
					system: selectedSystemId,
					token: token.trim(),
					fingerprint: fingerprint.trim(),
				})
				toast({
					title: t`Success`,
					description: t`System token created successfully`,
				})
				setOpen(false)
			} catch (error: unknown) {
				toast({
					title: t`Error`,
					description: (error as Error).message,
				})
			} finally {
				setIsSubmitting(false)
			}
		}

		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md">
					<form onSubmit={handleSubmit}>
						<DialogHeader>
							<DialogTitle>
								<Trans>Add system token</Trans>
							</DialogTitle>
							<DialogDescription>
								<Trans>Assign an authentication token and optional fingerprint to a system.</Trans>
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							{/* Select System */}
							<div className="grid gap-2">
								<Label htmlFor="system-select">
									<Trans>System</Trans>
								</Label>
								{systems.length === 0 ? (
									<div className="text-sm text-muted-foreground p-3 rounded border bg-muted/30 flex items-center justify-between">
										<span><Trans>No systems available.</Trans></span>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setOpen(false)
												onOpenAddSystem()
											}}
										>
											<Trans>Create system first</Trans>
										</Button>
									</div>
								) : (
									<Select value={selectedSystemId} onValueChange={setSelectedSystemId}>
										<SelectTrigger id="system-select">
											<SelectValue placeholder={t`Select a system`} />
										</SelectTrigger>
										<SelectContent>
											{systems.map((s) => {
												const isAssigned = assignedSystemIds.has(s.id)
												return (
													<SelectItem key={s.id} value={s.id}>
														<div className="flex items-center gap-2">
															<span>{s.name}</span>
															{!isAssigned && (
																<Badge variant="secondary" className="text-[0.7rem] px-1.5 py-0">
																	<Trans>Unconfigured</Trans>
																</Badge>
															)}
														</div>
													</SelectItem>
												)
											})}
										</SelectContent>
									</Select>
								)}
							</div>

							{/* Token Field */}
							<div className="grid gap-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="token-input">
										<Trans>Token</Trans>
									</Label>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-6 text-xs px-2 gap-1"
										onClick={() => setToken(generateToken())}
									>
										<RotateCwIcon className="size-3" />
										<Trans>Generate new</Trans>
									</Button>
								</div>
								<div className="flex items-center gap-2">
									<Input
										id="token-input"
										value={token}
										onChange={(e) => setToken(e.target.value)}
										className="font-mono text-xs"
										required
									/>
									<Button
										type="button"
										variant="outline"
										size="icon"
										className="shrink-0"
										onClick={() => {
											copyToClipboard(token)
											toast({ title: t`Copied`, description: t`Token copied to clipboard` })
										}}
										title={t`Copy token`}
									>
										<CopyIcon className="size-4" />
									</Button>
								</div>
								<p className="text-[0.8rem] text-muted-foreground">
									<Trans>Unique token used by the agent to authenticate with the hub.</Trans>
								</p>
							</div>

							{/* Fingerprint Field */}
							<div className="grid gap-2">
								<Label htmlFor="fingerprint-input">
									<Trans>Fingerprint (optional)</Trans>
								</Label>
								<Input
									id="fingerprint-input"
									value={fingerprint}
									onChange={(e) => setFingerprint(e.target.value)}
									placeholder={t`Leave empty to bind on first connection`}
									className="font-mono text-xs"
								/>
								<p className="text-[0.8rem] text-muted-foreground">
									<Trans>Leave empty to let the agent auto-bind its hardware identifier upon first connection.</Trans>
								</p>
							</div>
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>
								<Trans>Cancel</Trans>
							</Button>
							<Button type="submit" disabled={isSubmitting || !selectedSystemId}>
								{isSubmitting ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		)
	}
)

interface EditTokenDialogProps {
	open: boolean
	setOpen: (open: boolean) => void
	fingerprint: FingerprintRecord
}

const EditTokenDialog = memo(({ open, setOpen, fingerprint }: EditTokenDialogProps) => {
	const { t } = useLingui()
	const [token, setToken] = useState(fingerprint.token)
	const [fingerprintVal, setFingerprintVal] = useState(fingerprint.fingerprint)
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (open) {
			setToken(fingerprint.token)
			setFingerprintVal(fingerprint.fingerprint)
		}
	}, [open, fingerprint])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!token.trim()) {
			toast({
				title: t`Error`,
				description: t`Token cannot be empty`,
			})
			return
		}

		setIsSubmitting(true)
		try {
			await pb.collection("fingerprints").update(fingerprint.id, {
				token: token.trim(),
				fingerprint: fingerprintVal.trim(),
			})
			toast({
				title: t`Success`,
				description: t`Updated successfully`,
			})
			setOpen(false)
		} catch (error: unknown) {
			toast({
				title: t`Error`,
				description: (error as Error).message,
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const systemName = fingerprint.expand?.system?.name ?? t`Unknown system`

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							<Trans>Edit token & fingerprint</Trans>
						</DialogTitle>
						<DialogDescription>
							<Trans>Update credentials for system: {systemName}</Trans>
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						{/* Token Field */}
						<div className="grid gap-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="edit-token-input">
									<Trans>Token</Trans>
								</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 text-xs px-2 gap-1"
									onClick={() => setToken(generateToken())}
								>
									<RotateCwIcon className="size-3" />
									<Trans>Rotate token</Trans>
								</Button>
							</div>
							<Input
								id="edit-token-input"
								value={token}
								onChange={(e) => setToken(e.target.value)}
								className="font-mono text-xs"
								required
							/>
						</div>

						{/* Fingerprint Field */}
						<div className="grid gap-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="edit-fingerprint-input">
									<Trans>Fingerprint</Trans>
								</Label>
								{fingerprintVal && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-6 text-xs px-2 text-destructive hover:text-destructive"
										onClick={() => setFingerprintVal("")}
									>
										<Trans>Clear fingerprint</Trans>
									</Button>
								)}
							</div>
							<Input
								id="edit-fingerprint-input"
								value={fingerprintVal}
								onChange={(e) => setFingerprintVal(e.target.value)}
								placeholder={t`Leave empty to allow agent re-registration`}
								className="font-mono text-xs"
							/>
							<p className="text-[0.8rem] text-muted-foreground">
								<Trans>Clearing the fingerprint allows the agent to re-register on next connect.</Trans>
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOpen(false)}>
							<Trans>Cancel</Trans>
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
})

async function updateFingerprint(fingerprint: FingerprintRecord, rotateToken = false) {
	try {
		await pb.collection("fingerprints").update(fingerprint.id, {
			fingerprint: "",
			token: rotateToken ? generateToken() : fingerprint.token,
		})
		toast({
			title: t`Success`,
			description: rotateToken ? t`Token rotated successfully` : t`Fingerprint reset`,
		})
	} catch (error: unknown) {
		toast({
			title: t`Error`,
			description: (error as Error).message,
		})
	}
}

async function deleteFingerprintRecord(fingerprint: FingerprintRecord) {
	try {
		await pb.collection("fingerprints").delete(fingerprint.id)
		toast({
			title: t`Success`,
			description: t`Record deleted successfully`,
		})
	} catch (error: unknown) {
		toast({
			title: t`Error`,
			description: (error as Error).message,
		})
	}
}

const ActionsButtonTable = memo(
	({ fingerprint, onEdit }: { fingerprint: FingerprintRecord; onEdit: () => void }) => {
		const envVar = `HUB_URL=${getHubURL()}\nTOKEN=${fingerprint.token}`
		const copyEnv = () => {
			copyToClipboard(envVar)
			toast({ title: t`Copied`, description: t`Environment variables copied` })
		}
		const copyYaml = () => {
			copyToClipboard(envVar.replaceAll("=", ": "))
			toast({ title: t`Copied`, description: t`YAML configuration copied` })
		}
		const copyToken = () => {
			copyToClipboard(fingerprint.token)
			toast({ title: t`Copied`, description: t`Token copied to clipboard` })
		}
		const copyFingerprint = () => {
			if (fingerprint.fingerprint) {
				copyToClipboard(fingerprint.fingerprint)
				toast({ title: t`Copied`, description: t`Fingerprint copied to clipboard` })
			}
		}

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size={"icon"} data-nolink>
						<span className="sr-only">
							<Trans>Open menu</Trans>
						</span>
						<MoreHorizontalIcon className="w-5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={copyYaml}>
						<CopyIcon className="me-2.5 size-4" />
						<Trans>Copy YAML</Trans>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={copyEnv}>
						<CopyIcon className="me-2.5 size-4" />
						<Trans context="Environment variables">Copy env</Trans>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={copyToken}>
						<KeyIcon className="me-2.5 size-4" />
						<Trans>Copy token</Trans>
					</DropdownMenuItem>
					{fingerprint.fingerprint && (
						<DropdownMenuItem onClick={copyFingerprint}>
							<FingerprintIcon className="me-2.5 size-4" />
							<Trans>Copy fingerprint</Trans>
						</DropdownMenuItem>
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={onEdit}>
						<PencilIcon className="me-2.5 size-4" />
						<Trans>Edit credentials</Trans>
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => updateFingerprint(fingerprint, true)}>
						<RotateCwIcon className="me-2.5 size-4" />
						<Trans>Rotate token</Trans>
					</DropdownMenuItem>
					{fingerprint.fingerprint && (
						<DropdownMenuItem onSelect={() => updateFingerprint(fingerprint)}>
							<RotateCwIcon className="me-2.5 size-4" />
							<Trans>Reset fingerprint</Trans>
						</DropdownMenuItem>
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-destructive focus:text-destructive"
						onSelect={() => deleteFingerprintRecord(fingerprint)}
					>
						<Trash2Icon className="me-2.5 size-4" />
						<Trans>Delete record</Trans>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		)
	}
)

export default SettingsFingerprintsPage
