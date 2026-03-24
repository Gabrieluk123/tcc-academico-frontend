import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { User } from '@/types/api'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listUserSessions, revokeSession, deleteAllUserSessions } from '@/api/users'

interface UserSessionsSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	user: User | null
}

export function UserSessionsSheet({ open, onOpenChange, user }: UserSessionsSheetProps) {
	const queryClient = useQueryClient()
	const userId = user?.id ?? ''

	const { data, isLoading } = useQuery({
		queryKey: ['sessions', userId],
		queryFn: () => listUserSessions(userId),
		enabled: open && !!userId,
	})

	const revokeMutation = useMutation({
		mutationFn: (sessionId: string) => revokeSession(sessionId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sessions', userId] })
			toast.success(m.settings_sessions_toast_revoked())
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const revokeAllMutation = useMutation({
		mutationFn: () => deleteAllUserSessions(userId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sessions', userId] })
			toast.success(m.sessions_all_revoked_toast())
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const sessions = data?.items ?? []

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-xl overflow-y-auto">
				<SheetHeader className="mb-4">
					<SheetTitle>
					{m.sessions_sheet_title({ name: `${user?.first_name} ${user?.last_name}` })}
					</SheetTitle>
				</SheetHeader>

				<div className="mb-4">
					<Button
						variant="destructive"
						size="sm"
						onClick={() => revokeAllMutation.mutate()}
						disabled={revokeAllMutation.isPending || sessions.length === 0}
					>
						{m.settings_sessions_revoke_all()}
					</Button>
				</div>

				{isLoading ? (
					<p className="text-muted-foreground text-sm">{m.common_loading()}</p>
				) : sessions.length === 0 ? (
					<p className="text-muted-foreground text-sm">{m.settings_sessions_empty()}</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>{m.settings_sessions_col_expires_at()}</TableHead>
								<TableHead>{m.common_status()}</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{sessions.map((session) => (
								<TableRow key={session.id}>
									<TableCell className="font-mono text-xs">
										{session.id.slice(0, 8)}...
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
									<TableCell>
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
			</SheetContent>
		</Sheet>
	)
}
