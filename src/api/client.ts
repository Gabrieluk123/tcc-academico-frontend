import axios from 'axios'
import { authStore, clearAuth } from '../lib/auth-store'

export const client = axios.create({
	baseURL: import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:8080/api/v1',
})

client.interceptors.request.use((config) => {
	const token = authStore.state.token
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

client.interceptors.response.use(
	(response) => response,
	(error: unknown) => {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 401) {
				clearAuth()
				if (typeof window !== 'undefined') {
					window.location.href = '/login'
				}
				return Promise.reject(new Error('Sessão expirada. Faça login novamente.'))
			}
			const message =
				(error.response?.data as { message?: string } | undefined)?.message ??
				error.message ??
				'Erro inesperado'
			return Promise.reject(new Error(message))
		}
		return Promise.reject(error)
	},
)

export default client
