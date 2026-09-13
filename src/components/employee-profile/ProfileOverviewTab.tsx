import React, { useRef } from 'react'
import type { AuthUser } from '@/store/auth-store'
import type { EmployeeContract } from '@/lib/services/contract-service'
import type { EmployeeActivityLog } from '@/lib/mock-data-employee-ext'
import { getPositionById, getStoreById } from '@/lib/mock-data'
import { getDefaultSecondaryPositions } from '@/lib/services/employee-service'
import { formatDate, formatTime } from '@/lib/utils'

export interface EmployeeProfileExtras {
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  cccd?: string
  address?: string
  current_address?: string
  emergency_contact?: string
  candidate_notes?: string
  bank_name?: string
  bank_account_no?: string
  bank_account_holder?: string
  cccd_issue_date?: string
  tax_code?: string
  official_salary?: number
  base_salary?: number
  kpi_salary?: number
  has_insurance?: boolean
  dependents_count?: number
  marital_status?: string
  ethnicity?: string
  religion?: string
  cccd_front_url?: string
  cccd_back_url?: string
}

interface ProfileChecklistItem {
  id: string
  label: string
  done: boolean
  hint: string
}

interface Props {
  employee: AuthUser
  profile?: EmployeeProfileExtras
  storeName?: string
  positionName?: string
  departmentName?: string
  activityLogs?: EmployeeActivityLog[]
  activeTab: 'personal' | 'job' | 'history'
  overallStatusTone: string
  overallStatusLabel: string
  workStatus: { label: string; className: string }
  accountStatus: { label: string; className: string }
  completeness: number
  completedChecklistCount: number
  profileChecklist: ProfileChecklistItem[]
  currentContract?: EmployeeContract
  contractStatusMeta?: { label: string } | null
  contractHealthLabel: string
  onOpenEditModal?: (sectionKey?: string) => void
  onUploadCccd?: (side: 'front' | 'back', file: File) => void
}

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="space-y-0.5">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
    <p className="text-sm font-semibold text-gray-900 truncate">{value || '—'}</p>
  </div>
)

