/**
 * iPOS HRM Client Service (Direct Cloud Worker Authentication)
 * ------------------------------------------------------------
 * Cho phép Homies HRM kết nối và đăng nhập trực tiếp vào hệ thống hrm.ipos.vn
 * từ phía máy chủ (Server-side Cloud Worker) mà KHÔNG cần cài Chrome Extension.
 *
 * Chức năng:
 * 1. loginHrm(email, password): Đăng nhập máy chủ iPOS HRM, lấy Bearer JWT / Cookie session
 * 2. getHrmEmployees(token): Lấy danh sách nhân sự thực tế
 * 3. getHrmAttendance(token, dateRange): Lấy dữ liệu chấm công từ máy vân tay
 * 4. getHrmPayroll(token, period): Lấy bảng tính lương chu kỳ
 */

export const IPOS_HRM_BASE_URL = 'https://hrm.ipos.vn'

export interface HrmLoginResult {
  success: boolean
  message: string
  token?: string
  refresh_token?: string
  expires_at?: string
  user?: {
    id?: string
    name?: string
    email?: string
    phone?: string
    avatar?: string
    role?: string
  }
  company?: {
    id?: string
    name?: string
    code?: string
  }
  raw?: any
}

export interface HrmEmployeeRecord {
  id?: string
  code: string
  fullName: string
  phone?: string
  email?: string
  position?: string
  department?: string
  storeCode?: string
  bankName?: string
  bankAccountNo?: string
  status?: string
}

export interface HrmAttendanceRecord {
  employeeCode: string
  employeeName: string
  date: string
  checkInTime: string
  checkOutTime: string
  totalHours: number
  isLate: boolean
  lateMinutes: number
  shiftName?: string
  terminalId?: string
  missingCheckout?: boolean
}

export interface HrmPayrollRecord {
  employeeCode: string
  employeeName: string
  position: string
  regularHours: number
  hourlyRate: number
  netSalary: number
  bonus?: number
  deductions?: number
  allowanceResponsibility?: number
  bankName?: string
  bankAccountNo?: string
}

/**
 * Đăng nhập trực tiếp vào máy chủ hrm.ipos.vn bằng Email và Mật khẩu quản trị
 * Sử dụng đúng API v2 thật của iPOS HRM (Form URL-Encoded)
 */
