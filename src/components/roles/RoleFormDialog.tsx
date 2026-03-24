import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'

import type { Role, CreateRoleRequest } from '@/types/api'
import { createRoleSchema } from '@/types/api'
import { createRole, updateRole } from '@/api/roles'
import { useAppForm } from '@/hooks/app-form'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface RoleFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	role?: Role
}

export function RoleFormDialog({ open, onOpenChange, role }: RoleFormDialogProps) {
	const queryClient = useQueryClient()
	const isEdit = !!role

	const mutation = useMutation({
		mutationFn: (values: CreateRoleRequest) => {
			if (isEdit && role) {
				return updateRole(role.id, values)
			}
			return createRole(values)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles'] })
			toast.success(isEdit ? m.role_form_toast_updated() : m.role_form_toast_created())
			onOpenChange(false)
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const form = useAppForm({
		defaultValues: {
			name: role?.name ?? '',
			description: role?.description ?? '',
		},
		validators: { onBlur: createRoleSchema },
		onSubmit: ({ value }) => {
			mutation.mutate(value)
		},
	})

	useEffect(() => {
		if (open) {
			form.reset()
		}
	}, [open, role])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEdit ? m.role_form_edit_title() : m.role_form_create_title()}</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
					className="space-y-4"
				>
					<form.AppField name="name">
						{(field) => <field.TextField label={m.role_form_name_label()} />}
					</form.AppField>

					<form.AppField name="description">
						{(field) => <field.TextField label={m.role_form_desc_label()} />}
					</form.AppField>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							{m.common_cancel()}
						</Button>
						<form.AppForm>
							<form.SubmitButton label={isEdit ? m.common_save() : m.common_create()} className="w-auto" />
						</form.AppForm>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
