import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'

import type { Role } from '@/types/api'
import { getRoleById, assignRolePermissions } from '@/api/roles'
import { listPermissions } from '@/api/permissions'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface RolePermissionsDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	role: Role
}

// Group permissions by their resource prefix (e.g. "user", "role", "permission")
function groupByResource(permissions: { id: string; slug: string; description: string }[]) {
	const groups: Record<string, typeof permissions> = {}
	for (const p of permissions) {
		const resource = p.slug.split(':')[0] ?? 'other'
		if (!groups[resource]) groups[resource] = []
		groups[resource].push(p)
	}
	return groups
}

function getResourceLabel(resource: string): string {
	if (resource === 'user') return m.role_perms_resource_user()
	if (resource === 'role') return m.role_perms_resource_role()
	if (resource === 'permission') return m.role_perms_resource_permission()
	return resource
}

export function RolePermissionsDialog({ open, onOpenChange, role }: RolePermissionsDialogProps) {
	const queryClient = useQueryClient()
	const [selected, setSelected] = useState<Set<string>>(new Set())

	// All available permissions
	const { data: allPermsData, isLoading: loadingAll } = useQuery({
		queryKey: ['permissions'],
		queryFn: listPermissions,
		enabled: open,
	})
	const allPermissions = allPermsData?.items ?? []

	// Current role permissions
	const { data: roleWithPerms, isLoading: loadingRole } = useQuery({
		queryKey: ['roles', role.id, 'permissions'],
		queryFn: () => getRoleById(role.id, 'permissions'),
		enabled: open,
	})

	// Sync selection with loaded role permissions
	useEffect(() => {
		if (roleWithPerms?.permissions) {
			setSelected(new Set(roleWithPerms.permissions.map((p) => p.id)))
		}
	}, [roleWithPerms])

	const mutation = useMutation({
		mutationFn: (ids: string[]) => assignRolePermissions(role.id, ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles'] })
			queryClient.invalidateQueries({ queryKey: ['roles', role.id, 'permissions'] })
			queryClient.invalidateQueries({ queryKey: ['me'] })
			toast.success(m.role_perms_toast_updated())
			onOpenChange(false)
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const toggle = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const isAdmin = roleWithPerms?.name.toLocaleLowerCase() === 'admin'
	const isLoading = loadingAll || loadingRole
	const groups = groupByResource(allPermissions)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						Permissões —{' '}
						<span className="text-muted-foreground font-normal">{role.name}</span>
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<p className="py-6 text-center text-sm text-muted-foreground">{m.common_loading()}</p>
				) : (
					<>
						{isAdmin && (
							<p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
								{m.role_perms_wildcard_info()}
							</p>
						)}
						<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
							{Object.entries(groups).map(([resource, perms], idx) => (
								<div key={resource}>
									{idx > 0 && <Separator className="mb-4" />}
									<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
											{getResourceLabel(resource)}
									</p>
									<div className="space-y-2">
										{perms.map((p) => (
											<div key={p.id} className="flex items-start gap-3">
												<Checkbox
													id={p.id}
													checked={isAdmin || selected.has(p.id)}
													onCheckedChange={isAdmin ? undefined : () => toggle(p.id)}
													disabled={isAdmin}
												/>
												<div className="grid gap-0.5">
													<Label
														htmlFor={p.id}
														className={isAdmin ? 'cursor-not-allowed opacity-60 font-medium text-sm leading-none' : 'cursor-pointer font-medium text-sm leading-none'}
													>
														<Badge variant="outline" className="font-mono text-xs mr-2">
															{p.slug}
														</Badge>
													</Label>
													<p className="text-xs text-muted-foreground">{p.description}</p>
												</div>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</>
				)}

				<DialogFooter className="gap-2 pt-2">
					{!isAdmin && (
						<span className="text-xs text-muted-foreground mr-auto self-center">
							{m.role_perms_selected_count({ count: selected.size })}
						</span>
					)}
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{isAdmin ? m.common_close() : m.common_cancel()}
					</Button>
					{!isAdmin && (
						<Button
							onClick={() => mutation.mutate(Array.from(selected))}
							disabled={mutation.isPending || isLoading}
						>
							{mutation.isPending ? m.common_saving() : m.common_save()}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