const formatMoney = (amount?: number) => {
  if (amount === undefined || amount === null || amount === 0) return '0 đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function ProfileOverviewTab({
  employee,
  profile,
  storeName,
  positionName,
  departmentName,
  activityLogs,
  activeTab,
  currentContract,
  contractStatusMeta,
  contractHealthLabel,
  onOpenEditModal,
  onUploadCccd,
}: Props) {
  const frontInputRef = useRef<HTMLInputElement | null>(null)
  const backInputRef = useRef<HTMLInputElement | null>(null)

  const getGenderLabel = (g?: string) => {
    if (g === 'male') return 'Nam'
    if (g === 'female') return 'Nữ'
    if (g === 'other') return 'Khác'
    return '—'
  }

  const activeSecIds = Array.isArray(employee.secondary_position_ids)
    ? employee.secondary_position_ids
    : getDefaultSecondaryPositions(employee.position_id, employee.role)

  const secondaryPositionNames = activeSecIds
    .map(id => getPositionById(id)?.name)
    .filter(Boolean)
    .join(', ')

  const secondaryStoreNames = (employee.secondary_store_ids || [])
    .map(id => getStoreById(id)?.name.replace('Homies Milk Tea - ', '').trim())
    .filter(Boolean)
    .join(', ')

  // -------------------------------------------------------------
  // TAB 1: CÁ NHÂN (Personal, Identification, Extra)
  // -------------------------------------------------------------
  if (activeTab === 'personal') {
    return (
      <div className="space-y-5">
        {/* KHỐI 1: THÔNG TIN CƠ BẢN & NGÂN HÀNG */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Thông tin cơ bản</h3>
            {onOpenEditModal && (
              <button
                type="button"
                onClick={() => onOpenEditModal('basic')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50 transition-colors"
              >
                Cập nhật
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <InfoRow label="Họ tên" value={employee.full_name} />
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Số điện thoại" value={employee.phone} />
            <InfoRow label="Ngày sinh" value={profile?.date_of_birth} />
            <InfoRow label="Giới tính" value={getGenderLabel(profile?.gender)} />
            <InfoRow label="Nơi thường trú" value={profile?.address} />
            <InfoRow label="Nơi ở hiện tại" value={profile?.current_address} />
            <InfoRow label="Tài khoản ngân hàng" value={profile?.bank_account_no ? `${profile.bank_name || 'Ngân hàng'} - ${profile.bank_account_no} (${profile.bank_account_holder || ''})` : '—'} />
          </div>
        </div>

        {/* KHỐI 2: THÔNG TIN CĂN CƯỚC & ẢNH SCAN 2 MẶT */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Thông tin căn cước</h3>
            {onOpenEditModal && (
              <button
                type="button"
                onClick={() => onOpenEditModal('cccd')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50 transition-colors"
              >
                Cập nhật
              </button>
            )}
          </div>

          {/* Ô ẢNH CCCD MẶT TRƯỚC & MẶT SAU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* MẶT TRƯỚC */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-vanilla-50/50 p-4 text-center">
              <input
                type="file"
                ref={frontInputRef}
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && onUploadCccd?.('front', e.target.files[0])}
              />
              {profile?.cccd_front_url ? (
                <img src={profile.cccd_front_url} alt="CCCD Mặt trước" className="h-32 w-full max-w-[240px] rounded-xl object-cover shadow-xs" />
              ) : (
                <div className="flex flex-col items-center space-y-2 py-4">
                  <p className="text-xs font-semibold text-gray-500">Mặt trước CCCD</p>
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    className="rounded-lg bg-white px-3 py-1 text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Tải ảnh lên
                  </button>
                </div>
              )}
            </div>

            {/* MẶT SAU */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-vanilla-50/50 p-4 text-center">
              <input
                type="file"
                ref={backInputRef}
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && onUploadCccd?.('back', e.target.files[0])}
              />
              {profile?.cccd_back_url ? (
                <img src={profile.cccd_back_url} alt="CCCD Mặt sau" className="h-32 w-full max-w-[240px] rounded-xl object-cover shadow-xs" />
              ) : (
                <div className="flex flex-col items-center space-y-2 py-4">
                  <p className="text-xs font-semibold text-gray-500">Mặt sau CCCD</p>
                  <button
                    type="button"
                    onClick={() => backInputRef.current?.click()}
                    className="rounded-lg bg-white px-3 py-1 text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Tải ảnh lên
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
            <InfoRow label="Số CCCD" value={profile?.cccd} />
            <InfoRow label="Ngày cấp CCCD" value={profile?.cccd_issue_date} />
          </div>
        </div>

        {/* KHỐI 3: THÔNG TIN THÊM */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Thông tin thêm</h3>
            {onOpenEditModal && (
              <button
                type="button"
                onClick={() => onOpenEditModal('extra')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50 transition-colors"
              >
                Cập nhật
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InfoRow label="Số điện thoại khẩn cấp" value={profile?.emergency_contact} />
            <InfoRow label="Tình trạng hôn nhân" value={profile?.marital_status} />
            <InfoRow label="Dân tộc" value={profile?.ethnicity || 'Kinh'} />
            <InfoRow label="Tôn giáo" value={profile?.religion || 'Không'} />
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // TAB 2: CÔNG VIỆC (Job, Attendance, Contracts, Taxes & Insurance)
  // -------------------------------------------------------------
  if (activeTab === 'job') {
    return (
      <div className="space-y-5">
        {/* KHỐI 1: THÔNG TIN CÔNG VIỆC CHÍNH */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Thông tin công việc</h3>
            {onOpenEditModal && (
              <button
                type="button"
                onClick={() => onOpenEditModal('job')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50 transition-colors"
              >
                Cập nhật
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InfoRow label="Mã nhân viên" value={employee.employee_code} />
            <InfoRow label="Chức vụ" value={positionName || 'Chưa phân bổ'} />
            <InfoRow label="Bộ phận" value={departmentName || 'Vận hành cửa hàng'} />
            <InfoRow label="Vị trí kiêm nhiệm" value={secondaryPositionNames || 'Không có'} />
            <InfoRow label="Loại nhân viên" value={employee.employee_type === 'part_time' ? 'Bán thời gian' : 'Toàn thời gian'} />
            <InfoRow label="Chi nhánh chính" value={storeName?.replace('Homies Milk Tea - ', '')} />
            <InfoRow label="Chi nhánh phụ (Tăng ca)" value={secondaryStoreNames || 'Không có'} />
            <InfoRow label="Ngày gia nhập công ty" value={employee.hire_date} />
            <InfoRow label="Level / Bậc" value={employee.job_level || 'Bậc 1'} />
            <InfoRow label="Mức lương cơ bản" value={(profile?.official_salary ?? profile?.base_salary ?? 0) > 0 ? formatMoney(profile?.official_salary ?? profile?.base_salary) : 'Chưa thiết lập'} />
            <InfoRow label="Mức lương KPI" value={(profile?.kpi_salary ?? 0) > 0 ? formatMoney(profile?.kpi_salary) : 'Chưa thiết lập'} />
            <div className="col-span-2 space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Kiểu hạch toán lương</p>
              <p className="text-sm font-semibold text-gray-900">Theo chi nhánh chấm công</p>
              <p className="text-xs text-gray-500">Nhân viên chấm công ở chi nhánh nào thì công và lương sẽ được tính cho chi nhánh đó.</p>
            </div>
          </div>
        </div>

        {/* KHỐI 2: CHẤM CÔNG */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Chấm công</h3>
            {onOpenEditModal && (
              <button
                type="button"
                onClick={() => onOpenEditModal('attendance')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50 transition-colors"
              >
                Cập nhật
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InfoRow label="Được chấm công" value="Có" />
            <InfoRow label="Được tính lương" value="Có" />
            <InfoRow label="Điện thoại thông minh" value="Có" />
            <InfoRow label="Trả lương cơ bản không cần chấm công" value="Không" />
            <InfoRow label="Thiết bị chấm công" value="Có 1 thiết bị định vị WiFi/GPS" />
            <InfoRow label="Tự động duyệt ca phát sinh" value="Kế thừa cấu hình công ty" />
            <InfoRow label="Chấm công bằng WiFi chi nhánh" value="Kế thừa cấu hình công ty" />
            <InfoRow label="Cho phép chấm công từ xa" value="Kế thừa cấu hình công ty" />
            <InfoRow label="Chấm công khuôn mặt" value="Chưa đăng ký" />
          </div>
        </div>

        {/* KHỐI 3: GIẤY TỜ ĐÍNH KÈM */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Giấy tờ đính kèm</h3>
            {onOpenEditModal && (
              <button
                type="button"
                onClick={() => onOpenEditModal('extra')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50 transition-colors"
              >
                Cập nhật
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center py-8 text-center bg-vanilla-50/50 rounded-2xl border border-dashed border-gray-200 space-y-1">
            <p className="text-xs font-semibold text-gray-600">Chưa có dữ liệu giấy tờ đính kèm</p>
            <p className="text-[11px] text-gray-400">Các hồ sơ như Sơ yếu lý lịch, Bằng cấp, Hợp đồng scan...</p>
          </div>
        </div>

        {/* KHỐI 4: HỢP ĐỒNG */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Hợp đồng lao động</h3>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-vanilla-50/50 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">{currentContract ? (contractStatusMeta?.label || 'Hợp đồng lao động chính thức') : 'Chưa có hợp đồng'}</p>
              <p className="text-xs text-gray-500">{contractHealthLabel}</p>
            </div>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
              {currentContract ? 'Đang hiệu lực' : 'Chưa lập'}
            </span>
          </div>
        </div>

        {/* KHỐI 5: CẤU HÌNH LƯƠNG & THỐNG KÊ CÔNG */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Cấu hình lương & Thống kê công</h3>
            {onOpenEditModal && (
              <button
                type="button"
                onClick={() => onOpenEditModal('salary')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50 transition-colors"
              >
                Cập nhật
              </button>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-semibold text-gray-500 uppercase tracking-wider">Tổng hợp công gần nhất:</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-vanilla-50 p-3">
                <p className="text-gray-400">Tháng trước</p>
                <p className="text-base font-bold text-gray-900 mt-1">26 công</p>
              </div>
              <div className="rounded-2xl bg-vanilla-50 p-3">
                <p className="text-gray-400">Tháng này</p>
                <p className="text-base font-bold text-gray-900 mt-1">24 công</p>
              </div>
              <div className="rounded-2xl bg-vanilla-50 p-3">
                <p className="text-gray-400">Dự kiến</p>
                <p className="text-base font-bold text-gray-900 mt-1">28 công</p>
              </div>
            </div>
          </div>
        </div>

        {/* KHỐI 6: THUẾ & BẢO HIỂM */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Thuế, Bảo hiểm</h3>
            {onOpenEditModal && (
              <button
                type="button"
                onClick={() => onOpenEditModal('tax_insurance')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50 transition-colors"
              >
                Cập nhật
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InfoRow label="Tham gia bảo hiểm" value={profile?.has_insurance ? 'Có' : 'Không'} />
            <InfoRow label="Lương đóng bảo hiểm" value={profile?.has_insurance ? formatMoney(profile?.base_salary) : '—'} />
            <InfoRow label="Tham gia đóng thuế" value="Có" />
            <InfoRow label="Phương thức tính thuế" value="Biểu thuế lũy tiến" />
            <InfoRow label="Người phụ thuộc" value={profile?.dependents_count ? `${profile.dependents_count} người` : 'Không'} />
            <InfoRow label="Mã số thuế" value={profile?.tax_code} />
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // TAB 3: LỊCH SỬ HOẠT ĐỘNG (Activity logs, Probation, Salary changes, Store transfers)
  // -------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* KHỐI 1: NHẬT KÝ BIẾN ĐỘNG HỒ SƠ */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">Nhật ký biến động hồ sơ</h3>
          <span className="text-xs font-semibold text-gray-400">
            {activityLogs?.length || 0} bản ghi
          </span>
        </div>

        {activityLogs && activityLogs.length > 0 ? (
          <div className="space-y-3">
            {activityLogs.map(log => (
              <div key={log.id} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-vanilla-50/50 p-4 text-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 font-bold text-primary-600">
                  {log.action === 'created' ? 'T' : log.action === 'status_changed' ? 'S' : log.action === 'account_changed' ? 'K' : 'C'}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{log.title}</span>
                    <span className="text-gray-400 font-mono">{formatDate(log.created_at)} {formatTime(log.created_at)}</span>
                  </div>
                  {log.detail ? <p className="text-gray-600 break-words">{log.detail}</p> : null}
                  <p className="text-gray-400 text-[11px]">Người thực hiện: {log.actor_name || 'Hệ thống Homies HRM'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center bg-vanilla-50/50 rounded-2xl border border-dashed border-gray-200 space-y-1">
            <p className="text-xs font-semibold text-gray-600">Chưa có ghi nhận biến động gần đây</p>
            <p className="text-[11px] text-gray-400">Các thao tác đổi trạng thái, cập nhật lương, đổi chi nhánh sẽ được ghi nhận tại đây.</p>
          </div>
        )}
      </div>

      {/* KHỐI 2: THEO DÕI THỬ VIỆC */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Theo dõi Thử việc</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl bg-vanilla-50/50 p-4 space-y-1">
            <p className="text-gray-400 uppercase font-semibold text-[10px]">Trạng thái thử việc</p>
            <p className="text-sm font-bold text-gray-900">
              {employee.status === 'probation' ? 'Đang trong thời gian thử việc' : 'Đã hoàn thành thử việc'}
            </p>
          </div>
          <div className="rounded-2xl bg-vanilla-50/50 p-4 space-y-1">
            <p className="text-gray-400 uppercase font-semibold text-[10px]">Ngày vào làm chính thức</p>
            <p className="text-sm font-bold text-gray-900">{formatDate(employee.hire_date)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
