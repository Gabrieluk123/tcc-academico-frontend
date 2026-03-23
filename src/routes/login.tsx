import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { login } from '../api/auth'
import { setAuth, useIsAuthenticated } from '../lib/auth-store'
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
				setErrorMessage('Email ou senha incorretos.')
			} else {
				setErrorMessage('Erro inesperado, tente novamente.')
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
					<CardDescription>Entre com suas credenciais para continuar</CardDescription>
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
							{(field) => <field.TextField label="Email" type="email" placeholder="seuemail@exemplo.com" />}
						</form.AppField>

						<form.AppField name="password">
							{(field) => <field.TextField label="Senha" type="password" placeholder="••••••••" />}
						</form.AppField>

						<form.AppForm>
							<form.SubmitButton label="Entrar" />
						</form.AppForm>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
