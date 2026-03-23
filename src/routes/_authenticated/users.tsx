import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import type { ColumnDef, PaginationState } from '@tanstack/react-table'

import type { User } from '@/types/api'
import { listUsers, updateUser } from '@/api/users'
import { UserFormDialog } from '@/components/users/UserFormDialog'
import { UserSessionsSheet } from '@/components/users/UserSessionsSheet'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { usePermission } from '@/hooks/use-permission'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/_authenticated/users')({
	component: UsersPage,
})

function UsersPage() {
	const queryClient = useQueryClient()
	const canCreate = usePermission('user:create')
	const canUpdate = usePermission('user:update')

	// Filter state
	const [emailFilter, setEmailFilter] = useState('')
	const [debouncedEmail, setDebouncedEmail] = useState('')
	const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

	// Debounce email
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			setDebouncedEmail(emailFilter)
			setPagination((p) => ({ ...p, pageIndex: 0 }))
		}, 300)
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [emailFilter])

	// Dialog/Sheet state
	const [formDialogOpen, setFormDialogOpen] = useState(false)
	const [editingUser, setEditingUser] = useState<User | undefined>()
	const [sessionsSheetOpen, setSessionsSheetOpen] = useState(false)
	const [sessionsUser, setSessionsUser] = useState<User | null>(null)
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [confirmUser, setConfirmUser] = useState<User | null>(null)

	const params = {
		page: pagination.pageIndex + 1,
		page_size: pagination.pageSize,
		include: 'role',
		...(debouncedEmail ? { email: debouncedEmail } : {}),
		...(activeFilter === 'active' ? { is_active: true } :
			activeFilter === 'inactive' ? { is_active: false } : {}),
	}

	const { data, isLoading } = useQuery({
		queryKey: ['users', params],
		queryFn: () => listUsers(params),
	})

	const toggleActiveMutation = useMutation({
		mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
			updateUser(id, { is_active }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] })
			toast.success('Status do usuário atualizado.')
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const columns: ColumnDef<User>[] = [
		{
			id: 'fullName',
			header: 'Nome Completo',
			cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
		},
		{
			accessorKey: 'email',
			header: 'Email',
		},
		{
			id: 'role',
			header: 'Papel',
			cell: ({ row }) => (
				<Badge variant="outline">{row.original.role?.name ?? row.original.role_id}</Badge>
			),
		},
		{
			id: 'status',
			header: 'Status',
			cell: ({ row }) =>
				row.original.is_active ? (
					<Badge variant="default">Ativo</Badge>
				) : (
					<Badge variant="secondary">Inativo</Badge>
				),
		},
		{
			id: 'actions',
			header: 'Ações',
			cell: ({ row }) => (
				<div className="flex items-center gap-1">
					{canUpdate && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => { setEditingUser(row.original); setFormDialogOpen(true) }}
						>
							Editar
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => { setSessionsUser(row.original); setSessionsSheetOpen(true) }}
					>
						Sessões
					</Button>
					{canUpdate && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => { setConfirmUser(row.original); setConfirmOpen(true) }}
						>
							{row.original.is_active ? 'Desativar' : 'Ativar'}
						</Button>
					)}
				</div>
			),
		},
	]

	const table = useReactTable({
		data: data?.items ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		rowCount: data?.total ?? 0,
		state: { pagination },
		onPaginationChange: setPagination,
	})

	const total = data?.total ?? 0
	const pageStart = pagination.pageIndex * pagination.pageSize + 1
	const pageEnd = Math.min(pageStart + pagination.pageSize - 1, total)

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Usuários</h1>
				{canCreate && (
					<Button onClick={() => { setEditingUser(undefined); setFormDialogOpen(true) }}>
						Novo Usuário
					</Button>
				)}
			</div>

			<div className="flex items-center gap-3">
				<Input
					placeholder="Filtrar por email..."
					value={emailFilter}
					onChange={(e) => setEmailFilter(e.target.value)}
					className="max-w-xs"
				/>
				<Select
					value={activeFilter}
					onValueChange={(v) => {
						setActiveFilter(v as typeof activeFilter)
						setPagination((p) => ({ ...p, pageIndex: 0 }))
					}}
				>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos</SelectItem>
						<SelectItem value="active">Ativos</SelectItem>
						<SelectItem value="inactive">Inativos</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((hg) => (
							<TableRow key={hg.id}>
								{hg.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
									Carregando...
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
									Nenhum usuário encontrado.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between text-sm text-muted-foreground">
				<span>
					{total === 0
						? 'Nenhum resultado'
						: `Mostrando ${pageStart}–${pageEnd} de ${total} usuários`}
				</span>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Anterior
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Próximo
					</Button>
				</div>
			</div>

			<UserFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				user={editingUser}
			/>

			<UserSessionsSheet
				open={sessionsSheetOpen}
				onOpenChange={setSessionsSheetOpen}
				user={sessionsUser}
			/>

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title={confirmUser?.is_active ? 'Desativar usuário' : 'Ativar usuário'}
				description={`Tem certeza que deseja ${confirmUser?.is_active ? 'desativar' : 'ativar'} ${confirmUser?.first_name} ${confirmUser?.last_name}?`}
				loading={toggleActiveMutation.isPending}
				onConfirm={() => {
					if (confirmUser) {
						toggleActiveMutation.mutate(
							{ id: confirmUser.id, is_active: !confirmUser.is_active },
							{ onSuccess: () => setConfirmOpen(false) },
						)
					}
				}}
			/>
		</div>
	)
}
