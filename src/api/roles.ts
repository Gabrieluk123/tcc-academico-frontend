import client from './client'
import type {
	Role,
	PaginatedResponse,
	CreateRoleRequest,
	UpdateRoleRequest,
} from '../types/api'

export async function listRoles(): Promise<PaginatedResponse<Role>> {
	const response = await client.get<PaginatedResponse<Role>>('/roles')
	return response.data
}

export async function getRoleById(id: string, include?: string): Promise<Role> {
	const response = await client.get<Role>(`/roles/${id}`, {
		params: include ? { include } : undefined,
	})
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
	console.log('updateRole data:', data) // Log dos dados
	const response = await client.patch<Role>(`/roles/${id}`, data)
	console.log('updateRole response:', response.data) // Log da resposta completa
	return response.data
}

export async function deleteRole(id: string): Promise<void> {
	await client.delete(`/roles/${id}`)
}

export async function reassignRoleUsers(
	roleId: string,
	newRoleId: string,
): Promise<void> {
	await client.patch(`/roles/${roleId}/users`, { new_role_id: newRoleId })
}

export async function assignRolePermissions(
	roleId: string,
	permissionIds: string[],
): Promise<Role> {
	const response = await client.patch<Role>(`/roles/${roleId}`, {
		permission_ids: permissionIds,
	})
	return response.data
}
