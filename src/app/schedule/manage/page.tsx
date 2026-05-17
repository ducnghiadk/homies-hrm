'use client'

import { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  mockEmployees, mockSchedules, mockShifts,
  getShiftById, getEmployeeById
} from '@/lib/mock-data'
import { getInitials } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function ScheduleManagePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{empId:string, date:string}|null>(null)
  const [localSchedules, setLocalSchedules] = useState(mockSchedules)

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  const weekDates = useMemo(() => {
    const now = new Date()
    const mon = new Date(now)
    mon.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon)
      d.setDate(mon.getDate() + i)
      return d
    })
  }, [weekOffset])

  const weekStrs = weekDates.map(d => d.toISOString().split('T')[0])
  const today = new Date().toISOString().split('T')[0]

  if (!user || user.role === 'employee') {
    return <AppShell title="Xếp lịch"><div className="text-center py-20" style={{color:'var(--text-muted)'}}>Không có quyền</div></AppShell>
  }

  const storeEmps = mockEmployees.filter(e =>
    (user.role === 'ceo' || e.store_id === user.store_id) && e.role === 'employee'
  )

  const addSchedule = (empId: string, date: string, shiftId: string) => {
    setLocalSchedules(prev => [...prev, {
      id: `new-${Date.now()}`, org_id: 'org-001', store_id: user.store_id,
      employee_id: empId, shift_id: shiftId, date
    }])
    setShowAddModal(false)
    setSelectedCell(null)
  }

  const removeSchedule = (id: string) => {
    setLocalSchedules(prev => prev.filter(s => s.id !== id))
  }

  const weekLabel = `${weekDates[0].getDate()}/${weekDates[0].getMonth()+1} - ${weekDates[6].getDate()}/${weekDates[6].getMonth()+1}`

  return (
    <AppShell title="Xếp lịch (Quản lý)">
      <div className="space-y-4">
        {/* Week Nav */}
        <div className="flex items-center justify-between animate-fade-in">
          <button className="btn btn-ghost p-2" onClick={() => setWeekOffset(w => w-1)}>
            <ChevronLeft size={20}/>
          </button>
          <div className="text-center">
            <div className="font-bold text-sm">{weekLabel}</div>
            <button className="text-xs font-medium" style={{color:'var(--primary)'}}
              onClick={() => setWeekOffset(0)}>
              {weekOffset === 0 ? 'Tuần này' : 'Về tuần này'}
            </button>
          </div>
          <button className="btn btn-ghost p-2" onClick={() => setWeekOffset(w => w+1)}>
            <ChevronRight size={20}/>
          </button>
        </div>

        {/* Schedule Grid */}
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs" style={{minWidth:'600px'}}>
            <thead>
              <tr>
                <th className="text-left py-2 px-1 font-semibold sticky left-0"
                  style={{background:'var(--background)', width:'100px', color:'var(--text-secondary)'}}>
                  Nhân viên
                </th>
                {weekDates.map((d, i) => (
                  <th key={i} className="text-center py-2 px-1 font-semibold"
                    style={{color: weekStrs[i]===today ? 'var(--primary)' : 'var(--text-secondary)',
                      background: weekStrs[i]===today ? 'var(--primary-50)' : undefined,
                      borderRadius:'8px'}}>
                    <div>{DAY_LABELS[i]}</div>
                    <div className="font-bold">{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {storeEmps.map(emp => (
                <tr key={emp.id} className="border-t" style={{borderColor:'var(--gray-100)'}}>
                  <td className="py-2 px-1 sticky left-0" style={{background:'var(--background)'}}>
                    <div className="flex items-center gap-1.5">
                      <div className="avatar" style={{width:24,height:24,fontSize:9}}>{getInitials(emp.full_name)}</div>
                      <span className="font-medium truncate" style={{maxWidth:'70px'}}>{emp.full_name.split(' ').pop()}</span>
                    </div>
                  </td>
                  {weekStrs.map(dateStr => {
                    const cellScheds = localSchedules.filter(s => s.employee_id === emp.id && s.date === dateStr)
                    return (
                      <td key={dateStr} className="py-1 px-0.5 text-center align-top"
                        style={{background: dateStr===today ? 'var(--primary-50)' : undefined}}>
                        {cellScheds.map(sch => {
                          const shift = getShiftById(sch.shift_id)
                          return (
                            <div key={sch.id} className="relative group rounded-md px-1 py-0.5 mb-0.5"
                              style={{background: shift?.color + '22', borderLeft:`2px solid ${shift?.color}`}}>
                              <span className="font-bold" style={{color:shift?.color, fontSize:'9px'}}>
                                {shift?.name.replace('Ca ','')}
                              </span>
                              <button onClick={() => removeSchedule(sch.id)}
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{background:'var(--error)', color:'white', fontSize:'8px'}}>
                                <X size={8}/>
                              </button>
                            </div>
                          )
                        })}
                        <button onClick={() => { setSelectedCell({empId:emp.id, date:dateStr}); setShowAddModal(true) }}
                          className="w-full rounded-md py-1 opacity-0 hover:opacity-100 transition-opacity"
                          style={{background:'var(--gray-100)', color:'var(--text-muted)', fontSize:'10px'}}>
                          <Plus size={10} className="mx-auto"/>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Shift Legend */}
        <div className="flex gap-3 justify-center">
          {mockShifts.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded" style={{background:s.color}}/>
              <span>{s.name} ({s.start_time}-{s.end_time})</span>
            </div>
          ))}
        </div>

        {/* Add Modal */}
        {showAddModal && selectedCell && (
          <div className="fixed inset-0 z-50 flex items-end justify-center"
            style={{background:'rgba(0,0,0,0.4)'}}>
            <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 animate-slide-up"
              style={{maxHeight:'50vh'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Thêm ca — {getEmployeeById(selectedCell.empId)?.full_name?.split(' ').pop()} ({selectedCell.date.slice(5)})</h3>
                <button onClick={() => {setShowAddModal(false); setSelectedCell(null)}}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{background:'var(--gray-100)'}}>
                  <X size={16}/>
                </button>
              </div>
              <div className="space-y-2">
                {mockShifts.map(shift => (
                  <button key={shift.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                    style={{background:shift.color+'15', border:`1px solid ${shift.color}30`}}
                    onClick={() => addSchedule(selectedCell.empId, selectedCell.date, shift.id)}>
                    <div className="w-4 h-8 rounded" style={{background:shift.color}}/>
                    <div>
                      <div className="font-semibold text-sm">{shift.name}</div>
                      <div className="text-xs" style={{color:'var(--text-secondary)'}}>
                        {shift.start_time} - {shift.end_time}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
