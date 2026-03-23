import { Store } from '@tanstack/store'
import { useStore } from '@tanstack/react-store'

interface AuthState {
	token: string | null
	userId: string | null
	roleId: string | null
}

const defaultState: AuthState = { token: null, userId: null, roleId: null }

function readStoredAuth(): AuthState {
	if (typeof window === 'undefined') return defaultState
	try {
		const raw = sessionStorage.getItem('auth')
		if (!raw) return defaultState
		return JSON.parse(raw) as AuthState
	} catch {
		return defaultState
	}
}

export const authStore = new Store<AuthState>(readStoredAuth())

authStore.subscribe(() => {
	if (typeof window === 'undefined') return
	sessionStorage.setItem('auth', JSON.stringify(authStore.state))
})

export function setAuth(token: string): void {
	try {
		const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>
		const userId = (payload['user_id'] ?? payload['sub'] ?? null) as string | null
		const roleId = (payload['role_id'] ?? null) as string | null
		authStore.setState(() => ({ token, userId, roleId }))
	} catch {
		authStore.setState(() => ({ token, userId: null, roleId: null }))
	}
}

export function clearAuth(): void {
	authStore.setState(() => defaultState)
	if (typeof window !== 'undefined') {
		sessionStorage.removeItem('auth')
	}
}

export const useAuthStore = () => useStore(authStore, (s) => s)

export const useIsAuthenticated = () => useStore(authStore, (s) => s.token !== null)
