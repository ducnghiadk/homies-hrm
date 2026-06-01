'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getShiftById } from '@/lib/mock-data'
import {
  createSwapRequest, getCoworkersForSwap,
  getSwapRequestsForMe, getPendingSwapRequestsForManager,
  getSwapRequestStateMeta,
} from '@/lib/mock-data-swap'
import { ScheduleService } from '@/lib/services/schedule-service'
import { notifySwapRequestCreated } from '@/lib/notifications/swap-notifications'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronLeft, Check, ArrowRightLeft, UserPlus, Send,
  Sun, Sunset, Moon, ChevronRight, Inbox, Shield,
} from 'lucide-react'
import type { Schedule, Employee } from '@/lib/mock-data'

const shiftIcon = (shiftName: string) => {
  if (shiftName.includes('sáng') || shiftName.includes('Sáng')) return Sun
  if (shiftName.includes('chiều') || shiftName.includes('Chiều')) return Sunset
  return Moon
}

export default function ShiftSwapPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [swapType, setSwapType] = useState<'swap' | 'cover'>('swap')
  const [targetUser, setTargetUser] = useState<Employee | null>(null)
  const [targetSchedule, setTargetSchedule] = useState<Schedule | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  const mySchedules = useMemo(() => {
    if (!user) return []
    const raw = ScheduleService.getSchedulesForUser(user, user.id)
    const todayStr = new Date().toISOString().split('T')[0]
    const future = new Date()
    future.setDate(future.getDate() + 14)
    const futureStr = future.toISOString().split('T')[0]
    return raw.filter(s => s.date >= todayStr && s.date <= futureStr)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [user])

  const incomingRequests = useMemo(
    () => user ? getSwapRequestsForMe(user.id).filter(request => request.status === 'pending') : [],
    [user],
  )
  const managerPendingRequests = useMemo(
    () => (
      user && (user.role === 'store_manager' || user.role === 'hr_admin' || user.role === 'ceo')
        ? getPendingSwapRequestsForManager(user.store_id)
        : []
    ),
    [user],
  )

  const selectedShift = selectedSchedule ? getShiftById(selectedSchedule.shift_id) : undefined

  const coworkers = useMemo(() => {
    if (!selectedSchedule || !user) return []
    return getCoworkersForSwap(user.id, user.store_id, selectedSchedule.date, selectedSchedule.shift_id)
  }, [selectedSchedule, user])

  const targetSchedules = useMemo(() => {
    if (!targetUser || !user) return []
    const todayStr = new Date().toISOString().split('T')[0]
    return ScheduleService.getPeerSchedulesForSwap(user, targetUser.id).filter(s =>
      s.employee_id === targetUser.id && s.date >= todayStr
    ).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14)
  }, [targetUser, user])

  if (!user) return null

  const handleSubmit = () => {
    if (!selectedSchedule || !targetUser) return
    let created
    try {
      created = createSwapRequest(
        user.id, selectedSchedule.id, targetUser.id,
        swapType === 'swap' ? targetSchedule?.id : undefined,
        swapType, reason,
      )
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Không thể tạo yêu cầu đổi ca.')
      return
    }
    notifySwapRequestCreated({
      requestId: created.id,
      requesterId: user.id,
      requesterName: user.full_name,
      targetUserId: targetUser.id,
      targetName: targetUser.full_name,
      type: swapType,
      shiftName: selectedShift?.name || 'Ca làm',
      date: format(new Date(selectedSchedule.date), 'dd/MM/yyyy'),
      targetShiftName: targetSchedule ? getShiftById(targetSchedule.shift_id)?.name : undefined,
      targetDate: targetSchedule ? format(new Date(targetSchedule.date), 'dd/MM/yyyy') : undefined,
    })
    setToast('Đã gửi yêu cầu thành công!')
    setTimeout(() => router.push('/schedule/swap/list'), 1500)
  }

  const canProceed = () => {
    if (step === 0) return !!selectedSchedule
    if (step === 1) return true
    if (step === 2) return !!targetUser && (swapType === 'cover' || !!targetSchedule)
    if (step === 3) return reason.trim().length > 0
    return false
  }

  const steps = ['Chọn ca', 'Loại', 'Người', 'Lý do', 'Gửi']

  return (
    <AppShell showNav>
      <div className="space-y-5 animate-fade-in font-['Inter'] pb-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-dark-700">
                {swapType === 'swap' ? 'Đổi ca' : 'Nhờ thay ca'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Bước {step + 1} / {steps.length}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/schedule/swap/list')}
            className="px-3 py-2 rounded-xl bg-gray-100 text-dark-700 text-xs font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Inbox size={14} />
            Inbox
            {incomingRequests.length > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
            {managerPendingRequests.length > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-warning-500 text-white text-[10px] flex items-center justify-center">
                {managerPendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {(incomingRequests.length > 0 || managerPendingRequests.length > 0) && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-primary-800">Hộp thư đổi ca đang có việc chờ</p>
              <p className="text-xs text-primary-700">
                {incomingRequests.length > 0
                  ? `${incomingRequests.length} yêu cầu đang chờ bạn phản hồi.`
                  : `${managerPendingRequests.length} yêu cầu đang chờ quản lý duyệt.`}
              </p>
            </div>
            <button
              onClick={() => router.push('/schedule/swap/list')}
              className="shrink-0 px-3 py-2 rounded-xl bg-white text-primary-800 border border-primary-300 text-xs font-bold hover:bg-primary-100 transition-colors flex items-center gap-1.5"
            >
              {managerPendingRequests.length > 0 ? <Shield size={13} /> : <Inbox size={13} />}
              Mở inbox
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Đến tôi</p>
            <p className="mt-2 text-2xl font-black text-dark-700">{incomingRequests.length}</p>
            <p className="mt-1 text-xs text-gray-500">Yêu cầu đang chờ bạn đồng ý hoặc từ chối.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Chờ quản lý</p>
            <p className="mt-2 text-2xl font-black text-dark-700">{managerPendingRequests.length}</p>
            <p className="mt-1 text-xs text-gray-500">Đồng nghiệp đã đồng ý và đang chờ duyệt cuối.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Flow state</p>
            <p className="mt-2 text-sm font-bold text-dark-700">Chờ đồng nghiệp / Chờ quản lý / Đã duyệt</p>
            <p className="mt-1 text-xs text-gray-500">Nếu bị từ chối hoặc hủy thì flow dừng ở bước đó.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full transition-all ${
                i < step ? 'bg-primary-500' : i === step ? 'bg-primary-400' : 'bg-gray-200'
              }`} />
              <span className={`text-[9px] font-medium ${i <= step ? 'text-primary-600' : 'text-gray-300'}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step 0: Chọn ca */}
        {step === 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Chọn ca bạn muốn đổi/nhờ thay:</p>
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs text-gray-500">
              Chỉ các ca chính thức trong 14 ngày tới mới nên được dùng để tạo yêu cầu đổi ca hoặc nhờ thay.
            </div>
            {mySchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Không có ca nào trong 2 tuần tới</div>
            ) : mySchedules.map(sch => {
              const shift = getShiftById(sch.shift_id)
              if (!shift) return null
              const Icon = shiftIcon(shift.name)
              const isSel = selectedSchedule?.id === sch.id
              return (
                <button key={sch.id} onClick={() => setSelectedSchedule(sch)}
                  className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                    isSel ? 'border-primary-300 bg-primary-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${shift.color}20` }}>
                    <Icon size={20} style={{ color: shift.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-dark-700">{shift.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{format(new Date(sch.date), 'EEEE dd/MM', { locale: vi })}</p>
                  </div>
                  <span className="text-xs text-gray-400">{shift.start_time}–{shift.end_time}</span>
                  {isSel && <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                </button>
              )
            })}
          </div>
        )}

        {/* Step 1: Loại */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500">Bạn muốn:</p>
            {[
              { type: 'swap' as const, icon: ArrowRightLeft, title: 'Đổi ca với đồng nghiệp', desc: 'Tôi làm ca của họ, họ làm ca của tôi', color: '#2F6FA8' },
              { type: 'cover' as const, icon: UserPlus, title: 'Nhờ thay ca', desc: 'Chỉ cần người thay, tôi không làm bù', color: '#001D3D' },
            ].map(opt => {
              const isSel = swapType === opt.type
              return (
                <button key={opt.type} onClick={() => setSwapType(opt.type)}
                  className={`w-full p-5 rounded-2xl border flex items-center gap-4 transition-all ${
                    isSel ? 'shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                  style={isSel ? { borderColor: `${opt.color}40`, backgroundColor: `${opt.color}08` } : undefined}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${opt.color}15` }}>
                    <opt.icon size={24} style={{ color: opt.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-dark-700">{opt.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {isSel && <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: opt.color }}><Check size={14} className="text-white" /></div>}
                </button>
              )
            })}
          </div>
        )}

        {/* Step 2: Chọn người */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500">Chọn đồng nghiệp {swapType === 'swap' ? 'đổi ca' : 'thay ca'}:</p>
            {coworkers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Không có đồng nghiệp phù hợp</div>
            ) : coworkers.map(emp => {
              const isSel = targetUser?.id === emp.id
              return (
                <div key={emp.id}>
                  <button onClick={() => { setTargetUser(emp); setTargetSchedule(null) }}
                    className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                      isSel ? 'border-primary-300 bg-primary-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                      {emp.full_name.split(' ').pop()?.[0]}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-dark-700">{emp.full_name}</p>
                      <p className="text-xs text-gray-400">{emp.phone}</p>
                    </div>
                    {isSel && <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                  </button>
                  {isSel && swapType === 'swap' && (
                    <div className="ml-6 mt-2 space-y-1.5">
                      <p className="text-xs text-gray-400 font-medium">Chọn ca của họ để đổi:</p>
                      {targetSchedules.length === 0
                        ? <p className="text-xs text-gray-300 py-2">Không có ca</p>
                        : targetSchedules.map(ts => {
                          const tShift = getShiftById(ts.shift_id)
                          if (!tShift) return null
                          const isTSel = targetSchedule?.id === ts.id
                          return (
                            <button key={ts.id} onClick={() => setTargetSchedule(ts)}
                              className={`w-full p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                                isTSel ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white'
                              }`}>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tShift.color }} />
                              <span className="text-xs font-medium text-dark-700">{tShift.name}</span>
                              <span className="text-xs text-gray-400 capitalize">{format(new Date(ts.date), 'EEE dd/MM', { locale: vi })}</span>
                              {isTSel && <Check size={12} className="ml-auto text-primary-500" />}
                            </button>
                          )
                        })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Step 3: Lý do */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
              <p className="text-xs text-gray-400 font-medium">Tóm tắt</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${swapType === 'swap' ? 'bg-primary-100 text-primary-600' : 'bg-primary-100 text-primary-600'}`}>
                  {swapType === 'swap' ? 'Đổi ca' : 'Nhờ thay'}
                </span>
                <span className="text-xs text-dark-700 font-medium">{selectedShift?.name} — {selectedSchedule && format(new Date(selectedSchedule.date), 'dd/MM')}</span>
              </div>
              <p className="text-xs text-gray-500">→ {targetUser?.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Lý do <span className="text-error-400">*</span></p>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Nhập lý do đổi ca / nhờ thay..."
                rows={4} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 resize-none" />
            </div>
            <div className={`rounded-2xl px-4 py-3 text-xs ${getSwapRequestStateMeta({
              id: 'preview',
              requester_id: user.id,
              requester_schedule_id: selectedSchedule?.id || '',
              target_user_id: targetUser?.id || '',
              target_schedule_id: targetSchedule?.id,
              type: swapType,
              reason,
              status: 'pending',
              created_at: new Date().toISOString(),
            }).tone}`}>
              {getSwapRequestStateMeta({
                id: 'preview',
                requester_id: user.id,
                requester_schedule_id: selectedSchedule?.id || '',
                target_user_id: targetUser?.id || '',
                target_schedule_id: targetSchedule?.id,
                type: swapType,
                reason,
                status: 'pending',
                created_at: new Date().toISOString(),
              }).detail}
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 flex items-center justify-center">
              <Send size={28} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-dark-700">Xác nhận gửi yêu cầu?</h2>
            <p className="text-xs text-gray-400">Yêu cầu sẽ được gửi đến {targetUser?.full_name}</p>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-left space-y-1.5 text-xs">
              <p><span className="text-gray-400">Loại:</span> <span className="font-medium text-dark-700">{swapType === 'swap' ? 'Đổi ca' : 'Nhờ thay ca'}</span></p>
              <p><span className="text-gray-400">Ca:</span> <span className="font-medium text-dark-700">{selectedShift?.name} — {selectedSchedule && format(new Date(selectedSchedule.date), 'EEEE dd/MM', { locale: vi })}</span></p>
              <p><span className="text-gray-400">Đồng nghiệp:</span> <span className="font-medium text-dark-700">{targetUser?.full_name}</span></p>
              <p><span className="text-gray-400">Lý do:</span> <span className="font-medium text-dark-700">{reason}</span></p>
            </div>
            <div className={`rounded-2xl px-4 py-3 text-xs ${getSwapRequestStateMeta({
              id: 'preview',
              requester_id: user.id,
              requester_schedule_id: selectedSchedule?.id || '',
              target_user_id: targetUser?.id || '',
              target_schedule_id: targetSchedule?.id,
              type: swapType,
              reason,
              status: 'pending',
              created_at: new Date().toISOString(),
            }).tone}`}>
              {getSwapRequestStateMeta({
                id: 'preview',
                requester_id: user.id,
                requester_schedule_id: selectedSchedule?.id || '',
                target_user_id: targetUser?.id || '',
                target_schedule_id: targetSchedule?.id,
                type: swapType,
                reason,
                status: 'pending',
                created_at: new Date().toISOString(),
              }).label}: {getSwapRequestStateMeta({
                id: 'preview',
                requester_id: user.id,
                requester_schedule_id: selectedSchedule?.id || '',
                target_user_id: targetUser?.id || '',
                target_schedule_id: targetSchedule?.id,
                type: swapType,
                reason,
                status: 'pending',
                created_at: new Date().toISOString(),
              }).detail}
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium active:scale-[0.97] transition-transform">
              Quay lại
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-all ${
                canProceed() ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              Tiếp theo <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-[0.97] transition-transform">
              <Send size={16} /> Gửi yêu cầu
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
