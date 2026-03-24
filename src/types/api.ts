import { z } from 'zod'

// ---------------------------------------------------------------------------
// Entity schemas + inferred types
// ---------------------------------------------------------------------------

export const permissionSchema = z.object({
	id: z.string(),
	slug: z.string(),
	description: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
})
export type Permission = z.infer<typeof permissionSchema>

export const roleSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	permissions: z.array(permissionSchema).optional(),
	created_at: z.string(),
	updated_at: z.string(),
})
export type Role = z.infer<typeof roleSchema>

export const sessionSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	expires_at: z.string(),
	revoked: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
})
export type Session = z.infer<typeof sessionSchema>

export const userSchema = z.object({
	id: z.string(),
	first_name: z.string(),
	last_name: z.string(),
	email: z.string(),
	role_id: z.string(),
	role: roleSchema.optional(),
	is_active: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
})
export type User = z.infer<typeof userSchema>

// ---------------------------------------------------------------------------
// Generic response wrappers
// (kept as TS interfaces — generic Zod factories add complexity with no payoff)
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
	items: T[]
	total: number
	page: number
	page_size: number
}

export interface ListResponse<T> {
	items: T[]
	total: number
}

// ---------------------------------------------------------------------------
// Auth schemas + inferred types
// ---------------------------------------------------------------------------

export const loginRequestSchema = z.object({
	email: z.email('Email inválido'),
	password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

export const loginResponseSchema = z.object({
	token: z.string(),
})
export type LoginResponse = z.infer<typeof loginResponseSchema>

// ---------------------------------------------------------------------------
// User payload schemas + inferred types
// ---------------------------------------------------------------------------

export const createUserSchema = z.object({
	first_name: z.string().min(1, 'Nome é obrigatório'),
	last_name: z.string().min(1, 'Sobrenome é obrigatório'),
	email: z.email('Email inválido'),
	password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
	role_id: z.string().min(1, 'Papel é obrigatório'),
})
export type CreateUserRequest = z.infer<typeof createUserSchema>

// Note: backend PATCH /users/:id does NOT accept a password field
export const updateUserSchema = z.object({
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	email: z.string().email('Email inválido').optional(),
	role_id: z.string().optional(),
	is_active: z.boolean().optional(),
})
export type UpdateUserRequest = z.infer<typeof updateUserSchema>

export const userListParamsSchema = z.object({
	page: z.number().optional(),
	page_size: z.number().optional(),
	order_by: z.string().optional(),
	order_dir: z.enum(['asc', 'desc']).optional(),
	role_id: z.string().optional(),
	is_active: z.boolean().optional(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	email: z.string().optional(),
	include: z.string().optional(),
})
export type UserListParams = z.infer<typeof userListParamsSchema>

// ---------------------------------------------------------------------------
// Role payload schemas + inferred types
// ---------------------------------------------------------------------------

export const createRoleSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	description: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
})
export type CreateRoleRequest = z.infer<typeof createRoleSchema>

export const updateRoleSchema = createRoleSchema.partial().extend({
	permission_ids: z.array(z.string()).optional(),
})
export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export const apiErrorSchema = z.object({
	message: z.string(),
})
export type ApiError = z.infer<typeof apiErrorSchema>

// ---------------------------------------------------------------------------
// Self-service password change
// ---------------------------------------------------------------------------

export const changePasswordSchema = z
	.object({
		old_password: z.string().min(6, 'Senha atual deve ter pelo menos 6 caracteres'),
		new_password: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
		confirm_password: z.string(),
	})
	.refine((d) => d.new_password === d.confirm_password, {
		message: 'As senhas não coincidem',
		path: ['confirm_password'],
	})
export type ChangePasswordRequest = { old_password: string; new_password: string }
