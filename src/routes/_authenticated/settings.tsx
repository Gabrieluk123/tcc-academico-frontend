import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { getUserById, listUserSessions, revokeSession, deleteAllUserSessions } from '@/api/users'
import { logout } from '@/api/auth'
import { useAuthStore, clearAuth } from '@/lib/auth-store'
import { usePermission } from '@/hooks/use-permission'
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
		queryKey: ['user', userId],
		queryFn: () => getUserById(userId, 'role'),
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
		<div className="space-y-6 max-w-2xl">
			<h1 className="text-2xl font-semibold">Configurações</h1>

			{/* Section 1: Profile Info */}
			<Card>
				<CardHeader>
					<CardTitle>Perfil</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{user ? (
						<>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<span className="text-muted-foreground">Nome completo</span>
								<span>{user.first_name} {user.last_name}</span>
								<span className="text-muted-foreground">Email</span>
								<span>{user.email}</span>
								<span className="text-muted-foreground">Papel</span>
								<span>{user.role?.name ?? user.role_id}</span>
								<span className="text-muted-foreground">Status</span>
								<span>
									{user.is_active ? (
										<Badge variant="default">Ativo</Badge>
									) : (
										<Badge variant="secondary">Inativo</Badge>
									)}
								</span>
								<span className="text-muted-foreground">Membro desde</span>
								<span>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
							</div>
							{canEdit && (
								<Button variant="outline" size="sm" onClick={() => setProfileDialogOpen(true)}>
									Editar Perfil
								</Button>
							)}
						</>
					) : (
						<p className="text-sm text-muted-foreground">Carregando...</p>
					)}
				</CardContent>
			</Card>

			{/* Section 2: Change Password */}
			<Card>
				<CardHeader>
					<CardTitle>Alterar Senha</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						A alteração de senha não está disponível nesta versão do sistema.
					</p>
				</CardContent>
			</Card>

			{/* Section 3: Active Sessions */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Sessões Ativas</CardTitle>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => revokeAllMutation.mutate()}
						disabled={revokeAllMutation.isPending || sessions.length === 0}
					>
						Revogar Todas as Outras
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
										<TableCell className="font-mono text-xs">{session.id.slice(0, 8)}...</TableCell>
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
										<TableCell>
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
							queryClient.invalidateQueries({ queryKey: ['user', userId] })
						}
					}}
					user={user}
					hideRoleAndPassword
				/>
			)}
		</div>
	)
}
