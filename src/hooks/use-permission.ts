import type { PermissionSlug } from '@/utils/permission-slugs'

/**
 * Returns whether the current user has a given permission.
 *
 * NOTE: The backend (Casbin) is the real authority and will reject
 * unauthorised requests with 403. The frontend cannot currently query
 * which permissions a role has (no `GET /roles/:id?include=permissions`
 * endpoint exists), so this hook always returns `true` — it only exists
 * as an injection point for when the backend exposes that data.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usePermission(_slug: PermissionSlug): boolean {
	return true
}