export async function loginHrm(emailInput: string, passwordInput: string, baseUrlInput: string = IPOS_HRM_BASE_URL): Promise<HrmLoginResult> {
  const email = emailInput.trim()
  const password = passwordInput.trim()
  const baseUrl = baseUrlInput ? baseUrlInput.trim().replace(/\/+$/, '') : IPOS_HRM_BASE_URL

  if (!email || !password) {
    return {
      success: false,
      message: 'Vui lòng nhập đầy đủ Email và Mật khẩu đăng nhập hrm.ipos.vn',
    }
  }

  try {
    const deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().toUpperCase()
      : 'HOMIES-HRM-NODE-CLIENT-2026'

    const bodyParams = new URLSearchParams()
    bodyParams.append('username', email)
    bodyParams.append('password', password)
    bodyParams.append('web_app_name', 'HRM_WEB')
    bodyParams.append('web_app_version', '1.0.0')
    bodyParams.append('os_name', 'Windows')
    bodyParams.append('os_version', '10')
    bodyParams.append('device_name', 'Chrome')
    bodyParams.append('device_model', '128.0.0.0')
    bodyParams.append('device_id', deviceId)
    bodyParams.append('device_push_id', '')

    const res = await fetch(`${baseUrl}/api/v2/account/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Origin': baseUrl,
        'Referer': `${baseUrl}/account/login`,
        'client-os': 'WEB',
        'Accept-Language': 'vi',
      },
      body: bodyParams.toString(),
      signal: AbortSignal.timeout(12000),
    })

    const json = await res.json().catch(() => null)

    if (!json) {
      return {
        success: false,
        message: `❌ Máy chủ iPOS phản hồi không hợp lệ (Mã HTTP: ${res.status})`,
      }
    }

    // 1. Kiểm tra lỗi nghiệp vụ từ iPOS (ví dụ: "Email không tồn tại" hoặc "Mật khẩu không chính xác")
    if (json.error && json.error.message) {
      return {
        success: false,
        message: `❌ iPOS HRM báo lỗi: ${json.error.message}`,
        raw: json,
      }
    }

    // 2. Kiểm tra nếu có dữ liệu xác thực thành công (Token)
    const token =
      json.access_token ||
      json.token ||
      json.accessToken ||
      json.data?.access_token ||
      json.data?.accessToken ||
      json.data?.token

    if (token) {
      const accountInfo = json.account_info || json.data?.account_info || json.user || json.data?.user || {}
      const employeeInfo = json.employee_info || json.data?.employee_info || {}
      const companyInfo = json.company_info || json.data?.company_info || json.company || json.data?.company || {}
      const roleData = employeeInfo.role_data || {}

      const fullName =
        accountInfo.first_name && accountInfo.last_name
          ? `${accountInfo.first_name} ${accountInfo.last_name}`.trim()
          : accountInfo.fullName || accountInfo.name || email.split('@')[0]

      const brandName = companyInfo.name || 'Trà Sữa Phô Mai Tươi Đài Loan Homies'
      const brandCode = companyInfo.master_company_id || companyInfo.code || 'HOMIES'

      return {
        success: true,
        message: `🟢 Đăng nhập máy chủ iPOS HRM thành công! Chào mừng ${fullName} (${roleData.name || 'Quản lý'}).`,
        token,
        refresh_token: json.refresh_token || json.data?.refresh_token || json.refreshToken || json.data?.refreshToken,
        expires_at: json.expires_in
          ? new Date(Date.now() + json.expires_in * 1000).toISOString()
          : json.data?.expiresIn
          ? new Date(Date.now() + json.data.expiresIn * 1000).toISOString()
          : undefined,
        user: {
          id: accountInfo.id || accountInfo.tinode_uid || accountInfo._id,
          name: fullName,
          email: accountInfo.email || email,
          phone: accountInfo.phone || accountInfo.other_phone,
          role: roleData.name || roleData.code || 'Chủ thương hiệu',
        },
        company: {
          id: companyInfo.id || companyInfo._id,
          name: brandName,
          code: brandCode,
        },
        raw: json,
      }
    }

    // 3. Trường hợp không có token và không có error rõ ràng
    return {
      success: false,
      message: `❌ Đăng nhập thất bại: Máy chủ iPOS không cấp quyền truy cập cho tài khoản này.`,
      raw: json,
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return {
        success: false,
        message: '❌ Máy chủ iPOS HRM phản hồi quá lâu (quá 12 giây). Vui lòng thử lại sau.',
      }
    }
    return {
      success: false,
      message: `❌ Lỗi kết nối tới máy chủ iPOS: ${err.message || 'Không thể liên lạc'}`,
    }
  }
}

/**
 * Lấy danh sách nhân viên từ iPOS HRM
 */
export async function getHrmEmployees(token: string): Promise<{ success: boolean; data: HrmEmployeeRecord[]; message: string }> {
  if (!token) {
    return { success: false, data: [], message: 'Chưa có mã xác thực (Token) iPOS HRM' }
  }

  try {
    const res = await fetch(`${IPOS_HRM_BASE_URL}/api/v1/employees?limit=500`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      throw new Error(`Mã lỗi máy chủ: ${res.status}`)
    }

    const json = await res.json()
    const list = Array.isArray(json) ? json : json.data || json.items || []

    return {
      success: true,
      data: list,
      message: `Đã lấy ${list.length} nhân sự từ iPOS HRM`,
    }
  } catch (err: any) {
    return {
      success: false,
      data: [],
      message: `Không thể tải nhân sự: ${err.message}`,
    }
  }
}

/**
 * Lấy lịch sử chấm công / quẹt vân tay từ iPOS HRM
 */
export async function getHrmAttendance(
  token: string,
  fromDate?: string,
  toDate?: string
): Promise<{ success: boolean; data: HrmAttendanceRecord[]; message: string }> {
  if (!token) {
    return { success: false, data: [], message: 'Chưa có mã xác thực (Token) iPOS HRM' }
  }

  const query = new URLSearchParams()
  if (fromDate) query.set('from_date', fromDate)
  if (toDate) query.set('to_date', toDate)

  try {
    const res = await fetch(`${IPOS_HRM_BASE_URL}/api/v1/attendance?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      throw new Error(`Mã lỗi máy chủ: ${res.status}`)
    }

    const json = await res.json()
    const list = Array.isArray(json) ? json : json.data || json.items || []

    return {
      success: true,
      data: list,
      message: `Đã lấy ${list.length} bản ghi chấm công từ iPOS HRM`,
    }
  } catch (err: any) {
    return {
      success: false,
      data: [],
      message: `Không thể tải chấm công: ${err.message}`,
    }
  }
}
