import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { User } from '@/types/api'
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
			toast.success('Sessão revogada.')
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const revokeAllMutation = useMutation({
		mutationFn: () => deleteAllUserSessions(userId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sessions', userId] })
			toast.success('Todas as sessões revogadas.')
		},
		onError: (err: Error) => toast.error(err.message),
	})

	const sessions = data?.items ?? []

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-xl overflow-y-auto">
				<SheetHeader className="mb-4">
					<SheetTitle>
						Sessões de {user?.first_name} {user?.last_name}
					</SheetTitle>
				</SheetHeader>

				<div className="mb-4">
					<Button
						variant="destructive"
						size="sm"
						onClick={() => revokeAllMutation.mutate()}
						disabled={revokeAllMutation.isPending || sessions.length === 0}
					>
						Revogar Todas
					</Button>
				</div>

				{isLoading ? (
					<p className="text-muted-foreground text-sm">Carregando...</p>
				) : sessions.length === 0 ? (
					<p className="text-muted-foreground text-sm">Nenhuma sessão ativa.</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Expira em</TableHead>
								<TableHead>Status</TableHead>
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
			</SheetContent>
		</Sheet>
	)
}
