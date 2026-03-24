import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'

import type { Role } from '@/types/api'
import { listUsers } from '@/api/users'
import { listRoles, reassignRoleUsers, deleteRole } from '@/api/roles'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface RoleDeleteDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	role: Role
}

export function RoleDeleteDialog({ open, onOpenChange, role }: RoleDeleteDialogProps) {
	const queryClient = useQueryClient()
	const [newRoleId, setNewRoleId] = useState('')

	// Check how many users have this role (only fetch 1 to get total)
	const { data: usersCheck, isLoading: checkingUsers } = useQuery({
		queryKey: ['users', { role_id: role.id, page: 1, page_size: 1 }],
		queryFn: () => listUsers({ role_id: role.id, page: 1, page_size: 1 }),
		enabled: open,
	})
	const userCount = usersCheck?.total ?? 0
	const hasUsers = userCount > 0

	// Other roles for the dropdown (only needed if users exist)
	const { data: rolesData } = useQuery({
		queryKey: ['roles'],
		queryFn: listRoles,
		enabled: open && hasUsers,
	})
	const otherRoles = (rolesData?.items ?? []).filter((r) => r.id !== role.id)

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (hasUsers) {
				if (!newRoleId) throw new Error(m.role_delete_error_no_role())
				await reassignRoleUsers(role.id, newRoleId)
			}
			await deleteRole(role.id)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles'] })
			queryClient.invalidateQueries({ queryKey: ['users'] })
			toast.success(m.role_delete_toast_success())
			onOpenChange(false)
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const handleClose = () => {
		setNewRoleId('')
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.role_delete_title()}</DialogTitle>
					<DialogDescription>
						{checkingUsers
							? m.role_delete_checking()
							: hasUsers
								? m.role_delete_has_users({ name: role.name, count: userCount })
								: m.role_delete_no_users_confirm({ name: role.name })}
					</DialogDescription>
				</DialogHeader>

				{!checkingUsers && hasUsers && (
					<div className="space-y-2">
				<Label htmlFor="new-role-select">{m.role_delete_new_role_label()}</Label>
				<Select value={newRoleId} onValueChange={setNewRoleId}>
					<SelectTrigger id="new-role-select">
						<SelectValue placeholder={m.role_delete_new_role_placeholder()} />
							</SelectTrigger>
							<SelectContent>
								{otherRoles.map((r) => (
									<SelectItem key={r.id} value={r.id}>
										{r.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={handleClose} disabled={deleteMutation.isPending}>
						{m.common_cancel()}
					</Button>
					<Button
						variant="destructive"
						onClick={() => deleteMutation.mutate()}
						disabled={deleteMutation.isPending || checkingUsers || (hasUsers && !newRoleId)}
					>
						{deleteMutation.isPending
							? hasUsers ? m.role_delete_reassigning() : m.role_delete_deleting()
							: hasUsers ? m.role_delete_reassign_btn() : m.common_delete()}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
