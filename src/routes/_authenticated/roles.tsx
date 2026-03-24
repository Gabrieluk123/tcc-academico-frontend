import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import type { Role } from '@/types/api'
import { listRoles } from '@/api/roles'
import { RoleFormDialog } from '@/components/roles/RoleFormDialog'
import { RolePermissionsDialog } from '@/components/roles/RolePermissionsDialog'
import { RoleDeleteDialog } from '@/components/roles/RoleDeleteDialog'
import { usePermission } from '@/hooks/use-permission'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/_authenticated/roles')({
	component: RolesPage,
})

function RolesPage() {
	const canCreate = usePermission('role:create')
	const canUpdate = usePermission('role:update')
	const canDelete = usePermission('role:delete')

	const [formDialogOpen, setFormDialogOpen] = useState(false)
	const [editingRole, setEditingRole] = useState<Role | undefined>()
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [deletingRole, setDeletingRole] = useState<Role | null>(null)
	const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
	const [permissionsRole, setPermissionsRole] = useState<Role | null>(null)
	const canAssign = usePermission('permission:assign')

	const { data, isLoading } = useQuery({
		queryKey: ['roles'],
		queryFn: listRoles,
	})

	const columns: ColumnDef<Role>[] = [
		{
			accessorKey: 'name',
			header: 'Nome',
		},
		{
			accessorKey: 'description',
			header: 'Descrição',
		},
		{
			id: 'created_at',
			header: 'Criado em',
			cell: ({ row }) =>
				new Date(row.original.created_at).toLocaleDateString('pt-BR'),
		},
		{
			id: 'actions',
			header: 'Ações',
			cell: ({ row }) => (
				<div className="flex items-center gap-1">
					{canAssign && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => { setPermissionsRole(row.original); setPermissionsDialogOpen(true) }}
						>
							Permissões
						</Button>
					)}
					{canUpdate && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => { setEditingRole(row.original); setFormDialogOpen(true) }}
						>
							Editar
						</Button>
					)}
					{canDelete && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => { setDeletingRole(row.original); setDeleteDialogOpen(true) }}
						>
							Excluir
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
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
	})

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Papéis</h1>
				{canCreate && (
					<Button onClick={() => { setEditingRole(undefined); setFormDialogOpen(true) }}>
						Novo Papel
					</Button>
				)}
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
									Nenhum papel encontrado.
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

			{table.getPageCount() > 1 && (
				<div className="flex items-center justify-end gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Anterior
					</Button>
					<span className="text-sm text-muted-foreground">
						Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Próximo
					</Button>
				</div>
			)}

			<RoleFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				role={editingRole}
			/>

			{permissionsRole && (
				<RolePermissionsDialog
					open={permissionsDialogOpen}
					onOpenChange={setPermissionsDialogOpen}
					role={permissionsRole}
				/>
			)}

			{deletingRole && (
				<RoleDeleteDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					role={deletingRole}
				/>
			)}
		</div>
	)
}
