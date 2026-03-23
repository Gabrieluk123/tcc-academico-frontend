import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/api'
import { createUserSchema } from '@/types/api'
import { createUser, updateUser } from '@/api/users'
import { listRoles } from '@/api/roles'
import { useAppForm } from '@/hooks/app-form'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface UserFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	user?: User
	hideRoleAndPassword?: boolean
}

export function UserFormDialog({
	open,
	onOpenChange,
	user,
	hideRoleAndPassword = false,
}: UserFormDialogProps) {
	const queryClient = useQueryClient()
	const isEdit = !!user

	const { data: rolesData } = useQuery({
		queryKey: ['roles'],
		queryFn: listRoles,
		enabled: open && !hideRoleAndPassword,
	})
	const roles = rolesData ?? []

	const mutation = useMutation({
		mutationFn: (values: Record<string, unknown>) => {
			if (isEdit && user) {
				const { password: _p, ...rest } = values as Record<string, unknown>
				return updateUser(user.id, rest as UpdateUserRequest)
			}
			return createUser(values as unknown as CreateUserRequest)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] })
			if (user) {
				queryClient.invalidateQueries({ queryKey: ['user', user.id] })
			}
			toast.success(isEdit ? 'Usuário atualizado.' : 'Usuário criado.')
			onOpenChange(false)
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const form = useAppForm({
		defaultValues: {
			first_name: user?.first_name ?? '',
			last_name: user?.last_name ?? '',
			email: user?.email ?? '',
			password: '',
			role_id: user?.role_id ?? '',
		},
		validators: { onBlur: isEdit ? undefined : createUserSchema },
		onSubmit: ({ value }) => {
			const payload: Record<string, unknown> = {
				first_name: value.first_name,
				last_name: value.last_name,
				email: value.email,
			}
			if (!isEdit) {
				payload.password = value.password
			}
			if (!hideRoleAndPassword) {
				payload.role_id = value.role_id
			}
			mutation.mutate(payload)
		},
	})

	// Reset form when user changes (open for edit)
	useEffect(() => {
		if (open) {
			form.reset()
		}
	}, [open, user])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
					className="space-y-4"
				>
					<form.AppField name="first_name">
						{(field) => <field.TextField label="Nome" />}
					</form.AppField>

					<form.AppField name="last_name">
						{(field) => <field.TextField label="Sobrenome" />}
					</form.AppField>

					<form.AppField name="email">
						{(field) => <field.TextField label="Email" type="email" />}
					</form.AppField>

					{!isEdit && !hideRoleAndPassword && (
						<form.AppField name="password">
							{(field) => <field.TextField label="Senha" type="password" />}
						</form.AppField>
					)}

					{!hideRoleAndPassword && (
						<form.AppField name="role_id">
							{(field) => (
								<RoleSelectField
									value={field.state.value}
									onChange={(v) => field.handleChange(v)}
									onBlur={field.handleBlur}
									roles={roles}
									errors={field.state.meta.isTouched ? field.state.meta.errors.filter(Boolean) : []}
								/>
							)}
						</form.AppField>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>
						<form.AppForm>
							<form.SubmitButton label={isEdit ? 'Salvar' : 'Criar'} className="w-auto" />
						</form.AppForm>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

function RoleSelectField({
	value,
	onChange,
	onBlur,
	roles,
	errors,
}: {
	value: string
	onChange: (v: string) => void
	onBlur: () => void
	roles: Array<{ id: string; name: string }>
	errors: Array<string | { message: string } | undefined>
}) {
	return (
		<div className="space-y-1">
			<Label>Papel</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger onBlur={onBlur}>
					<SelectValue placeholder="Selecione um papel..." />
				</SelectTrigger>
				<SelectContent>
					{roles.map((role) => (
						<SelectItem key={role.id} value={role.id}>
							{role.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{errors.length > 0 && errors[0] != null && (
				<p className="text-xs text-destructive">
					{typeof errors[0] === 'string' ? errors[0] : errors[0].message}
				</p>
			)}
		</div>
	)
}
