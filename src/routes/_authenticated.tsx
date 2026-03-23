import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { authStore } from '../lib/auth-store'

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: () => {
		if (!authStore.state.token) {
			throw redirect({ to: '/login' })
		}
	},
	component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
	return (
		<AppLayout>
			<Outlet />
		</AppLayout>
	)
}
