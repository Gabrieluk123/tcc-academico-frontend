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
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

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
			toast.success(m.settings_sessions_toast_revoked())
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const changePasswordMutation = useMutation({
		mutationFn: ({ old_password, new_password }: { old_password: string; new_password: string; confirm_password: string }) =>
			changeMyPassword(old_password, new_password),
		onSuccess: () => {
			toast.success(m.settings_password_toast_success())
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
			<h1 className="text-2xl font-semibold">{m.settings_title()}</h1>

			{/* Row 1: Profile + Change Password side by side */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

				{/* Profile Info */}
				<Card className="flex flex-col">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle>{m.settings_profile_title()}</CardTitle>
						{canEdit && user && (
							<Button variant="outline" size="sm" onClick={() => setProfileDialogOpen(true)}>
								{m.common_edit()}
							</Button>
						)}
					</CardHeader>
					<CardContent className="flex-1">
						{user ? (
							<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
								<dt className="text-muted-foreground self-center">{m.settings_profile_name_label()}</dt>
								<dd className="font-medium">{user.first_name} {user.last_name}</dd>

								<dt className="text-muted-foreground self-center">{m.settings_profile_email_label()}</dt>
								<dd className="font-medium break-all">{user.email}</dd>

								<dt className="text-muted-foreground self-center">{m.settings_profile_role_label()}</dt>
                                <dd className="self-center"><Badge variant="secondary">{user.role?.name ?? user.role_id}</Badge></dd>

                                <dt className="text-muted-foreground self-center">{m.settings_profile_status_label()}</dt>
                                <dd className="self-center">
                                    {user.is_active
                                    ? <Badge variant="default">{m.common_active()}</Badge>
                                    : <Badge variant="destructive">{m.common_inactive()}</Badge>}
                                </dd>

								<dt className="text-muted-foreground self-center">{m.settings_profile_member_since_label()}</dt>
								<dd>{new Date(user.created_at).toLocaleDateString(getLocale())}</dd>

								<dt className="text-muted-foreground self-center">{m.settings_profile_active_sessions_label()}</dt>
								<dd className="font-medium">{sessions.filter((s) => !s.revoked).length}</dd>
							</dl>
						) : (
							<p className="text-sm text-muted-foreground">{m.common_loading()}</p>
						)}
					</CardContent>
				</Card>

				{/* Change Password */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle>{m.settings_password_title()}</CardTitle>
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
							{(field) => <field.TextField label={m.settings_password_current()} type="password" />}
						</passwordForm.AppField>
						<passwordForm.AppField name="new_password">
							{(field) => <field.TextField label={m.settings_password_new()} type="password" />}
						</passwordForm.AppField>
						<passwordForm.AppField name="confirm_password">
							{(field) => <field.TextField label={m.settings_password_confirm()} type="password" />}
						</passwordForm.AppField>
						<passwordForm.AppForm>
							<passwordForm.SubmitButton label={m.settings_password_submit()} className="w-auto" />
							</passwordForm.AppForm>
						</form>
					</CardContent>
				</Card>
			</div>

			{/* Row 2: Active Sessions — full width */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>{m.settings_sessions_title()}</CardTitle>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => revokeAllMutation.mutate()}
						disabled={revokeAllMutation.isPending || sessions.length === 0}
					>
						{m.settings_sessions_revoke_all()}
					</Button>
				</CardHeader>
				<CardContent>
					{sessionsLoading ? (
						<p className="text-sm text-muted-foreground">{m.common_loading()}</p>
					) : sessions.length === 0 ? (
						<p className="text-sm text-muted-foreground">{m.settings_sessions_empty()}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
										<TableHead>{m.settings_sessions_col_created_at()}</TableHead>
										<TableHead>{m.settings_sessions_col_expires_at()}</TableHead>
										<TableHead>{m.common_status()}</TableHead>
									<TableHead />
								</TableRow>
							</TableHeader>
							<TableBody>
								{sessions.map((session) => (
									<TableRow key={session.id}>
										<TableCell className="font-mono text-xs">{session.id.slice(0, 8)}…</TableCell>
										<TableCell className="text-xs">
										{new Date(session.created_at).toLocaleString(getLocale())}
									</TableCell>
									<TableCell className="text-xs">
										{new Date(session.expires_at).toLocaleString(getLocale())}
										</TableCell>
										<TableCell>
											{session.revoked ? (
											<Badge variant="secondary">{m.settings_sessions_status_revoked()}</Badge>
										) : (
											<Badge variant="default">{m.settings_sessions_status_active()}</Badge>
										)}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => revokeMutation.mutate(session.id)}
											disabled={session.revoked || revokeMutation.isPending}
										>
											{m.common_revoke()}
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
