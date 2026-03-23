import client from './client'
import type { LoginRequest, LoginResponse } from '../types/api'

export async function login(data: LoginRequest): Promise<LoginResponse> {
	const response = await client.post<LoginResponse>('/login', data)
	return response.data
}

export async function logout(): Promise<void> {
	await client.post('/logout')
}
