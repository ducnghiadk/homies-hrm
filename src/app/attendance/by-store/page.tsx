'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockAttGrid } from '@/lib/mock-data-attendance'
import type { AttSymbol } from '@/lib/mock-data-attendance'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

const symbolColors: Record<AttSymbol, string> = {
  '✓': '#1E9E57', '½': '#F6C85F', 'X': '#D9381E', 'M': '#001D3D', 'P': '#2F6FA8', '-': '#9ca3af',
}

export default function AttendanceByStorePage() {
  const [month, setMonth] = useState(1) // Jan = 1
  const [year] = useState(2026)
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <AppShell title="Chấm công theo cửa hàng">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <button className="btn btn-ghost p-2" onClick={() => setMonth(m => m > 1 ? m - 1 : 12)}>
            <ChevronLeft size={20} />
          </button>
          <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Tháng {month}/{year}
          </div>
          <button className="btn btn-ghost p-2" onClick={() => setMonth(m => m < 12 ? m + 1 : 1)}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 animate-slide-up">
          {[
            { label: 'Tổng NV', value: mockAttGrid.length, color: 'var(--primary)' },
            { label: 'Đúng giờ', value: '87%', color: '#1E9E57' },
            { label: 'Đi muộn', value: '8%', color: '#F6C85F' },
            { label: 'Vắng', value: '5%', color: '#D9381E' },
          ].map(s => (
            <div key={s.label} className="card text-center p-3">
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 px-1 animate-fade-in">
          {Object.entries(symbolColors).map(([sym, color]) => (
            <div key={sym} className="flex items-center gap-1">
              <span className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center" style={{ background: color + '20', color }}>
                {sym}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {sym === '✓' ? 'Đủ' : sym === '½' ? 'Muộn' : sym === 'X' ? 'Vắng' : sym === 'M' ? 'Manual' : sym === 'P' ? 'Phép' : 'Nghỉ'}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable Grid */}
        <div className="card p-0 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: `${daysInMonth * 28 + 180}px` }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)' }}>
                  <th className="sticky left-0 z-10 p-2 text-left font-bold" style={{ background: 'var(--gray-50)', color: 'var(--text-primary)', minWidth: '120px' }}>
                    Nhân viên
                  </th>
                  {days.map(d => (
                    <th key={d} className="p-1 text-center font-medium" style={{ color: 'var(--text-muted)', minWidth: '24px' }}>
                      {d}
                    </th>
                  ))}
                  <th className="p-2 text-center font-bold" style={{ color: 'var(--text-primary)', minWidth: '40px' }}>Ngày</th>
                  <th className="p-2 text-center font-bold" style={{ color: 'var(--text-primary)', minWidth: '40px' }}>Giờ</th>
                </tr>
              </thead>
              <tbody>
                {mockAttGrid.map((row, idx) => (
                  <tr key={row.employee_id} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--gray-50)' }}>
                    <td className="sticky left-0 z-10 p-2 font-medium truncate"
                      style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--gray-50)', color: 'var(--text-primary)' }}>
                      {row.employee_name.split(' ').slice(-2).join(' ')}
                    </td>
                    {days.map(d => {
                      const cell = row.days[d]
                      return (
                        <td key={d} className="p-0.5 text-center">
                          {cell && (
                            <span className="inline-block w-5 h-5 rounded text-[9px] font-bold leading-5"
                              style={{ background: symbolColors[cell.symbol] + '20', color: symbolColors[cell.symbol] }}>
                              {cell.symbol}
                            </span>
                          )}
                        </td>
                      )
                    })}
                    <td className="p-2 text-center font-bold" style={{ color: 'var(--primary)' }}>{row.total_days}</td>
                    <td className="p-2 text-center font-bold" style={{ color: 'var(--text-primary)' }}>{row.total_hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export */}
        <div className="flex gap-2 animate-fade-in">
          <button className="btn btn-primary flex-1 text-sm gap-2">
            <Download size={16} /> Xuất Excel
          </button>
          <button className="btn flex-1 text-sm gap-2" style={{ background: 'var(--gray-100)', color: 'var(--text-primary)' }}>
            <Download size={16} /> Xuất PDF
          </button>
        </div>
      </div>
    </AppShell>
  )
}
