import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	title: string
	description: string
	loading?: boolean
}

export function ConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
	loading = false,
}: ConfirmDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button variant="destructive" onClick={onConfirm} disabled={loading}>
							{loading ? (
								<span className="flex items-center gap-2">
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									Aguardando...
								</span>
							) : (
								'Confirmar'
							)}
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
