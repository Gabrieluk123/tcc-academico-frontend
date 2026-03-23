import { useStore } from '@tanstack/react-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useFieldContext, useFormContext } from './app-form-context'

export function AppTextField({
	label,
	placeholder,
	type = 'text',
}: {
	label: string
	placeholder?: string
	type?: 'text' | 'email' | 'password'
}) {
	const field = useFieldContext<string>()
	const errors = useStore(field.store, (state) => state.meta.errors)

	return (
		<div className="space-y-1">
			<Label htmlFor={field.name}>{label}</Label>
			<Input
				id={field.name}
				type={type}
				value={field.state.value}
				placeholder={placeholder}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				aria-invalid={field.state.meta.isTouched && errors.length > 0}
			/>
			{field.state.meta.isTouched && errors.length > 0 && (
				<ul className="space-y-1">
					{errors.map((error) => {
						const msg = typeof error === 'string' ? error : error.message
						return (
							<li key={msg} className="text-xs text-destructive">
								{msg}
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}

export function AppSubmitButton({
	label,
	className,
}: {
	label: string
	className?: string
}) {
	const form = useFormContext()
	return (
		<form.Subscribe selector={(state) => ({ isSubmitting: state.isSubmitting })}>
			{({ isSubmitting }) => (
				<Button type="submit" disabled={isSubmitting} className={cn('w-full', className)}>
					{isSubmitting ? (
						<span className="flex items-center gap-2">
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							Aguardando...
						</span>
					) : (
						label
					)}
				</Button>
			)}
		</form.Subscribe>
	)
}
