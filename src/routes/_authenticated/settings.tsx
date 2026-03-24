import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { getMe, listUserSessions, revokeSession, deleteAllUserSessions, changeMyPassword } from '@/api/users'
import { logout } from '@/api/auth'
import { useAuthStore, clearAuth } from '@/lib/auth-store'
import { usePermission } from '@/hooks/use-permission'
import { useAppForm } from '@/hooks/app-form'
import { changePasswordSchema } from '@/types/api'
import { UserFormDialog } from '@/components/users/UserFormDialog'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/_authenticated/settings')({
	component: SettingsPage,
})

function SettingsPage() {
	const navigate = useNavigate()
	const auth = useAuthStore()
	const userId = auth.userId ?? ''
	const queryClient = useQueryClient()
	const [profileDialogOpen, setProfileDialogOpen] = useState(false)
	const canEdit = usePermission('user:update')

	const { data: user } = useQuery({
		queryKey: ['me'],
		queryFn: () => getMe('role,permissions'),
		enabled: !!userId,
	})

	const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
		queryKey: ['sessions', userId],
		queryFn: () => listUserSessions(userId),
		enabled: !!userId,
	})
	const sessions = sessionsData?.items ?? []

	const revokeMutation = useMutation({
		mutationFn: (sessionId: string) => revokeSession(sessionId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sessions', userId] })
			toast.success('Sessão revogada.')
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const changePasswordMutation = useMutation({
		mutationFn: ({ old_password, new_password }: { old_password: string; new_password: string; confirm_password: string }) =>
			changeMyPassword(old_password, new_password),
		onSuccess: () => {
			toast.success('Senha alterada com sucesso.')
			passwordForm.reset()
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const passwordForm = useAppForm({
		defaultValues: { old_password: '', new_password: '', confirm_password: '' },
		validators: { onBlur: changePasswordSchema },
		onSubmit: ({ value }) => changePasswordMutation.mutate(value),
	})
	const revokeAllMutation = useMutation({
		mutationFn: () => deleteAllUserSessions(userId),
		onSuccess: async () => {
			try {
				await logout()
			} catch {
				// ignore
			}
			clearAuth()
			navigate({ to: '/login' })
		},
		onError: (err: Error) => toast.error(err.message),
	})

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold">Configurações</h1>

			{/* Row 1: Profile + Change Password side by side */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

				{/* Profile Info */}
				<Card className="flex flex-col">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle>Perfil</CardTitle>
						{canEdit && user && (
							<Button variant="outline" size="sm" onClick={() => setProfileDialogOpen(true)}>
								Editar
							</Button>
						)}
					</CardHeader>
					<CardContent className="flex-1">
						{user ? (
							<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
								<dt className="text-muted-foreground self-center">Nome</dt>
								<dd className="font-medium">{user.first_name} {user.last_name}</dd>

								<dt className="text-muted-foreground self-center">Email</dt>
								<dd className="font-medium break-all">{user.email}</dd>

								<dt className="text-muted-foreground self-center">Papel</dt>
								<dd><Badge variant="secondary">{user.role?.name ?? user.role_id}</Badge></dd>

								<dt className="text-muted-foreground self-center">Status</dt>
								<dd>
									{user.is_active
										? <Badge variant="default">Ativo</Badge>
										: <Badge variant="destructive">Inativo</Badge>}
								</dd>

								<dt className="text-muted-foreground self-center">Membro desde</dt>
								<dd>{new Date(user.created_at).toLocaleDateString('pt-BR')}</dd>

								<dt className="text-muted-foreground self-center">Sessões ativas</dt>
								<dd className="font-medium">{sessions.filter((s) => !s.revoked).length}</dd>
							</dl>
						) : (
							<p className="text-sm text-muted-foreground">Carregando...</p>
						)}
					</CardContent>
				</Card>

				{/* Change Password */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle>Alterar Senha</CardTitle>
					</CardHeader>
					<CardContent className="flex-1">
						<form
							onSubmit={(e) => {
								e.preventDefault()
								e.stopPropagation()
								passwordForm.handleSubmit()
							}}
							className="space-y-4"
						>
							<passwordForm.AppField name="old_password">
								{(field) => <field.TextField label="Senha atual" type="password" />}
							</passwordForm.AppField>
							<passwordForm.AppField name="new_password">
								{(field) => <field.TextField label="Nova senha" type="password" />}
							</passwordForm.AppField>
							<passwordForm.AppField name="confirm_password">
								{(field) => <field.TextField label="Confirmar nova senha" type="password" />}
							</passwordForm.AppField>
							<passwordForm.AppForm>
								<passwordForm.SubmitButton label="Alterar Senha" className="w-auto" />
							</passwordForm.AppForm>
						</form>
					</CardContent>
				</Card>
			</div>

			{/* Row 2: Active Sessions — full width */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Sessões Ativas</CardTitle>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => revokeAllMutation.mutate()}
						disabled={revokeAllMutation.isPending || sessions.length === 0}
					>
						Revogar Todas
					</Button>
				</CardHeader>
				<CardContent>
					{sessionsLoading ? (
						<p className="text-sm text-muted-foreground">Carregando...</p>
					) : sessions.length === 0 ? (
						<p className="text-sm text-muted-foreground">Nenhuma sessão ativa.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Criada em</TableHead>
									<TableHead>Expira em</TableHead>
									<TableHead>Status</TableHead>
									<TableHead />
								</TableRow>
							</TableHeader>
							<TableBody>
								{sessions.map((session) => (
									<TableRow key={session.id}>
										<TableCell className="font-mono text-xs">{session.id.slice(0, 8)}…</TableCell>
										<TableCell className="text-xs">
											{new Date(session.created_at).toLocaleString('pt-BR')}
										</TableCell>
										<TableCell className="text-xs">
											{new Date(session.expires_at).toLocaleString('pt-BR')}
										</TableCell>
										<TableCell>
											{session.revoked ? (
												<Badge variant="secondary">Revogada</Badge>
											) : (
												<Badge variant="default">Ativa</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => revokeMutation.mutate(session.id)}
												disabled={session.revoked || revokeMutation.isPending}
											>
												Revogar
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{user && (
				<UserFormDialog
					open={profileDialogOpen}
					onOpenChange={(open) => {
						setProfileDialogOpen(open)
						if (!open) {
							queryClient.invalidateQueries({ queryKey: ['me'] })
						}
					}}
					user={user}
					hideRoleAndPassword
				/>
			)}
		</div>
	)
}
