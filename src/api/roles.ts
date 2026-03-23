import client from './client'
import type {
	Role,
	CreateRoleRequest,
	UpdateRoleRequest,
} from '../types/api'

// Backend returns a plain array (no {items,total} wrapper)
export async function listRoles(): Promise<Role[]> {
	const response = await client.get<Role[]>('/roles')
	return response.data
}

export async function getRoleById(id: string): Promise<Role> {
	const response = await client.get<Role>(`/roles/${id}`)
	return response.data
}

export async function createRole(data: CreateRoleRequest): Promise<Role> {
	const response = await client.post<Role>('/roles', data)
	return response.data
}

export async function updateRole(
	id: string,
	data: UpdateRoleRequest,
): Promise<Role> {
	const response = await client.patch<Role>(`/roles/${id}`, data)
	return response.data
}

export async function deleteRole(id: string): Promise<void> {
	await client.delete(`/roles/${id}`)
}
