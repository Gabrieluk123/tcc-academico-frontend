import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/api/users'
import type { PermissionSlug } from '@/utils/permission-slugs'

/**
 * Returns whether the authenticated user's role contains the given permission.
 *
 * Uses GET /users/me?include=role,permissions so the server resolves Casbin
 * policies in the user's own context — wildcard roles (e.g. Admin) work
 * correctly because the server expands `*` into all known permission slugs.
 *
 * The server is the real authority; this only controls UI visibility.
 */
export function usePermission(slug: PermissionSlug): boolean {
	const { data: me } = useQuery({
		queryKey: ['me'],
		queryFn: () => getMe('role,permissions'),
		staleTime: 5 * 60 * 1000,
	})

	const permissions = me?.role?.permissions
	if (!permissions) return false

	// Wildcard: backend may return a single {slug:'*'} entry for unrestricted roles
	if (permissions.some((p) => p.slug === '*')) return true

	return permissions.some((p) => p.slug === slug)
}
