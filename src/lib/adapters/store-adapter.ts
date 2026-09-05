// ============================================
// HRM Trà Sữa 🧋 — Store Data Adapter
// Real Supabase DB & Mock Stores Synchronization
// ============================================

import { isRealDbMode } from './repository-config'
import { supabase } from '../supabase'
import { mockStores, type Store } from '../mock-data'

const STORE_ID_MAP: Record<string, string> = {
  'store-001': 'c0000000-0000-0000-0000-000000000001',
  'store-002': 'c0000000-0000-0000-0000-000000000002',
  'store-003': 'c0000000-0000-0000-0000-000000000003',
}

const REVERSE_STORE_MAP: Record<string, string> = {
  'c0000000-0000-0000-0000-000000000001': 'store-001',
  'c0000000-0000-0000-0000-000000000002': 'store-002',
  'c0000000-0000-0000-0000-000000000003': 'store-003',
}

export type StoreWithWifi = Store & {
  wifi_ssid?: string
  wifi_bssid?: string
}

function mapStoreRow(row: Record<string, unknown>): StoreWithWifi {
  const rawId = String(row.id || '')
  return {
    id: REVERSE_STORE_MAP[rawId] || rawId,
    org_id: String(row.to_chuc_id || 'a0000000-0000-0000-0000-000000000001'),
    name: String(row.ten || row.ten_cua_hang || row.name || ''),
    address: String(row.dia_chi || row.address || ''),
    latitude: Number(row.vi_do || row.latitude || 10.8),
    longitude: Number(row.kinh_do || row.longitude || 106.7),
    checkin_radius_meters: Number(row.ban_kinh_met || row.ban_kinh_checkin || 150),
    phone: String(row.so_dien_thoai || ''),
    is_active: Boolean(row.trang_thai === 'hoat_dong' || row.trang_thai !== 'ngung_hoat_dong'),
    wifi_ssid: typeof row.wifi_ssid === 'string' && row.wifi_ssid.trim() ? row.wifi_ssid : undefined,
    wifi_bssid: typeof row.wifi_bssid === 'string' && row.wifi_bssid.trim() ? row.wifi_bssid : undefined,
  }
}

export const storeAdapter = {
  async getStores(): Promise<StoreWithWifi[]> {
    if (isRealDbMode()) {
      try {
        const { data, error } = await supabase.from('cua_hang').select('*').order('ngay_tao', { ascending: true })
        if (error || !data || data.length === 0) return mockStores
        return data.map((row: Record<string, unknown>) => mapStoreRow(row))
      } catch {
        return mockStores
      }
    }
    return mockStores
  },

  async getStoreById(id: string): Promise<StoreWithWifi | null> {
    if (isRealDbMode()) {
      const dbId = STORE_ID_MAP[id] || id
      try {
        const { data, error } = await supabase.from('cua_hang').select('*').eq('id', dbId).maybeSingle()
        if (error) throw new Error(error.message || 'Không truy vấn được cửa hàng')
        if (data) return mapStoreRow(data as Record<string, unknown>)
      } catch (error) {
        throw error
      }
    }

    const stores = await this.getStores()
    const legacyId = REVERSE_STORE_MAP[id] || id
    return stores.find(s => s.id === legacyId || s.id === id) || null
  },

  async upsertStore(store: Partial<Store>): Promise<Store | null> {
    if (isRealDbMode() && store.id) {
      try {
        const payload = {
          id: store.id,
          ten: store.name,
          dia_chi: store.address,
          so_dien_thoai: store.phone,
          vi_do: store.latitude,
          kinh_do: store.longitude,
          ban_kinh_met: store.checkin_radius_meters,
          trang_thai: store.is_active ? 'hoat_dong' : 'ngung_hoat_dong',
        }
        await supabase.from('cua_hang').upsert([payload])
      } catch (err) {
        console.warn('[StoreAdapter] Upsert fallback:', err)
      }
    }
    return (await this.getStoreById(store.id || '')) || null
  }
}
