import { supabase } from '@/lib/supabase'

export const payrollPeriodAdapter = {
  async fetchPayrollPeriod(thang: number, nam: number) {
    try {
      const { data, error } = await supabase
        .from('ky_luong')
        .select('*')
        .eq('thang', thang)
        .eq('nam', nam)
        // Hardcoded to_chuc_id for now as in master-data-adapter
        .eq('to_chuc_id', 'a0000000-0000-0000-0000-000000000001')
        .maybeSingle()

      if (error) {
        console.error('[payrollPeriodAdapter] Error fetching payroll period:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('[payrollPeriodAdapter] Exception fetching payroll period:', err)
      return null
    }
  },

  async savePayrollPeriod(thang: number, nam: number, results: any[], policySnapshot: any) {
    try {
      // 1. Upsert ky_luong
      const kyLuongPayload = {
        to_chuc_id: 'a0000000-0000-0000-0000-000000000001',
        thang,
        nam,
        trang_thai: 'da_chot',
        // Optional: Assuming we need to store total gross/net, we could calculate it or pass it.
        // For this task, we will just set the necessary fields.
      }
      
      const { data: kyLuong, error: kyLuongError } = await supabase
        .from('ky_luong')
        .upsert([kyLuongPayload], { onConflict: 'to_chuc_id, nam, thang' })
        .select()
        .single()

      if (kyLuongError || !kyLuong) {
        console.error('[payrollPeriodAdapter] Error saving ky_luong:', kyLuongError)
        return { success: false, error: kyLuongError?.message || 'Lỗi lưu kỳ lương' }
      }

      // 2. Map and Upsert phieu_luong
      // Only map columns that actually exist in the schema
      const slipsPayload = results.map(r => ({
        ky_luong_id: kyLuong.id,
        nhan_vien_id: r.employee_id,
        bo_phan: r.department || null,
        level: r.level || null,
        loai_nhan_vien: r.employee_type || null,
        luong_co_ban: r.base_salary || 0,
        so_ca: r.work_days || 0, // Using work_days as so_ca based on context
        tong_so_gio: r.total_hours || 0,
        so_gio_thuong: r.regular_hours || 0,
        so_gio_tang_ca: r.overtime_hours || 0,
        tong_so_cong: r.total_days || 0,
        so_cong_thuong: r.regular_days || 0,
        so_cong_tang_ca: r.ot_days || 0,
        tien_tang_ca: r.overtime_amount || 0,
        luong_theo_gio: r.base_earned || 0,
        tong_phu_cap: r.total_allowances || 0,
        tong_phieu_cong: r.total_bonuses || 0,
        tong_phat: r.late_deduction || 0, // Just an approximation, not all deductions are mapped precisely in this quick adapter
        tong_phieu_tru: r.total_other_deductions || 0,
        luong_kpi: r.kpi_salary || 0,
        tien_cong_doan: r.union_fee || 0,
        tong_luong: r.gross_salary || 0,
        hoan_giu_luong: r.return_hold_salary || 0,
        giu_luong: r.hold_salary || 0,
        ung_luong: r.advance_deduction || 0,
        luong_thuc_nhan: r.net_salary || 0,
        lam_tron: 0,
        trang_thai: 'chua_gui_phieu_luong'
      }))

      const { error: phieuError } = await supabase
        .from('phieu_luong')
        .upsert(slipsPayload, { onConflict: 'ky_luong_id, nhan_vien_id' })

      if (phieuError) {
        console.error('[payrollPeriodAdapter] Error saving phieu_luong:', phieuError)
        return { success: false, error: phieuError.message }
      }

      return { success: true }
    } catch (err) {
      console.error('[payrollPeriodAdapter] Exception saving payroll period:', err)
      return { success: false, error: String(err) }
    }
  },

  async fetchPayrollSlips(kyLuongId: string) {
    try {
      const { data, error } = await supabase
        .from('phieu_luong')
        .select('*')
        .eq('ky_luong_id', kyLuongId)

      if (error) {
        console.error('[payrollPeriodAdapter] Error fetching payroll slips:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('[payrollPeriodAdapter] Exception fetching payroll slips:', err)
      return []
    }
  }
}
