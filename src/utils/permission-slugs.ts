/**
 * All permission slugs that exist in the system.
 * These mirror the slugs used by the backend (Casbin policies).
 * UIs use these to guard buttons/actions — the server is the actual authority.
 */
export const PERMISSION_SLUGS = [
	// Users module
	'user:create',
	'user:read',
	'user:update',
	'user:delete',
	// Roles module
	'role:create',
	'role:read',
	'role:update',
	'role:delete',
	// Permissions module
	'permission:read',
	'permission:assign',
] as const

export type PermissionSlug = (typeof PERMISSION_SLUGS)[number]
