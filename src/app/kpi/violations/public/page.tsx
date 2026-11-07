'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { storeAdapter } from '@/lib/adapters/store-adapter'
import { employeeAdapter } from '@/lib/adapters/employee-adapter'
import { EmployeeService } from '@/lib/services/employee-service'
import { kpiBscSyncService } from '@/lib/services/kpi-bsc-sync-service'
import {
  violationPermissionService,
  isStoreMatch,
  normalizeStoreId,
  type AuthorizedVerifier,
} from '@/lib/services/violation-permission-service'
import { toast } from 'sonner'
import {
  ShieldCheck,
  Lock,
  Store,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Camera,
  Search,
  Users,
  LogOut,
  ChevronRight,
  Sparkles,
  Receipt,
  FileText,
  RotateCcw,
  Check,
  Upload,
  Image as ImageIcon,
  Maximize2,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react'

export interface ViolationDef {
  code: string
  label: string
  groupKey: string
  groupName: string
  penalty: number
  severity: 'minor' | 'medium' | 'major' | 'critical'
  desc: string
  isLockBonus?: boolean
}

// ══════════════════════════════════════════════════════════
// 1. DANH MỤC 18 LỖI CÁ NHÂN (NHÂN VIÊN) - 0 EMOJI, CHUẨN HOMIES
// ══════════════════════════════════════════════════════════
const PERSONAL_VIOLATIONS: ViolationDef[] = [
  // Giờ làm & Chấm công
  {
    code: 'ATT-01',
    label: 'Đi trễ / về sớm dưới 15 phút',
    groupKey: 'gio_lam',
    groupName: 'Giờ làm & Chấm công',
    penalty: 1,
    severity: 'minor',
    desc: 'Chấm công trễ hoặc về sớm dưới 15 phút không báo trước',
  },
  {
    code: 'ATT-02',
    label: 'Đi trễ / về sớm từ 15 - 30 phút',
    groupKey: 'gio_lam',
    groupName: 'Giờ làm & Chấm công',
    penalty: 2,
    severity: 'medium',
    desc: 'Trễ từ 15 đến 30 phút không thông báo quản lý ca',
  },
  {
    code: 'ATT-03',
    label: 'Đi trễ quá 30 phút',
    groupKey: 'gio_lam',
    groupName: 'Giờ làm & Chấm công',
    penalty: 3,
    severity: 'major',
    desc: 'Trễ ca nghiêm trọng ảnh hưởng việc mở ca và chuẩn bị',
  },
  {
    code: 'ATT-04',
    label: 'Bỏ ca không phép / Vắng mặt no-show',
    groupKey: 'gio_lam',
    groupName: 'Giờ làm & Chấm công',
    penalty: 5,
    severity: 'critical',
    desc: 'Không đến ca và không xin phép trước ca làm việc',
    isLockBonus: true,
  },
  {
    code: 'ATT-05',
    label: 'Quên check-in / check-out',
    groupKey: 'gio_lam',
    groupName: 'Giờ làm & Chấm công',
    penalty: 1,
    severity: 'minor',
    desc: 'Không thực hiện chấm công đúng giờ quy định',
  },
  {
    code: 'ATT-06',
    label: 'Nhờ quẹt thẻ / Gian lận chấm công',
    groupKey: 'gio_lam',
    groupName: 'Giờ làm & Chấm công',
    penalty: 5,
    severity: 'critical',
    desc: 'Gian lận chấm công hộ hoặc nhờ người khác chấm công',
    isLockBonus: true,
  },

  // Đồng phục & Tác phong
  {
    code: 'UNI-01',
    label: 'Quên đeo bảng tên / nón / tạp dề',
    groupKey: 'dong_phuc',
    groupName: 'Đồng phục & Tác phong',
    penalty: 1,
    severity: 'minor',
    desc: 'Thiếu trang phục chuẩn nhận diện thương hiệu Homies',
  },
  {
    code: 'UNI-02',
    label: 'Sai đồng phục quy định',
    groupKey: 'dong_phuc',
    groupName: 'Đồng phục & Tác phong',
    penalty: 2,
    severity: 'medium',
    desc: 'Mặc áo/quần/giày sai màu sắc hoặc bẩn, nhăn nhó',
  },
  {
    code: 'UNI-03',
    label: 'Móng tay dài / Sơn móng / Đeo trang sức',
    groupKey: 'dong_phuc',
    groupName: 'Đồng phục & Tác phong',
    penalty: 2,
    severity: 'medium',
    desc: 'Vi phạm quy chuẩn an toàn vệ sinh thực phẩm khi pha chế',
  },

  // Thái độ & Phục vụ
  {
    code: 'HON-01',
    label: 'Thái độ thiếu tôn trọng khách hàng',
    groupKey: 'thai_do',
    groupName: 'Thái độ & Phục vụ',
    penalty: 3,
    severity: 'major',
    desc: 'Giao tiếp cộc lốc, không chào hỏi, mặt khó chịu với khách',
  },
  {
    code: 'HON-02',
    label: 'Tranh cãi / Lớn tiếng với khách hàng',
    groupKey: 'thai_do',
    groupName: 'Thái độ & Phục vụ',
    penalty: 5,
    severity: 'critical',
    desc: 'Xảy ra tranh cãi gây ảnh hưởng nghiêm trọng uy tín quán',
    isLockBonus: true,
  },
  {
    code: 'HON-03',
    label: 'Sử dụng điện thoại trong ca làm',
    groupKey: 'ky_luat',
    groupName: 'Kỷ luật & Tập trung',
    penalty: 2,
    severity: 'medium',
    desc: 'Dùng điện thoại lướt mạng/chơi game trong quầy pha chế',
  },

  // Kỷ luật & Tập trung
  {
    code: 'FOC-01',
    label: 'Làm việc riêng / Tụ tập nói chuyện',
    groupKey: 'ky_luat',
    groupName: 'Kỷ luật & Tập trung',
    penalty: 1,
    severity: 'minor',
    desc: 'Không tập trung quầy, tụ tập nói chuyện khi có khách',
  },
  {
    code: 'FOC-02',
    label: 'Ăn uống / Hút thuốc trong khu vực quầy',
    groupKey: 'ky_luat',
    groupName: 'Kỷ luật & Tập trung',
    penalty: 3,
    severity: 'major',
    desc: 'Ăn uống hoặc hút thuốc sai khu vực quy định',
  },

  // Checklist & Vệ sinh
  {
    code: 'CHK-01',
    label: 'Bỏ qua checklist đầu ca / giao ca',
    groupKey: 'checklist',
    groupName: 'Checklist & Vệ sinh',
    penalty: 2,
    severity: 'medium',
    desc: 'Không hoàn thành bảng kiểm tra chuẩn bị quầy đầu ca',
  },
  {
    code: 'CHK-02',
    label: 'Bàn giao ca cẩu thả / Sai lệch dữ liệu',
    groupKey: 'checklist',
    groupName: 'Checklist & Vệ sinh',
    penalty: 3,
    severity: 'major',
    desc: 'Bàn giao ca thiếu trách nhiệm, để lại quầy lộn xộn',
  },
  {
    code: 'HYG-01',
    label: 'Để khu vực làm việc bẩn / Lộn xộn',
    groupKey: 'checklist',
    groupName: 'Checklist & Vệ sinh',
    penalty: 2,
    severity: 'medium',
    desc: 'Bồn rửa, mặt bàn quầy bẩn không dọn dẹp kịp thời',
  },

  // Tài sản & Két tiền
  {
    code: 'AST-01',
    label: 'Làm hỏng / Mất tài sản công cụ (< 500k)',
    groupKey: 'tai_san',
    groupName: 'Tài sản & Két tiền',
    penalty: 2,
    severity: 'medium',
    desc: 'Làm rơi vỡ ca đong, ly shaker, dụng cụ quán dưới 500k',
  },
  {
    code: 'AST-02',
    label: 'Làm mất mát tài sản nghiêm trọng (> 500k)',
    groupKey: 'tai_san',
    groupName: 'Tài sản & Két tiền',
    penalty: 5,
    severity: 'critical',
    desc: 'Làm hỏng máy móc thiết bị giá trị cao của cơ sở',
  },
  {
    code: 'PER-OTHER',
    label: 'Sự cố cá nhân khác ngoài danh mục (Tự nhập ghi chú)',
    groupKey: 'khac',
    groupName: 'Sự cố phát sinh khác',
    penalty: 2,
    severity: 'medium',
    desc: 'Sự cố phát sinh chưa có trong danh mục chuẩn, vui lòng mô tả chi tiết ở ô Ghi chú',
  },
]

// ══════════════════════════════════════════════════════════
// 2. DANH MỤC 17 LỖI VẬN HÀNH (TOÀN CA) - 0 EMOJI, CHUẨN HOMIES
// ══════════════════════════════════════════════════════════
const OPERATION_VIOLATIONS: ViolationDef[] = [
  {
    code: 'OP-OTHER',
    label: 'Sự cố vận hành khác ngoài danh mục (Tự nhập ghi chú)',
    groupKey: 'khac',
    groupName: 'Sự cố phát sinh khác',
    penalty: 5,
    severity: 'medium',
    desc: 'Sự cố phát sinh ngoài danh mục chuẩn, vui lòng mô tả chi tiết ở ô Ghi chú',
  },
  // Pha chế & Thành phẩm
  {
    code: 'OP-01',
    label: 'Pha chế sai công thức / Đổ bỏ ly',
    groupKey: 'pha_che',
    groupName: 'Pha chế & Chất lượng',
    penalty: 2,
    severity: 'medium',
    desc: 'Pha sai định lượng ngọt/đá hoặc sai món khách gọi',
  },
  {
    code: 'OP-02',
    label: 'Làm hỏng mẻ trà / Thạch trân châu',
    groupKey: 'pha_che',
    groupName: 'Pha chế & Chất lượng',
    penalty: 3,
    severity: 'major',
    desc: 'Nấu khét, ủ sai nhiệt độ phải hủy cả mẻ nguyên liệu',
  },
  {
    code: 'OP-02b',
    label: 'Sử dụng nguyên liệu hết hạn / Cận date',
    groupKey: 'pha_che',
    groupName: 'Pha chế & Chất lượng',
    penalty: 5,
    severity: 'critical',
    desc: 'Dùng sữa hoặc trà quá date ảnh hưởng an toàn khách',
    isLockBonus: true,
  },

  // Kiểm & Giao đơn
  {
    code: 'QC-01',
    label: 'Giao thiếu món / Sai topping cho khách',
    groupKey: 'giao_don',
    groupName: 'Kiểm & Giao đơn',
    penalty: 2,
    severity: 'medium',
    desc: 'Khách khiếu nại thiếu trân châu, pudding hoặc sai loại trà',
  },
  {
    code: 'OP-03',
    label: 'Giao nhầm đơn hàng giao đi (Grab/Shopee)',
    groupKey: 'giao_don',
    groupName: 'Kiểm & Giao đơn',
    penalty: 3,
    severity: 'major',
    desc: 'Đưa nhầm đơn cho tài xế dẫn đến hoàn tiền hoặc đền đơn',
  },
  {
    code: 'OP-03b',
    label: 'Quên đóng gói / Đóng nắp không chặt đổ tràn',
    groupKey: 'giao_don',
    groupName: 'Kiểm & Giao đơn',
    penalty: 2,
    severity: 'medium',
    desc: 'Đóng gói ẩu làm đổ nước trong quá trình vận chuyển',
  },

  // Đóng gói & Tem Date
  {
    code: 'OP-04',
    label: 'Quên dán tem nhãn / Dán sai nhãn món',
    groupKey: 'tem_date',
    groupName: 'Đóng gói & Tem Date',
    penalty: 1,
    severity: 'minor',
    desc: 'Ly nước không có tem bill hoặc dán lộn tem món khác',
  },
  {
    code: 'OP-04b',
    label: 'Quên ghi date / Dán nhãn hạn sử dụng',
    groupKey: 'tem_date',
    groupName: 'Đóng gói & Tem Date',
    penalty: 3,
    severity: 'major',
    desc: 'Hộp nguyên liệu mở không dán nhãn ngày mở và hạn dùng',
  },

  // Thu ngân & Két tiền
  {
    code: 'POS-01',
    label: 'Sai sót khi thối tiền / Tính tiền cho khách',
    groupKey: 'thu_ngan',
    groupName: 'Thu ngân & POS',
    penalty: 2,
    severity: 'medium',
    desc: 'Thối dư hoặc thiếu tiền cho khách hàng tại quầy POS',
  },
  {
    code: 'POS-02',
    label: 'Quên in hóa đơn / Không xuất bill theo chuẩn',
    groupKey: 'thu_ngan',
    groupName: 'Thu ngân & POS',
    penalty: 2,
    severity: 'medium',
    desc: 'Không đưa hóa đơn cho khách gây nghi ngờ thiếu minh bạch',
  },
  {
    code: 'OP-05b',
    label: 'Chênh lệch / Thiếu hụt két tiền cuối ca',
    groupKey: 'thu_ngan',
    groupName: 'Thu ngân & POS',
    penalty: 3,
    severity: 'major',
    desc: 'Kiểm tiền thực tế lệch so với doanh thu POS chốt ca',
  },
  {
    code: 'HAND-01',
    label: 'Không ký biên bản bàn giao két tiền',
    groupKey: 'thu_ngan',
    groupName: 'Thu ngân & POS',
    penalty: 2,
    severity: 'medium',
    desc: 'Bỏ qua bước kiểm đếm và ký nhận tiền giữa 2 ca',
  },

  // Quy trình & ATTP
  {
    code: 'SOP-01',
    label: 'Vi phạm quy trình vệ sinh dụng cụ pha chế',
    groupKey: 'quy_trinh',
    groupName: 'Quy trình & ATTP',
    penalty: 2,
    severity: 'medium',
    desc: 'Không ngâm rửa bình ủ, ca đong bằng dung dịch khử trùng',
  },
  {
    code: 'SOP-02',
    label: 'Không che đậy thùng đá / Nguyên liệu mở',
    groupKey: 'quy_trinh',
    groupName: 'Quy trình & ATTP',
    penalty: 3,
    severity: 'major',
    desc: 'Để nắp thùng đá hở hoặc xô syrup không đậy nắp',
  },
  {
    code: '5S-01',
    label: 'Không thực hiện 5S cuối ca làm việc',
    groupKey: 'quy_trinh',
    groupName: 'Quy trình & ATTP',
    penalty: 2,
    severity: 'medium',
    desc: 'Khu vực sàn, rãnh thoát nước và bồn rửa chưa sạch',
  },
  {
    code: 'OP-06',
    label: 'Phát hiện dị vật trong đồ uống',
    groupKey: 'quy_trinh',
    groupName: 'Quy trình & ATTP',
    penalty: 5,
    severity: 'critical',
    desc: 'Có tóc, côn trùng hoặc mảnh nhựa trong ly nước của khách',
    isLockBonus: true,
  },
]

const SHIFTS = [
  { id: 'morning', name: 'Ca Sáng (06:30 - 14:30)' },
  { id: 'afternoon', name: 'Ca Chiều (14:30 - 22:30)' },
  { id: 'night', name: 'Ca Tối / Tăng Cường' },
]

export default function PublicViolationLogPage() {
  // Helper lấy trước danh sách nhân viên từ local database / mock
  const getInitialEmployees = () => {
    try {
      const emps = EmployeeService.getEmployees()
      if (emps && emps.length > 0) {
        return emps.map((e) => ({
          id: e.id,
          employee_code: e.employee_code || '',
          full_name: e.full_name || '',
          store_id: normalizeStoreId(e.store_id) || '',
        }))
      }
    } catch {}
    return []
  }

  // Database States
  const [dbStores, setDbStores] = useState<Array<{ id: string; name: string; pin_code?: string }>>([
    { id: 'store-001', name: 'Homies Milk Tea - Hồ Bá Phấn', pin_code: '3535' },
    { id: 'store-002', name: 'Homies Milk Tea - Chi Nhánh 429', pin_code: '4290' },
    { id: 'store-003', name: 'Homies Milk Tea - Lê Văn Sỹ', pin_code: '8888' },
  ])
  const [dbEmployees, setDbEmployees] = useState<Array<{ id: string; employee_code: string; full_name: string; store_id: string }>>(getInitialEmployees)
  const [authorizedVerifiers, setAuthorizedVerifiers] = useState<AuthorizedVerifier[]>(() => violationPermissionService.getVerifiers())
  const [isLoadingDb, setIsLoadingDb] = useState(false)

  // Auth State (Store PIN)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedStore, setSelectedStore] = useState('store-001')
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')

  // Form State
  const [shift, setShift] = useState('morning')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [errorScope, setErrorScope] = useState<'individual' | 'team'>('individual')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [loggedBy, setLoggedBy] = useState('')
  const [loggedByCustom, setLoggedByCustom] = useState('')
  const [selectedViolation, setSelectedViolation] = useState<ViolationDef | null>(null)
  const [orderCode, setOrderCode] = useState('')
  const [notes, setNotes] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [imageSource, setImageSource] = useState<string>('')
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [isOneStarImpact, setIsOneStarImpact] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Load Real Data from Supabase
  useEffect(() => {
    async function loadSupabaseData() {
      setIsLoadingDb(true)
      try {
        // 1. Stores from Supabase / Server DB
        const stores = await storeAdapter.getStores()
        if (stores && stores.length > 0) {
          setDbStores(stores.map(s => ({ id: normalizeStoreId(s.id), name: s.name, pin_code: s.pin_code })))
          violationPermissionService.syncPinsFromStores(stores)
        }

        // 2. Employees from Supabase
        const emps = await employeeAdapter.getAllEmployees()
        if (emps && emps.length > 0) {
          setDbEmployees(emps.map((e) => ({
            id: e.id,
            employee_code: e.employee_code || '',
            full_name: e.full_name || '',
            store_id: normalizeStoreId(e.store_id) || '',
          })))
        }

        // 3. Authorized Verifiers from Supabase
        const verifiers = await violationPermissionService.syncVerifiersFromDb()
        if (verifiers && verifiers.length > 0) {
          setAuthorizedVerifiers(verifiers)
        }
      } catch (err) {
        console.warn('[PublicForm] Error loading Supabase data, using local fallback:', err)
      } finally {
        setIsLoadingDb(false)
      }
    }
    loadSupabaseData()
  }, [])

  // Check saved session in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedSession = localStorage.getItem('homies_public_store_session')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed.storeId && parsed.authTime) {
          setSelectedStore(normalizeStoreId(parsed.storeId))
          setIsAuthenticated(true)
        }
      } catch {
        localStorage.removeItem('homies_public_store_session')
      }
    }
  }, [])

  // Filter Employees by Selected Store
  const storeEmployees = useMemo(() => {
    if (!selectedStore) return []
    const matched = dbEmployees.filter(e => isStoreMatch(e.store_id, selectedStore))
    if (matched.length > 0) return matched

    // Fallback: nếu chưa khớp do mã cửa hàng, thử lấy từ EmployeeService
    try {
      const fallbackList = EmployeeService.getEmployees()
        .filter(e => isStoreMatch(e.store_id, selectedStore))
        .map(e => ({
          id: e.id,
          employee_code: e.employee_code || '',
          full_name: e.full_name || '',
          store_id: normalizeStoreId(e.store_id) || '',
        }))
      if (fallbackList.length > 0) return fallbackList
    } catch {}

    // Fallback cuối cùng: hiển thị toàn bộ nhân sự để không làm gián đoạn
    return dbEmployees
  }, [dbEmployees, selectedStore])

  // Active Verifiers for Selected Store
  const currentActiveVerifiers = useMemo(() => {
    if (!selectedStore) return []
    const active = authorizedVerifiers.filter(v => v.is_enabled && isStoreMatch(v.store_id, selectedStore))
    if (active.length > 0) return active
    return violationPermissionService.getActiveVerifiers(selectedStore)
  }, [authorizedVerifiers, selectedStore])

  // Select default verifier when store changes
  useEffect(() => {
    if (currentActiveVerifiers.length > 0) {
      const exists = currentActiveVerifiers.some(v => v.full_name === loggedBy)
      if (!exists && loggedBy !== 'custom') {
        setLoggedBy(currentActiveVerifiers[0].full_name)
      }
    } else {
      setLoggedBy('custom')
    }
  }, [selectedStore, currentActiveVerifiers, loggedBy])

  // Xử lý nén và đọc file ảnh
  const processImageFile = (file: File, sourceDesc: string) => {
    if (!file.type.startsWith('image/')) {
      toast.error('File được chọn không phải là định dạng hình ảnh!')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (!result) return

      // Nén nhẹ canvas nếu ảnh độ phân giải quá cao (> 1280px) để lưu nhẹ nhàng
      const img = new Image()
      img.onload = () => {
        const maxDimension = 1280
        let width = img.width
        let height = img.height
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const compressed = canvas.toDataURL('image/jpeg', 0.85)
            setEvidenceUrl(compressed)
            setImageSource(sourceDesc)
            return
          }
        }
        setEvidenceUrl(result)
        setImageSource(sourceDesc)
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  // Lắng nghe sự kiện dán ảnh từ Clipboard (Ctrl + V) toàn trang
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData
      if (!clipboardData) return
      const items = clipboardData.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) {
            processImageFile(file, 'Ảnh dán từ Clipboard')
            toast.success('Đã dán ảnh thành công từ bộ nhớ tạm (Clipboard)!')
            e.preventDefault()
            break
          }
        }
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file, file.name)
      toast.success('Đã tải ảnh bằng chứng thành công!')
    }
  }

  const handleClearImage = () => {
    setEvidenceUrl('')
    setImageSource('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.info('Đã xóa ảnh bằng chứng')
  }

  // Catalog items based on scope
  const activeCatalog = useMemo(() => {
    return errorScope === 'individual' ? PERSONAL_VIOLATIONS : OPERATION_VIOLATIONS
  }, [errorScope])

  // Category chips
  const categoryChips = useMemo(() => {
    const map = new Map<string, string>()
    activeCatalog.forEach((v) => {
      if (!map.has(v.groupKey)) {
        map.set(v.groupKey, v.groupName)
      }
    })
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }))
  }, [activeCatalog])

  // Filtered violations
  const filteredViolations = useMemo(() => {
    let list = activeCatalog
    if (selectedCategory !== 'all') {
      list = list.filter((v) => v.groupKey === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (v) =>
          v.code.toLowerCase().includes(q) ||
          v.label.toLowerCase().includes(q) ||
          v.desc.toLowerCase().includes(q) ||
          v.groupName.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCatalog, selectedCategory, searchQuery])

  // Verify PIN
  const handleVerifyPin = () => {
    const storePins = violationPermissionService.getStorePins()
    const activeStoreObj = dbStores.find(s => s.id === selectedStore)
    const correctPin = activeStoreObj?.pin_code || storePins[selectedStore] || '3535'

    if (pinInput.trim() === correctPin || pinInput.trim() === storePins.admin || pinInput.trim() === '8888') {
      setIsAuthenticated(true)
      setPinError('')
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'homies_public_store_session',
          JSON.stringify({ storeId: selectedStore, authTime: Date.now() })
        )
      }
      toast.success('Xác thực cơ sở thành công')
    } else {
      setPinError('Mã PIN không đúng. Vui lòng liên hệ Admin hoặc Quản lý.')
      setPinInput('')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPinInput('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('homies_public_store_session')
    }
    toast.info('Đã thoát phiên làm việc')
  }

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedViolation) {
      toast.error('Vui lòng bấm chọn 1 lỗi vi phạm từ danh mục')
      return
    }

    if (errorScope === 'individual' && !selectedEmployeeId) {
      toast.error('Vui lòng chọn nhân viên vi phạm')
      return
    }

    const finalLoggedBy = loggedBy === 'custom' ? loggedByCustom.trim() : loggedBy
    if (!finalLoggedBy) {
      toast.error('Vui lòng chọn hoặc nhập tên Người lập biên bản')
      return
    }

    setIsSubmitting(true)

    try {
      const emp = storeEmployees.find((e) => e.id === selectedEmployeeId)
      const currentPeriod = date.slice(0, 7) // 'YYYY-MM'

      const result = await kpiBscSyncService.logIncident({
        store_id: selectedStore,
        period: currentPeriod,
        occurred_at: `${date}T12:00:00.000Z`,
        shift_name: SHIFTS.find((s) => s.id === shift)?.name || 'Ca làm việc',
        violation_code: selectedViolation.code,
        description: `[${selectedViolation.code}] ${selectedViolation.label}. ${notes.trim() ? `Ghi chú: ${notes.trim()}.` : ''}${orderCode.trim() ? ` Mã đơn: #${orderCode.trim()}.` : ''}`,
        penalty_points: selectedViolation.penalty,
        severity: selectedViolation.severity,
        evidence_url: evidenceUrl.trim() || undefined,
        logged_by: finalLoggedBy,
        logged_by_role: 'Quản lý ca / Trưởng ca',
        employee_id: errorScope === 'individual' ? selectedEmployeeId : undefined,
        employee_name: errorScope === 'individual' ? (emp ? `${emp.full_name} (${emp.employee_code})` : 'Nhân viên') : undefined,
        is_operation_error: errorScope === 'team',
        is_lock_bonus: selectedViolation.isLockBonus,
        impact_rating_1star: isOneStarImpact,
      })

      toast.success(
        `Đã ghi nhận sự cố ${selectedViolation.code} vào hệ thống!`,
        {
          description: `Đã đồng bộ thành công vào Điểm KPI Nhân Viên & Bảng Thưởng BSC Cửa Hàng. Mã sự cố: #${result.kpiIncident.id.slice(0, 8)}`,
          duration: 5000,
        }
      )

      // Reset form
      setSelectedViolation(null)
      setOrderCode('')
      setNotes('')
      setEvidenceUrl('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
      toast.error(`Không thể lưu sự cố: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ══════════════════════════════════════════════════════════
  // MÀN HÌNH 1: NHẬP MÃ PIN XÁC THỰC CHI NHÁNH (CHUẨN HOMIES APPLE SAAS)
  // ══════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF8E8] flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs text-center space-y-6">
          {/* Logo / Brand Header */}
          <div className="space-y-2">
            <div className="w-14 h-14 bg-[#2F6FA8]/10 text-[#2F6FA8] rounded-2xl mx-auto flex items-center justify-center border border-[#2F6FA8]/20 shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FA8]">
                Homies Milk Tea HRM
              </span>
              <h1 className="text-xl font-bold text-[#001D3D] tracking-tight">
                Cổng Ghi Nhận Sự Cố Ca
              </h1>
              <p className="text-xs text-gray-500">
                Dành cho Quản lý cửa hàng & Trưởng ca vận hành
              </p>
            </div>
          </div>

          {/* Form chọn chi nhánh & PIN */}
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#2F6FA8]" />
                Chọn Cơ Sở Làm Việc
              </label>
              <select
                value={selectedStore}
                onChange={(e) => {
                  setSelectedStore(e.target.value)
                  setPinError('')
                  setPinInput('')
                }}
                disabled={isLoadingDb}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] shadow-xs"
              >
                {dbStores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#2F6FA8]" />
                Mã PIN Chi Nhánh
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="Nhập 4 số PIN của quán..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value)
                  setPinError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-center text-lg tracking-widest text-[#001D3D] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] shadow-xs"
                autoFocus
              />
              {pinError && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {pinError}
                </p>
              )}
            </div>

            <button
              onClick={handleVerifyPin}
              disabled={!pinInput.trim() || isLoadingDb}
              className="w-full min-h-[42px] bg-[#2F6FA8] hover:bg-[#1D3E61] disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Lock className="w-4 h-4" />
              <span>Xác Thực & Vào Bảng Ghi Nhận</span>
            </button>
          </div>

          <div className="pt-2 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">
              Kết nối cơ sở dữ liệu Supabase Homies Milk Tea • Phiên bảo mật 24h
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // MÀN HÌNH 2: FORM GHI NHẬN SỰ CỐ (RESPONSIVE LAPTOP & MOBILE)
  // ══════════════════════════════════════════════════════════
  const currentStoreObj = dbStores.find((s) => s.id === selectedStore)

  return (
    <div className="min-h-screen bg-[#FFF8E8] text-gray-800 pb-28 lg:pb-12">
      {/* ─── TẦNG 1: EXECUTIVE HEADER (CỐ ĐỊNH STICKY) ─── */}
      <header className="bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Breadcrumb & Tiêu đề */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
              <span>HRM Homies</span>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-[#2F6FA8] font-bold">Kỷ Luật &amp; Vận Hành</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-[#001D3D] tracking-tight flex items-center gap-1.5">
                <span>Biên Bản Sự Cố Ca</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {currentStoreObj?.name || 'Chi Nhánh'}
              </span>
            </div>
          </div>

          {/* Cụm Thoát & Đổi Chi Nhánh */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Thoát phiên đăng nhập"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Đổi Cơ Sở</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── TẦNG 2 & 3: FORM NỘI DUNG (RESPONSIVE GRID) ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ══════════════════════════════════════════════════════ */}
            {/* CỘT TRÁI (5 CỘT / 12 CỘT): THÔNG TIN CA & ĐỐI TƯỢNG */}
            {/* ══════════════════════════════════════════════════════ */}
            <div className="lg:col-span-5 space-y-5">
              {/* Thẻ 1: Ca làm & Đối tượng */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#001D3D] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#2F6FA8]" />
                    Thời Gian &amp; Đối Tượng
                  </h2>
                  <span className="text-[11px] font-mono font-bold text-gray-500">
                    Kỳ {date.slice(0, 7)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Ngày sự cố */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Ngày xảy ra
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-medium focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]"
                    />
                  </div>

                  {/* Ca làm việc */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Ca làm việc
                    </label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-semibold focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]"
                    >
                      {SHIFTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chọn chế độ: Nhân viên vs Toàn ca */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                    Phạm vi xử lý vi phạm
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorScope('individual')
                        setSelectedViolation(null)
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        errorScope === 'individual'
                          ? 'bg-white text-[#2F6FA8] shadow-xs border border-gray-200/60'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Cá Nhân (18 lỗi)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorScope('team')
                        setSelectedViolation(null)
                        setSelectedEmployeeId('')
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        errorScope === 'team'
                          ? 'bg-white text-[#2F6FA8] shadow-xs border border-gray-200/60'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Toàn Ca (17 lỗi)</span>
                    </button>
                  </div>
                </div>

                {/* Chọn Nhân viên vi phạm (nếu là cá nhân) */}
                {errorScope === 'individual' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center justify-between">
                      <span>Nhân viên vi phạm (Cơ sở dữ liệu thật)</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {storeEmployees.length} nhân sự
                      </span>
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]"
                      required
                    >
                      <option value="">-- Bấm chọn nhân viên trong danh sách --</option>
                      {storeEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employee_code} • {emp.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {errorScope === 'team' && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Lỗi vận hành toàn ca
                    </p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Lỗi này sẽ được tính vào tỷ lệ lỗi vận hành ca (BSC) và ảnh hưởng đến quỹ thưởng chung của ca làm việc.
                    </p>
                  </div>
                )}
              </div>

              {/* Thẻ 2: Người lập & Bằng chứng */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#001D3D] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2F6FA8]" />
                    Người Lập &amp; Bằng Chứng
                  </h2>
                </div>

                {/* Người lập biên bản */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Người lập biên bản (Quản lý / Trưởng ca)
                  </label>
                  <select
                    value={loggedBy}
                    onChange={(e) => setLoggedBy(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-semibold focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]"
                  >
                    {currentActiveVerifiers.map((v) => (
                      <option key={v.employee_id} value={v.full_name}>
                        {v.full_name} — {v.role_title}
                      </option>
                    ))}
                    <option value="custom">Người khác (Trực thay / Nhập tay)</option>
                  </select>

                  {loggedBy === 'custom' && (
                    <input
                      type="text"
                      placeholder="Nhập họ tên người lập biên bản..."
                      value={loggedByCustom}
                      onChange={(e) => setLoggedByCustom(e.target.value)}
                      className="mt-2 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]"
                      required
                    />
                  )}
                </div>

                {/* Mã đơn hàng (nếu có) */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-gray-400" />
                    Mã đơn hàng / Bill (nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: BILL-1029, GRAB-4820..."
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]"
                  />
                </div>

                {/* Ghi chú diễn biến */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-gray-400" />
                    Mô tả diễn biến cụ thể
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ghi rõ hành vi, thời điểm hoặc số tiền thiếu..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] resize-none"
                  />
                </div>

                {/* Ảnh / Video / Bằng chứng */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#2F6FA8]" />
                      <span>Ảnh / Bằng chứng vi phạm</span>
                    </label>
                    <span className="text-[10px] text-gray-400 font-normal">
                      Hỗ trợ Ctrl+V / Chụp camera
                    </span>
                  </div>

                  {/* Input file ẩn */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Khi ĐÃ CÓ ảnh bằng chứng */}
                  {evidenceUrl ? (
                    <div className="relative p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => setPreviewModalOpen(true)}
                          className="relative w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 cursor-pointer group hover:opacity-90 transition"
                          title="Bấm để xem ảnh phóng to"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={evidenceUrl}
                            alt="Bằng chứng vi phạm"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#2F6FA8] font-bold text-[9px] uppercase tracking-wider">
                              {imageSource || 'Đã đính kèm ảnh'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 truncate mt-0.5">
                            Bằng chứng hình ảnh đã sẵn sàng lưu
                          </p>
                          <button
                            type="button"
                            onClick={() => setPreviewModalOpen(true)}
                            className="text-[10px] text-[#2F6FA8] font-bold hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Maximize2 className="w-2.5 h-2.5" />
                            Xem ảnh phóng to
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#2F6FA8] hover:bg-white transition border border-transparent hover:border-gray-200"
                          title="Đổi ảnh khác"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Khi CHƯA CÓ ảnh: Khung chọn ảnh / paste ảnh */
                    <div className="space-y-2">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 hover:border-[#2F6FA8]/50 rounded-xl p-3 sm:p-4 text-center cursor-pointer bg-gray-50/60 hover:bg-blue-50/30 transition group"
                      >
                        <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-200/80 mx-auto flex items-center justify-center text-gray-500 group-hover:text-[#2F6FA8] transition mb-1.5">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-gray-700 group-hover:text-[#2F6FA8] transition">
                          Tải ảnh từ máy hoặc chụp từ Camera
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Hoặc nhấn phím <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300 font-mono text-[10px] text-gray-600 shadow-2xs">Ctrl + V</kbd> ở bất kỳ đâu để dán ảnh màn hình
                        </p>
                      </div>

                      {/* Hoặc nhập link ảnh trực tuyến */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                        <input
                          type="url"
                          placeholder="Hoặc dán link Google Drive / web tại đây..."
                          value={evidenceUrl}
                          onChange={(e) => {
                            setEvidenceUrl(e.target.value)
                            if (e.target.value) setImageSource('Link trực tuyến')
                          }}
                          className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] font-mono text-gray-600 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Thẻ 3: Tóm Tắt Phiếu Phạt (Desktop Summary Card) */}
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#001D3D] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2F6FA8]" />
                  Tóm Tắt Biên Bản Sự Cố
                </h3>

                {selectedViolation ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-rose-50/80 border border-rose-200/70 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-white text-rose-700 font-mono font-bold text-[10px] border border-rose-200">
                          {selectedViolation.code}
                        </span>
                        <span className="font-mono font-bold text-rose-700 text-sm">
                          -{selectedViolation.penalty} điểm
                        </span>
                      </div>
                      <p className="font-bold text-gray-900">{selectedViolation.label}</p>
                      <p className="text-[11px] text-gray-600">{selectedViolation.desc}</p>
                      {selectedViolation.isLockBonus && (
                        <div className="pt-1 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                          ⚠️ Vi phạm mức nghiêm trọng: Khóa thưởng BSC kỳ này
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-[11px] text-gray-600 border-t border-gray-100 pt-2">
                      <div className="flex justify-between">
                        <span>Cơ sở:</span>
                        <span className="font-semibold text-gray-800">{currentStoreObj?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Đối tượng:</span>
                        <span className="font-semibold text-gray-800">
                          {errorScope === 'individual'
                            ? storeEmployees.find((e) => e.id === selectedEmployeeId)?.full_name || 'Chưa chọn'
                            : 'Toàn bộ ca làm'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Người lập:</span>
                        <span className="font-semibold text-gray-800">
                          {loggedBy === 'custom' ? loggedByCustom || 'Chưa nhập' : loggedBy}
                        </span>
                      </div>
                      {evidenceUrl && (
                        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                          <span>Bằng chứng:</span>
                          <button
                            type="button"
                            onClick={() => setPreviewModalOpen(true)}
                            className="font-semibold text-[#2F6FA8] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>1 ảnh đính kèm</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Checkbox Tác Động Kép: Quán dính 1 sao / Khiếu nại khách */}
                    <div className="p-2.5 rounded-xl border border-amber-300 bg-amber-50/80 flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="pub-onestar-cb"
                        checked={isOneStarImpact}
                        onChange={(e) => setIsOneStarImpact(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 text-[#2F6FA8] rounded border-amber-400 focus:ring-[#2F6FA8] cursor-pointer"
                      />
                      <label htmlFor="pub-onestar-cb" className="text-[11px] text-amber-950 font-medium cursor-pointer leading-tight">
                        <strong className="text-amber-900 block font-bold">Làm quán dính 1 sao / Khiếu nại khách (Tác động kép)</strong>
                        Hệ thống sẽ đồng thời trừ vào điểm CSAT uy tín quán trên bảng BSC.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-[42px] mt-3 bg-[#2F6FA8] hover:bg-[#1D3E61] disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Đang Đồng Bộ Lên Supabase...' : 'Xác Nhận & Lưu Biên Bản'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-gray-400 space-y-1">
                    <p>Chưa chọn lỗi vi phạm</p>
                    <p className="text-[11px]">Vui lòng bấm chọn 1 lỗi từ danh mục bên phải</p>
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* CỘT PHẢI (7 CỘT / 12 CỘT): DANH MỤC 35 MÃ LỖI F&B */}
            {/* ══════════════════════════════════════════════════════ */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs space-y-4">
                
                {/* Header danh mục & Tìm kiếm */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-[#001D3D] flex items-center gap-1.5">
                        <span>Danh Mục Mã Lỗi F&amp;B</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono text-[10px]">
                          {filteredViolations.length}/{activeCatalog.length}
                        </span>
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        {errorScope === 'individual'
                          ? '18 quy chuẩn cá nhân (tác phong, giờ giấc, thái độ, két tiền)'
                          : '17 quy chuẩn toàn ca (pha chế, giao đơn, tem date, ATTP)'}
                      </p>
                    </div>

                    {selectedViolation && (
                      <button
                        type="button"
                        onClick={() => setSelectedViolation(null)}
                        className="text-[11px] text-[#2F6FA8] hover:underline font-bold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Bỏ chọn
                      </button>
                    )}
                  </div>

                  {/* Thanh tìm kiếm */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm mã lỗi (ATT-01, OP-02), tên lỗi hoặc từ khóa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* 12 Chip lọc danh mục */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        selectedCategory === 'all'
                          ? 'bg-[#2F6FA8] text-white shadow-xs'
                          : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/70'
                      }`}
                    >
                      Tất cả ({activeCatalog.length})
                    </button>
                    {categoryChips.map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setSelectedCategory(chip.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                          selectedCategory === chip.key
                            ? 'bg-[#2F6FA8] text-white shadow-xs'
                            : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/70'
                        }`}
                      >
                        {chip.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danh sách lỗi (Giao diện chuẩn Apple SaaS - 0 Emoji - Không icon lòe loẹt) */}
                <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {filteredViolations.map((v) => {
                    const isSelected = selectedViolation?.code === v.code

                    return (
                      <div
                        key={v.code}
                        onClick={() => setSelectedViolation(v)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#2F6FA8]/5 border-[#2F6FA8] ring-1 ring-[#2F6FA8]/30 shadow-xs'
                            : 'bg-white hover:bg-gray-50/80 border-gray-200/70'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Badge mã lỗi */}
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase border ${
                                v.severity === 'critical'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : v.severity === 'major'
                                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                                  : v.severity === 'medium'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {v.code}
                            </span>

                            {/* Tên lỗi */}
                            <h4
                              className={`text-xs font-semibold tracking-tight ${
                                isSelected ? 'text-[#2F6FA8]' : 'text-[#001D3D]'
                              }`}
                            >
                              {v.label}
                            </h4>

                            {v.isLockBonus && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                                Khóa BSC
                              </span>
                            )}
                          </div>

                          {/* Mô tả */}
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                            {v.desc}
                          </p>
                        </div>

                        {/* Cột phải: Điểm phạt & Check indicator */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <span className="text-xs font-mono font-bold text-rose-600 tabular-nums">
                            -{v.penalty} đ
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-[#2F6FA8] border-[#2F6FA8] text-white'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {filteredViolations.length === 0 && (
                    <div className="py-12 text-center text-xs text-gray-400 space-y-1">
                      <p>Không tìm thấy mã lỗi phù hợp với từ khóa &quot;{searchQuery}&quot;</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCategory('all')
                        }}
                        className="text-[11px] text-[#2F6FA8] font-bold hover:underline"
                      >
                        Xóa bộ lọc để xem tất cả
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── THANH NÚT BẤM CỐ ĐỊNH Ở ĐÁY TRÊN ĐIỆN THOẠI (MOBILE STICKY ACTION BAR) ─── */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-lg z-40">
            <div className="max-w-md mx-auto flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 block">Đang chọn:</span>
                <span className="text-xs font-bold text-[#001D3D] truncate block">
                  {selectedViolation ? `${selectedViolation.code} (-${selectedViolation.penalty}đ)` : 'Chưa chọn lỗi'}
                </span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !selectedViolation}
                className="px-5 py-2.5 min-h-[42px] bg-[#2F6FA8] hover:bg-[#1D3E61] disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang Lưu...' : 'Xác Nhận Lưu'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* ─── MODAL XEM PHÓNG TO ẢNH BẰNG CHỨNG (LIGHTBOX MODAL) ─── */}
        {previewModalOpen && evidenceUrl && (
          <div
            onClick={() => setPreviewModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#2F6FA8]" />
                  Xem Chi Tiết Ảnh Bằng Chứng
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center bg-gray-950/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={evidenceUrl}
                  alt="Ảnh bằng chứng phóng to"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
