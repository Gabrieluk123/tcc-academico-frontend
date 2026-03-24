import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { login } from '../api/auth'
import { setAuth, useIsAuthenticated } from '../lib/auth-store'
import { m } from '@/paraglide/messages'
import { useAppForm } from '../hooks/app-form'
import { loginRequestSchema } from '@/types/api'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Route = createFileRoute('/login')({
	component: LoginPage,
})

function LoginPage() {
	const navigate = useNavigate()
	const isAuthenticated = useIsAuthenticated()
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	useEffect(() => {
		if (isAuthenticated) {
			navigate({ to: '/users' })
		}
	}, [isAuthenticated, navigate])

	const mutation = useMutation({
		mutationFn: login,
		onSuccess: (data) => {
			setAuth(data.token)
			navigate({ to: '/users' })
		},
		onError: (error: Error) => {
			const msg = error.message.toLowerCase()
			if (msg.includes('401') || msg.includes('credencial') || msg.includes('senha') || msg.includes('email') || msg.includes('invalid')) {
				setErrorMessage(m.login_error_credentials())
			} else {
				setErrorMessage(m.login_error_unexpected())
			}
		},
	})

	const form = useAppForm({
		defaultValues: { email: '', password: '' },
		validators: { onBlur: loginRequestSchema },
		onSubmit: ({ value }) => {
			setErrorMessage(null)
			mutation.mutate(value)
		},
	})

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Acadêmico Dr Alto</CardTitle>
					<CardDescription>{m.login_subtitle()}</CardDescription>
				</CardHeader>
				<CardContent>
					{errorMessage && (
						<Alert variant="destructive" className="mb-4">
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					)}
					<form
						onSubmit={(e) => {
							e.preventDefault()
							e.stopPropagation()
							form.handleSubmit()
						}}
						className="space-y-4"
					>
						<form.AppField name="email">
						{(field) => <field.TextField label={m.common_email()} type="email" placeholder={m.login_email_placeholder()} />}
					</form.AppField>

					<form.AppField name="password">
						{(field) => <field.TextField label={m.login_password_label()} type="password" placeholder="••••••••" />}
					</form.AppField>

					<form.AppForm>
						<form.SubmitButton label={m.login_submit()} />
						</form.AppForm>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
