// ============================================
// Store WiFi Configurations for WiFi Check-in
// ============================================

export type StoreWifiConfig = {
  id: string
  store_id: string
  wifi_ssid: string
  wifi_bssid: string
  is_active: boolean
  created_at: string
}

// Mutable store — supports add/remove/toggle
const wifiConfigs: StoreWifiConfig[] = [
  {
    id: 'wifi-001',
    store_id: 'store-001',
    wifi_ssid: 'Homies_HoBaPhan',
    wifi_bssid: 'AA:BB:CC:11:22:33',
    is_active: true,
    created_at: '2026-01-01T00:00:00',
  },
  {
    id: 'wifi-002',
    store_id: 'store-002',
    wifi_ssid: 'Homies_Duong429',
    wifi_bssid: 'AA:BB:CC:44:55:66',
    is_active: true,
    created_at: '2026-01-01T00:00:00',
  },
  {
    id: 'wifi-003',
    store_id: 'store-003',
    wifi_ssid: 'Homies_LeVanSy',
    wifi_bssid: 'AA:BB:CC:77:88:99',
    is_active: true,
    created_at: '2026-01-01T00:00:00',
  },
]

let idCounter = 100

// ─── Queries ───

/** Get all WiFi configs for a store */
export function getStoreWifiConfigs(storeId: string): StoreWifiConfig[] {
  return wifiConfigs.filter(w => w.store_id === storeId)
}

/** Get active WiFi configs for a store */
export function getActiveStoreWifi(storeId: string): StoreWifiConfig[] {
  return wifiConfigs.filter(w => w.store_id === storeId && w.is_active)
}

/** Check if a given SSID matches any active WiFi for a store */
export function matchStoreWifi(
  storeId: string,
  ssid: string,
  bssid?: string,
): StoreWifiConfig | null {
  const configs = getActiveStoreWifi(storeId)
  for (const cfg of configs) {
    // Match by BSSID first (more secure), then by SSID
    if (bssid && cfg.wifi_bssid === bssid) return cfg
    if (cfg.wifi_ssid === ssid) return cfg
  }
  return null
}

/** Get all WiFi SSIDs across all stores (for simulator dropdown) */
export function getAllWifiSSIDs(): { ssid: string; storeName: string; storeId: string }[] {
  // Import mockStores inline to avoid circular deps
  const results: { ssid: string; storeName: string; storeId: string }[] = []
  for (const cfg of wifiConfigs) {
    if (cfg.is_active) {
      results.push({
        ssid: cfg.wifi_ssid,
        storeName: cfg.store_id, // Will be resolved in component
        storeId: cfg.store_id,
      })
    }
  }
  return results
}

// ─── Mutations (for config page) ───

/** Add a new WiFi config */
export function addWifiConfig(storeId: string, ssid: string, bssid: string): StoreWifiConfig {
  const record: StoreWifiConfig = {
    id: `wifi-${idCounter++}`,
    store_id: storeId,
    wifi_ssid: ssid,
    wifi_bssid: bssid,
    is_active: true,
    created_at: new Date().toISOString(),
  }
  wifiConfigs.push(record)
  return record
}

/** Toggle active status */
export function toggleWifiConfig(id: string): boolean {
  const cfg = wifiConfigs.find(w => w.id === id)
  if (!cfg) return false
  cfg.is_active = !cfg.is_active
  return true
}

/** Remove a WiFi config */
export function removeWifiConfig(id: string): boolean {
  const idx = wifiConfigs.findIndex(w => w.id === id)
  if (idx === -1) return false
  wifiConfigs.splice(idx, 1)
  return true
}
