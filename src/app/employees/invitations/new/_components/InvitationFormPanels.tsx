'use client'

import { Briefcase, Calendar, Landmark, Mail, MapPin, Phone, User, Wallet } from 'lucide-react'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { ROLE_OPTIONS } from './invitation-constants'
import type {
  InvitationEmailConfig,
  InvitationFormData,
  InvitationFormErrors,
} from './invitation-types'

interface InvitationFormPanelsProps {
  form: InvitationFormData
  errors: InvitationFormErrors
  emailConfig: InvitationEmailConfig
  onUpdate: (key: keyof InvitationFormData, value: string | boolean) => void
  onEmailConfigChange: (key: keyof InvitationEmailConfig, value: string) => void
}

const DEPARTMENT_OPTIONS = [
  'Vận hành cửa hàng',
  'Quản lý cửa hàng',
  'Nhân sự - Điều hành',
  'Đào tạo nội bộ',
]

const EMPLOYEE_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'seasonal', label: 'Thời vụ' },
  { value: 'intern', label: 'Thực tập' },
]

const JOB_LEVEL_OPTIONS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']

const PROBATION_POLICY_OPTIONS = [
  { value: 'time_based', label: 'Thử việc theo thời gian' },
  { value: 'milestone_based', label: 'Thử việc theo mốc đánh giá' },
]

const PROBATION_SALARY_MODE_OPTIONS = [
  { value: 'percent_of_official', label: 'Theo % lương chính thức' },
  { value: 'fixed_amount', label: 'Mức lương thử việc cố định' },
]

