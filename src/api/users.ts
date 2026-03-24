import client from './client'
import type {
	User,
	Session,
	PaginatedResponse,
	ListResponse,
	CreateUserRequest,
	UpdateUserRequest,
	UserListParams,
} from '../types/api'

export async function listUsers(
	params?: UserListParams,
): Promise<PaginatedResponse<User>> {
	const response = await client.get<PaginatedResponse<User>>('/users', { params })
	return response.data
}

export async function getUserById(id: string, include?: string): Promise<User> {
	const response = await client.get<User>(`/users/${id}`, {
		params: include ? { include } : undefined,
	})
	return response.data
}

export async function createUser(data: CreateUserRequest): Promise<User> {
	const response = await client.post<User>('/users', data)
	return response.data
}

export async function updateUser(
	id: string,
	data: UpdateUserRequest,
): Promise<User> {
	const response = await client.patch<User>(`/users/${id}`, data)
	return response.data
}

export async function deleteUser(id: string): Promise<void> {
	await client.delete(`/users/${id}`)
}

export async function listUserSessions(
	userId: string,
): Promise<ListResponse<Session>> {
	const response = await client.get<ListResponse<Session>>(
		`/users/${userId}/sessions`,
	)
	return response.data
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
	await client.delete(`/users/${userId}/sessions`)
}

// Backend: DELETE /api/v1/sessions/:id  (NOT nested under /users/:id)
export async function revokeSession(sessionId: string): Promise<void> {
	await client.delete(`/sessions/${sessionId}`)
}

export async function getMe(include?: string): Promise<User> {
	const response = await client.get<User>('/users/me', {
		params: include ? { include } : undefined,
	})
	return response.data
}

export async function changeMyPassword(
	oldPassword: string,
	newPassword: string,
): Promise<void> {
	await client.patch('/users/me/password', {
		old_password: oldPassword,
		new_password: newPassword,
	})
}
