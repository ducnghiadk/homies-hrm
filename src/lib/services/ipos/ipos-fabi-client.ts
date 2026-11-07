/**
 * iPOS FABi Client Service (Private Dashboard API / Web Reverse-Engineering)
 * Học hỏi từ kiến trúc ZaloCRM:
 * - Không cần Open API Secret Key đắt đỏ
 * - Đăng nhập trực tiếp như Web CMS fabi.ipos.vn qua máy chủ posapi.ipos.vn
 * - Sử dụng access_token ứng dụng web cấu hình từ biến môi trường (IPOS_FABI_WEB_APP_TOKEN)
 * - Lấy JWT Bearer Token (thời hạn 7 ngày) để đọc Doanh thu, Hóa đơn, Cửa hàng
 */

export const IPOS_FABI_WEB_APP_TOKEN =
  process.env.NEXT_PUBLIC_IPOS_FABI_WEB_APP_TOKEN ||
  process.env.IPOS_FABI_WEB_APP_TOKEN ||
  ''
export const IPOS_FABI_TYPE = 'pos-cms'
export const IPOS_POSAPI_BASE = 'https://posapi.ipos.vn'

export interface FabiStoreInfo {
  id: string
  name: string
  address?: string
  code?: string
  phone?: string
}

export interface FabiLoginResult {
  success: boolean
  message: string
  token?: string
  expires_at?: string
  company_uid?: string
  company_name?: string
  brand_uid?: string
  brand_name?: string
  stores?: FabiStoreInfo[]
  raw?: any
}

export interface FabiDailyRevenueResult {
  success: boolean
  message: string
  store_id: string
  date: string
  total_revenue: number
  total_bills: number
  bills?: any[]
}

/**
 * Đăng nhập vào FABi iPOS Web CMS bằng Email/SĐT + Mật khẩu
 */
export async function loginFabi(username: string, password: string): Promise<FabiLoginResult> {
  const cleanUsername = username.trim()
  const cleanPassword = password.trim()

  if (!cleanUsername || !cleanPassword) {
    return {
      success: false,
      message: 'Vui lòng cung cấp tài khoản và mật khẩu đăng nhập iPOS FABi.',
    }
  }

  const loginUrl = `${IPOS_POSAPI_BASE}/api/accounts/v1/user/login?access_token=${IPOS_FABI_WEB_APP_TOKEN}&fabi_type=${IPOS_FABI_TYPE}`

  try {
    const payload = {
      username: cleanUsername,
      email: cleanUsername,
      password: cleanPassword,
      fabi_type: IPOS_FABI_TYPE,
      access_token: IPOS_FABI_WEB_APP_TOKEN,
    }

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Origin': 'https://fabi.ipos.vn',
        'Referer': 'https://fabi.ipos.vn/',
        'access-token': IPOS_FABI_WEB_APP_TOKEN,
        'fabi-type': IPOS_FABI_TYPE,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok || !data) {
      const errMsg = data?.message || data?.error_description || `Máy chủ iPOS từ chối (Mã HTTP ${response.status})`
      return {
        success: false,
        message: `Đăng nhập FABi thất bại: ${errMsg}`,
      }
    }

    // Kiểm tra cấu trúc phản hồi thành công từ posapi.ipos.vn
    // Dữ liệu thường nằm ở data hoặc data.token / data.data
    const token = data.token || data.data?.token || data.access_token || data.data?.access_token
    if (!token) {
      return {
        success: false,
        message: data.message || 'Không tìm thấy vé ủy quyền JWT trong phản hồi từ iPOS.',
        raw: data,
      }
    }

    // Bóc tách thông tin công ty, thương hiệu và danh sách cửa hàng
    const userData = data.data || data
    const companyUid = userData.company_uid || userData.user?.company_uid || userData.companies?.[0]?.company_uid || ''
    const companyName = userData.company_name || userData.companies?.[0]?.company_name || 'Homies Milk Tea Chain'
    const brandUid = userData.brand_uid || userData.brands?.[0]?.brand_uid || ''
    const brandName = userData.brand_name || userData.brands?.[0]?.brand_name || 'Homies Boba House'

    // Danh sách stores chi nhánh
    let rawStores = userData.stores || userData.brands?.[0]?.stores || []
    if (!Array.isArray(rawStores) && typeof rawStores === 'object') {
      rawStores = Object.values(rawStores)
    }

    const stores: FabiStoreInfo[] = rawStores.map((s: any) => ({
      id: String(s.id || s.store_id || s.uid || ''),
      name: String(s.name || s.store_name || 'Cửa hàng'),
      address: s.address || s.store_address || '',
      code: s.code || s.store_code || '',
      phone: s.phone || s.store_phone || '',
    }))

    // Token JWT của FABi CMS có hạn thông thường 7 ngày
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    return {
      success: true,
      message: `Đăng nhập iPOS FABi thành công! Đã kết nối thương hiệu "${brandName}" với ${stores.length} chi nhánh.`,
      token,
      expires_at: expiresAt,
      company_uid: companyUid,
      company_name: companyName,
      brand_uid: brandUid,
      brand_name: brandName,
      stores,
      raw: data,
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Lỗi kết nối tới máy chủ iPOS FABi: ${error.message || 'Không có phản hồi từ posapi.ipos.vn'}`,
    }
  }
}

/**
 * Lấy báo cáo doanh thu theo ngày từ iPOS FABi (sale-by-date)
 */
export async function getFabiDailyRevenue(
  token: string,
  storeId: string,
  dateString?: string // Format YYYY-MM-DD
): Promise<FabiDailyRevenueResult> {
  const targetDate = dateString || new Date().toISOString().slice(0, 10)
  const url = `${IPOS_POSAPI_BASE}/api/reports_v1/v3/pos-cms/report/sale-by-date?store_id=${encodeURIComponent(
    storeId
  )}&date=${encodeURIComponent(targetDate)}&access_token=${IPOS_FABI_WEB_APP_TOKEN}&fabi_type=${IPOS_FABI_TYPE}`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'access-token': IPOS_FABI_WEB_APP_TOKEN,
        'fabi-type': IPOS_FABI_TYPE,
      },
      signal: AbortSignal.timeout(10000),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok || !json) {
      return {
        success: false,
        message: json?.message || 'Không thể lấy dữ liệu doanh thu từ iPOS',
        store_id: storeId,
        date: targetDate,
        total_revenue: 0,
        total_bills: 0,
      }
    }

    const bills = json.data?.bills || json.bills || json.data || []
    const totalRev = Number(json.data?.total_amount || json.total_amount || 0)
    const count = Array.isArray(bills) ? bills.length : 0

    return {
      success: true,
      message: `Lấy thành công doanh thu ngày ${targetDate}: ${totalRev.toLocaleString('vi-VN')} đ (${count} đơn)`,
      store_id: storeId,
      date: targetDate,
      total_revenue: totalRev,
      total_bills: count,
      bills: Array.isArray(bills) ? bills : [],
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi kết nối API doanh thu: ${err.message}`,
      store_id: storeId,
      date: targetDate,
      total_revenue: 0,
      total_bills: 0,
    }
  }
}
