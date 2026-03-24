import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Settings, Shield, Users } from 'lucide-react'
import { logout } from '../../api/auth'
import { clearAuth, useAuthStore } from '../../lib/auth-store'
import { usePermission } from '../../hooks/use-permission'
import { getMe } from '../../api/users'
import { Button } from '../ui/button'
import ThemeToggle from '../ThemeToggle'
import LocaleSwitcher from '../LocaleSwitcher'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from '../ui/sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate()
	const auth = useAuthStore()
	const routerState = useRouterState()
	const currentPath = routerState.location.pathname
	const canReadRoles = usePermission('role:read')

	const { data: me } = useQuery({
		queryKey: ['me'],
		queryFn: () => getMe('role,permissions'),
		enabled: !!auth.token,
		staleTime: 5 * 60 * 1000,
	})

	const displayName = me
		? `${me.first_name} ${me.last_name}`.trim()
		: (auth.userId ?? 'Usuário')

	async function handleLogout() {
		try {
			await logout()
		} catch {
			// ignore logout errors
		} finally {
			clearAuth()
			navigate({ to: '/login' })
		}
	}

	const navItems = [
		{ to: '/users' as const, label: 'Usuários', icon: Users, visible: true },
		{ to: '/roles' as const, label: 'Papéis', icon: Shield, visible: canReadRoles },
		{ to: '/settings' as const, label: 'Configurações', icon: Settings, visible: true },
	]

	return (
		<SidebarProvider>
			<Sidebar collapsible="icon">
				<SidebarHeader className="border-b px-4 py-3">
					<span className="font-semibold text-sm truncate">Acadêmico Dr Alto</span>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{navItems.filter(item => item.visible).map(({ to, label, icon: Icon }) => {
									const isActive = currentPath.startsWith(to)
									return (
										<SidebarMenuItem key={to}>
											<SidebarMenuButton asChild isActive={isActive} tooltip={label}>
												<Link to={to}>
													<Icon />
													<span>{label}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									)
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="border-t p-3">
					<div className="flex flex-col gap-2">
					<p className="text-xs text-muted-foreground truncate px-1" title={me?.email}>
						{displayName}
						</p>
						<Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
							Sair
						</Button>
					</div>
				</SidebarFooter>
			</Sidebar>

			<SidebarInset>
				<header className="flex h-12 items-center gap-2 border-b px-4">
					<SidebarTrigger />
					<div className="ml-auto flex items-center gap-1">
						<LocaleSwitcher />
						<ThemeToggle />
					</div>
				</header>
				<main className="flex-1 p-6">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