export function InvitationFormPanels({
  form,
  errors,
  emailConfig,
  onUpdate,
  onEmailConfigChange,
}: InvitationFormPanelsProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-dark-700">
          <User size={18} className="text-primary-500" />
          Thông tin ứng viên
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(event) => onUpdate('full_name', event.target.value)}
              placeholder="Nhập họ và tên đầy đủ"
              className={`w-full rounded-xl border px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => onUpdate('email', event.target.value)}
                  placeholder="email@example.com"
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Số điện thoại</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => onUpdate('phone', event.target.value)}
                  placeholder="0901234567"
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Ghi chú nội bộ
            </label>
            <textarea
              value={form.notes}
              onChange={(event) => onUpdate('notes', event.target.value)}
              placeholder="Thêm ghi chú tuyển dụng, lưu ý ca làm hoặc nhận xét sơ bộ"
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-dark-700">
          <Briefcase size={18} className="text-primary-500" />
          Thông tin công việc dự kiến
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Ngày gia nhập <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={form.hire_date}
                  onChange={(event) => onUpdate('hire_date', event.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.hire_date ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.hire_date && <p className="mt-1 text-xs text-red-500">{errors.hire_date}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Chi nhánh <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.store_id}
                  onChange={(event) => onUpdate('store_id', event.target.value)}
                  className={`w-full appearance-none rounded-xl border bg-white py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.store_id ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <option value="">Chọn cửa hàng...</option>
                  {mockStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name.replace('Homies Milk Tea - ', '')}
                    </option>
                  ))}
                </select>
              </div>
              {errors.store_id && <p className="mt-1 text-xs text-red-500">{errors.store_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Bộ phận <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Landmark size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.department_name}
                  onChange={(event) => onUpdate('department_name', event.target.value)}
                  className={`w-full appearance-none rounded-xl border bg-white py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.department_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <option value="">Chọn bộ phận...</option>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              {errors.department_name && <p className="mt-1 text-xs text-red-500">{errors.department_name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Chức vụ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.position_id}
                  onChange={(event) => onUpdate('position_id', event.target.value)}
                  className={`w-full appearance-none rounded-xl border bg-white py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.position_id ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <option value="">Chọn vị trí...</option>
                  {mockPositions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.position_id && <p className="mt-1 text-xs text-red-500">{errors.position_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Loại nhân viên <span className="text-red-500">*</span>
              </label>
              <select
                value={form.employee_type}
                onChange={(event) => onUpdate('employee_type', event.target.value)}
                className={`w-full appearance-none rounded-xl border bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.employee_type ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                {EMPLOYEE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.employee_type && <p className="mt-1 text-xs text-red-500">{errors.employee_type}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Level <span className="text-red-500">*</span>
              </label>
              <select
                value={form.job_level}
                onChange={(event) => onUpdate('job_level', event.target.value)}
                className={`w-full appearance-none rounded-xl border bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.job_level ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                {JOB_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.job_level && <p className="mt-1 text-xs text-red-500">{errors.job_level}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Quyền hệ thống <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(event) => onUpdate('role', event.target.value)}
                className={`w-full appearance-none rounded-xl border bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.role ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-dark-700">
          <Wallet size={18} className="text-primary-500" />
          Đề xuất lương và thử việc
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Mức lương chính thức <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.official_salary}
                onChange={(event) => onUpdate('official_salary', event.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.official_salary ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.official_salary && <p className="mt-1 text-xs text-red-500">{errors.official_salary}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Mức lương KPI</label>
              <input
                type="number"
                min="0"
                value={form.kpi_salary}
                onChange={(event) => onUpdate('kpi_salary', event.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.kpi_salary ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.kpi_salary && <p className="mt-1 text-xs text-red-500">{errors.kpi_salary}</p>}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.is_probationary}
              onChange={(event) => onUpdate('is_probationary', event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Nhân viên thử việc
          </label>

          {form.is_probationary && (
            <div className="space-y-4 rounded-2xl border border-warning-100 bg-warning-50/40 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Thử việc theo</label>
                  <select
                    value={form.probation_policy}
                    onChange={(event) => onUpdate('probation_policy', event.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {PROBATION_POLICY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Ngày kết thúc thử việc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.probation_end_date}
                    onChange={(event) => onUpdate('probation_end_date', event.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.probation_end_date ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {errors.probation_end_date && <p className="mt-1 text-xs text-red-500">{errors.probation_end_date}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Kiểu tính lương thử việc</label>
                  <select
                    value={form.probation_salary_mode}
                    onChange={(event) => onUpdate('probation_salary_mode', event.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {PROBATION_SALARY_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Mức lương thử việc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.probation_salary_value}
                    onChange={(event) => onUpdate('probation_salary_value', event.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.probation_salary_value ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {errors.probation_salary_value && <p className="mt-1 text-xs text-red-500">{errors.probation_salary_value}</p>}
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.auto_complete_probation}
                  onChange={(event) => onUpdate('auto_complete_probation', event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Tự động hoàn thành thử việc khi đủ điều kiện
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-dark-700">
          <Mail size={18} className="text-primary-500" />
          Cấu hình email gửi đi
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tiêu đề Email <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={emailConfig.subject}
              onChange={(event) => onEmailConfigChange('subject', event.target.value)}
              placeholder="Nhập tiêu đề email"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Lời nhắn từ bộ phận tuyển dụng</label>
            <textarea
              value={emailConfig.personalNote}
              onChange={(event) => onEmailConfigChange('personalNote', event.target.value)}
              placeholder="Ví dụ: Chúng tôi mong muốn bạn đồng hành cùng đội ngũ Homies..."
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Hạn hoàn tất hồ sơ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={emailConfig.deadline}
                onChange={(event) => onEmailConfigChange('deadline', event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tên người hỗ trợ tuyển dụng</label>
              <input
                type="text"
                value={emailConfig.supportName}
                onChange={(event) => onEmailConfigChange('supportName', event.target.value)}
                placeholder="Ví dụ: Hoàng Thị Yến"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Thông tin liên hệ hỗ trợ</label>
            <input
              type="text"
              value={emailConfig.supportInfo}
              onChange={(event) => onEmailConfigChange('supportInfo', event.target.value)}
              placeholder="Ví dụ: 0956677889 / yen@bobahouse.vn"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
