import { saveStoresToStorage } from '@/lib/mock-data'
import {
  MasterDataRepository,
  type MasterDataEntityKey,
  type MasterDataState,
} from '@/lib/services/master-data-repository'

const API_URL = '/api/settings/master-data'

type ApiResponse = {
  ok: boolean
  state?: MasterDataState
}

function syncRuntimeCaches(state?: MasterDataState) {
  if (!state) return
  saveStoresToStorage(state.stores)
}

async function request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', orgId: string, body?: Record<string, unknown>) {
  const url = method === 'GET' ? `${API_URL}?orgId=${encodeURIComponent(orgId)}` : API_URL
  const response = await fetch(url, {
    method,
    headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify({ orgId, ...body }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`master-data-api-${response.status}`)
  }

  return response.json() as Promise<T>
}

export class MasterDataClientService {
  static async getState(orgId: string) {
    try {
      const result = await request<ApiResponse>('GET', orgId)
      if (result.ok && result.state) {
        syncRuntimeCaches(result.state)
        return result.state
      }
    } catch {}

    return MasterDataRepository.getState(orgId)
  }

  static async createItem<K extends MasterDataEntityKey>(orgId: string, key: K, payload: Record<string, unknown>) {
    try {
      const result = await request<ApiResponse>('POST', orgId, { key, payload })
      if (result.ok && result.state) {
        syncRuntimeCaches(result.state)
        return result.state
      }
    } catch {}

    MasterDataRepository.createItem(orgId, key, payload as never)
    return MasterDataRepository.getState(orgId)
  }

  static async updateItem<K extends MasterDataEntityKey>(orgId: string, key: K, itemId: string, payload: Record<string, unknown>) {
    try {
      const result = await request<ApiResponse>('PATCH', orgId, { key, itemId, payload })
      if (result.ok && result.state) {
        syncRuntimeCaches(result.state)
        return result.state
      }
    } catch {}

    MasterDataRepository.updateItem(orgId, key, itemId, payload as never)
    return MasterDataRepository.getState(orgId)
  }

  static async deleteItem<K extends MasterDataEntityKey>(orgId: string, key: K, itemId: string) {
    try {
      const result = await request<ApiResponse>('DELETE', orgId, { key, itemId })
      if (result.ok && result.state) {
        syncRuntimeCaches(result.state)
        return result.state
      }
    } catch {}

    MasterDataRepository.deleteItem(orgId, key, itemId)
    return MasterDataRepository.getState(orgId)
  }
}
