import { EmployeeService } from '@/lib/services/employee-service'
import type { InvitationFormData, InvitationFormErrors } from './invitation-types'

export function validateInvitationForm(form: InvitationFormData): InvitationFormErrors {
  const errors: InvitationFormErrors = {}

  if (!form.full_name.trim()) {
    errors.full_name = 'Vui lòng nhập họ và tên'
  }

  if (!form.email.trim()) {
    errors.email = 'Vui lòng nhập email để gửi lời mời'
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Email không hợp lệ'
  }

  if (form.email && EmployeeService.isInvitationEmailDuplicate(form.email)) {
    errors.email = 'Email đã có lời mời đang chờ xử lý'
  }

  if (form.email && EmployeeService.isEmailDuplicate(form.email)) {
    errors.email = 'Email này đã tồn tại trong danh sách nhân viên'
  }

  if (form.phone && EmployeeService.isInvitationPhoneDuplicate(form.phone)) {
    errors.phone = 'Số điện thoại đã có lời mời đang chờ xử lý'
  }

  if (form.phone && EmployeeService.isPhoneDuplicate(form.phone)) {
    errors.phone = 'Số điện thoại này đã tồn tại trong danh sách nhân viên'
  }

  if (!form.hire_date) {
    errors.hire_date = 'Vui lòng chọn ngày gia nhập'
  }

  if (!form.store_id) {
    errors.store_id = 'Vui lòng chọn cửa hàng'
  }

  if (!form.position_id) {
    errors.position_id = 'Vui lòng chọn vị trí'
  }

  if (!form.department_name.trim()) {
    errors.department_name = 'Vui lòng chọn bộ phận'
  }

  if (!form.employee_type) {
    errors.employee_type = 'Vui lòng chọn loại nhân viên'
  }

  if (!form.job_level.trim()) {
    errors.job_level = 'Vui lòng chọn level'
  }

  if (!form.official_salary || Number(form.official_salary) <= 0) {
    errors.official_salary = 'Vui lòng nhập lương chính thức'
  }

  if (Number(form.kpi_salary) < 0) {
    errors.kpi_salary = 'Lương KPI không hợp lệ'
  }

  if (form.is_probationary) {
    if (!form.probation_end_date) {
      errors.probation_end_date = 'Vui lòng chọn ngày kết thúc thử việc'
    }

    if (!form.probation_salary_value || Number(form.probation_salary_value) <= 0) {
      errors.probation_salary_value = 'Vui lòng nhập lương thử việc'
    }
  }

  if (!form.role) {
    errors.role = 'Vui lòng chọn vai trò'
  }

  return errors
}
