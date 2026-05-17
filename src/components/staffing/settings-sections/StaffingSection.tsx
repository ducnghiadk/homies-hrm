'use client'

import { Users, Pencil, BarChart3 } from 'lucide-react'
import { mockShifts, mockPositions } from '@/lib/mock-data'
import { staffingRequirements } from '@/lib/mock-data-staffing'

interface StaffingSectionProps {
  isEditing: boolean
  selectedStore: string
  onEdit: () => void
  onReqChange: (shiftId: string, posId: string, val: number) => void
}

const positions = mockPositions.filter(p =>
  ['pos-001', 'pos-002', 'pos-004'].includes(p.id)
)

function getReqCount(storeId: string, shiftId: string, posId: string) {
  const r = staffingRequirements.find(
    sr => sr.store_id === storeId && sr.shift_id === shiftId && sr.position_id === posId
  )
  return r?.required_count || 0
}

// ── View Mode: Summary card ──
export function StaffingSectionView({ selectedStore, onEdit }: {
  selectedStore: string
  onEdit: () => void
}) {
  const totalPerShift = mockShifts.reduce((total, shift) => {
    return total + positions.reduce((s, p) => s + getReqCount(selectedStore, shift.id, p.id), 0)
  }, 0)

  const maxPerShift = mockShifts.reduce((mx, shift) => {
    const shiftTotal = positions.reduce((s, p) => s + getReqCount(selectedStore, shift.id, p.id), 0)
    return Math.max(mx, shiftTotal)
  }, 0)

  const minPerShift = mockShifts.reduce((mn, shift) => {
    const shiftTotal = positions.reduce((s, p) => s + getReqCount(selectedStore, shift.id, p.id), 0)
    return mn === 0 ? shiftTotal : Math.min(mn, shiftTotal)
  }, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
              <BarChart3 size={16} className="text-blue-600" />
              Định biên cơ bản
            </h3>
            <p className="text-xs text-gray-500">Số người tối thiểu mỗi ca</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <Pencil size={12} /> Sửa
        </button>
      </div>

      {/* Summary */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Tổng nhân sự tất cả ca:</span>
          <span className="font-bold text-gray-800">{totalPerShift} người</span>
        </div>
        <div className="flex justify-between">
          <span>Tối thiểu / ca:</span>
          <span className="font-medium">{minPerShift} người</span>
        </div>
        <div className="flex justify-between">
          <span>Tối đa / ca:</span>
          <span className="font-medium">{maxPerShift} người</span>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">Vị trí bắt buộc:</div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {positions.map(p => (
              <span key={p.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Edit Mode: Full table (inside EditDrawer) ──
export function StaffingSectionEdit({ selectedStore, onReqChange }: {
  selectedStore: string
  onReqChange: (shiftId: string, posId: string, val: number) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Thiết lập số lượng nhân viên tối thiểu cho mỗi vị trí trong mỗi ca.
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Ca</th>
              {positions.map(p => (
                <th key={p.id} className="text-center py-3 px-3 text-xs font-medium text-gray-500">
                  {p.name}
                </th>
              ))}
              <th className="text-center py-3 px-3 text-xs font-medium text-gray-500">Tổng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockShifts.map(shift => {
              const total = positions.reduce(
                (s, p) => s + getReqCount(selectedStore, shift.id, p.id), 0
              )
              return (
                <tr key={shift.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-3">
                    <div className="font-medium text-gray-700">{shift.name}</div>
                    <div className="text-xs text-gray-400">{shift.start_time}-{shift.end_time}</div>
                  </td>
                  {positions.map(p => (
                    <td key={p.id} className="text-center py-3 px-3">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        className="w-14 text-center p-1.5 rounded-lg border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        value={getReqCount(selectedStore, shift.id, p.id)}
                        onChange={e => onReqChange(shift.id, p.id, parseInt(e.target.value) || 0)}
                      />
                    </td>
                  ))}
                  <td className="text-center py-3 px-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {total}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
