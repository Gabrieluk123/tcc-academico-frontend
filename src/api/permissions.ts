import client from './client'
import type { Permission, ListResponse } from '../types/api'

export async function listPermissions(): Promise<ListResponse<Permission>> {
	const response = await client.get<ListResponse<Permission>>('/permissions')
	return response.data
}

export async function getPermissionById(id: string): Promise<Permission> {
	const response = await client.get<Permission>(`/permissions/${id}`)
	return response.data
}
