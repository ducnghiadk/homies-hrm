'use client'

import AppShell from '@/components/layout/AppShell'
import { mockInsurance } from '@/lib/mock-data-payroll'
import { Shield, Download } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

export default function InsurancePage() {
  return (
    <AppShell title="Bảo hiểm">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #1E9E57, #059669)', color: '#fff' }}>
          <div className="flex items-center gap-2">
            <Shield size={20} />
            <div>
              <div className="text-xs opacity-80">Tổng đóng BHXH/YT/TN tháng này</div>
              <div className="text-xl font-bold mt-0.5">
                {fmt(mockInsurance.reduce((s, i) => s + i.bhxh_employee + i.bhyt_employee + i.bhtn_employee, 0))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="text-xs opacity-80">BHXH 8%</div>
              <div className="text-xs font-bold">{fmt(mockInsurance.reduce((s, i) => s + i.bhxh_employee, 0))}</div>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="text-xs opacity-80">BHYT 1.5%</div>
              <div className="text-xs font-bold">{fmt(mockInsurance.reduce((s, i) => s + i.bhyt_employee, 0))}</div>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="text-xs opacity-80">BHTN 1%</div>
              <div className="text-xs font-bold">{fmt(mockInsurance.reduce((s, i) => s + i.bhtn_employee, 0))}</div>
            </div>
          </div>
        </div>

        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📋 Chi tiết theo nhân viên</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-100)' }}>
                  <th className="text-left py-2" style={{ color: 'var(--text-primary)' }}>NV</th>
                  <th className="text-right py-2" style={{ color: 'var(--text-muted)' }}>Lương ĐK</th>
                  <th className="text-right py-2 text-emerald-500">NV đóng</th>
                  <th className="text-right py-2 text-primary-500">CT đóng</th>
                </tr>
              </thead>
              <tbody>
                {mockInsurance.map((ins, idx) => (
                  <tr key={ins.employee_id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--gray-50)' }}>
                    <td className="py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{ins.employee_name.split(' ').slice(-2).join(' ')}</td>
                    <td className="text-right py-2" style={{ color: 'var(--text-secondary)' }}>{(ins.salary_base / 1e6).toFixed(1)}tr</td>
                    <td className="text-right py-2 font-medium text-emerald-500">{fmt(ins.bhxh_employee + ins.bhyt_employee + ins.bhtn_employee)}</td>
                    <td className="text-right py-2 font-medium text-primary-500">{fmt(ins.bhxh_company + ins.bhyt_company + ins.bhtn_company)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in"><Download size={16} /> Xuất bảng bảo hiểm</button>
      </div>
    </AppShell>
  )
}
