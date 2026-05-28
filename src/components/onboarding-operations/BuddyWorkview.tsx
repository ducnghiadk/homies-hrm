'use client'

import { useMemo, useState } from 'react'
import type { OnboardingThreeViewSnapshot } from '@/lib/career-path-types'

type BuddyWorkviewProps = {
  snapshots: OnboardingThreeViewSnapshot[]
  selectedEmployeeId: string | null
  onSelect: (employeeId: string) => void
  onApprove: (employeeId: string, itemId: string, note: string) => void
  onNeedCoaching: (employeeId: string, itemId: string, note: string) => void
}

function getStatusLabel(status: OnboardingThreeViewSnapshot['current_stage_items'][number]['status']) {
  if (status === 'passed') return 'Dat'
  if (status === 'pending_review') return 'Cho danh gia'
  if (status === 'needs_coaching') return 'Can kem them'
  if (status === 'learning') return 'Dang hoc'
  return 'Chua lam'
}

export function BuddyWorkview({
  snapshots,
  selectedEmployeeId,
  onSelect,
  onApprove,
  onNeedCoaching,
}: BuddyWorkviewProps) {
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const selectedSnapshot = snapshots.find((snapshot) => snapshot.employee_id === selectedEmployeeId) ?? snapshots[0] ?? null

  const stats = useMemo(() => ({
    total: snapshots.length,
    waitingBuddy: snapshots.flatMap((snapshot) => snapshot.current_stage_items).filter((item) => item.action_owner === 'buddy').length,
    blockedByBuddy: snapshots.filter((snapshot) => snapshot.blockers.some((blocker) => blocker.action_owner === 'buddy')).length,
    coaching: snapshots.flatMap((snapshot) => snapshot.current_stage_items).filter((item) => item.status === 'needs_coaching').length,
  }), [snapshots])

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['Hom nay kem ai', stats.total],
          ['Cho ban danh gia', stats.waitingBuddy],
          ['Dang ket vi ban', stats.blockedByBuddy],
          ['Can kem lai', stats.coaching],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[24px] border border-[#E8E1D1] bg-white p-4 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A6B53]">{label}</div>
            <div className="mt-2 text-2xl font-extrabold text-[#001D3D]">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-[#E8E1D1] bg-white p-4 shadow-[0_10px_30px_rgba(0,29,61,0.06)]">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6B53]">Hang doi buddy</div>
          <h2 className="mt-2 text-xl font-extrabold text-[#001D3D]">Hom nay can kem ai</h2>

          <div className="mt-4 space-y-3">
            {snapshots.length === 0 ? (
              <div className="rounded-[20px] bg-[#FFFDF9] p-4 text-sm text-[#516273]">
                Chua co ai dang duoc gan cho ban.
              </div>
            ) : snapshots.map((snapshot) => {
              const isSelected = snapshot.employee_id === selectedEmployeeId || (!selectedEmployeeId && snapshot.employee_id === selectedSnapshot?.employee_id)
              const waitingCount = snapshot.current_stage_items.filter((item) => item.action_owner === 'buddy').length

              return (
                <button
                  key={snapshot.employee_id}
                  type="button"
                  onClick={() => onSelect(snapshot.employee_id)}
                  className={`w-full rounded-[22px] border p-4 text-left transition ${isSelected ? 'border-[#2F6FA8] bg-[#F4F8FC]' : 'border-[#E8E1D1] bg-[#FFFDF9]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-[#001D3D]">{snapshot.employee_name}</div>
                      <div className="mt-1 text-xs text-[#516273]">{snapshot.current_stage_label}</div>
                    </div>
                    <span className="rounded-full bg-[#EEF4FB] px-3 py-1 text-[11px] font-bold text-[#2F6FA8]">
                      {waitingCount} cho ban
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-[#516273]">
                    {snapshot.blockers[0]?.detail || 'Khong co blocker dang mo'}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E8E1D1] bg-white p-5 shadow-[0_10px_30px_rgba(0,29,61,0.06)]">
          {!selectedSnapshot ? (
            <div className="text-sm text-[#516273]">Chon 1 nhan vien de xem item can kem.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6B53]">Chi tiet buddy</div>
                <h2 className="mt-2 text-2xl font-extrabold text-[#001D3D]">{selectedSnapshot.employee_name}</h2>
                <div className="mt-1 text-sm text-[#516273]">{selectedSnapshot.current_stage_label}</div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] bg-[#FFF8E8] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5B00]">Dang ket vi ban</div>
                  <div className="mt-2 text-sm font-semibold text-[#001D3D]">
                    {selectedSnapshot.blockers.filter((blocker) => blocker.action_owner === 'buddy').map((blocker) => blocker.item_title || blocker.label).join(', ') || 'Khong co item nao dang ket vi buddy'}
                  </div>
                </div>
                <div className="rounded-[22px] bg-[#FFFDF9] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2F6FA8]">Muc tieu chang</div>
                  <div className="mt-2 text-sm font-semibold text-[#001D3D]">
                    {selectedSnapshot.stages.find((stage) => stage.code === selectedSnapshot.current_stage_code)?.goal_summary}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedSnapshot.current_stage_items.map((item) => {
                  const draftKey = `${selectedSnapshot.employee_id}:${item.id}`
                  const canReview = item.action_owner === 'buddy'

                  return (
                    <article key={item.id} className="rounded-[22px] border border-[#E8E1D1] bg-[#FFFDF9] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-[#001D3D]">{item.title}</div>
                          <div className="mt-1 text-xs text-[#516273]">{item.passing_standard}</div>
                        </div>
                        <span className="rounded-full bg-[#EEF4FB] px-3 py-1 text-[11px] font-bold text-[#2F6FA8]">
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[18px] bg-white p-3 text-sm text-[#001D3D]">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2F6FA8]">Nhan vien phai lam</div>
                          <div className="mt-1">{item.employee_action}</div>
                        </div>
                        <div className="rounded-[18px] bg-white p-3 text-sm text-[#001D3D]">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2F6FA8]">Buddy phai huong dan</div>
                          <div className="mt-1">{item.buddy_action}</div>
                        </div>
                      </div>

                      <textarea
                        value={draftNotes[draftKey] ?? item.note ?? ''}
                        onChange={(event) => setDraftNotes((current) => ({ ...current, [draftKey]: event.target.value }))}
                        className="mt-3 min-h-[88px] w-full rounded-[18px] border border-[#E8E1D1] bg-white px-3 py-2 text-sm text-[#001D3D] outline-none"
                        placeholder="Ghi chu danh gia hoac góp ý cu the..."
                      />

                      {canReview ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onApprove(selectedSnapshot.employee_id, item.id, draftNotes[draftKey] ?? item.note ?? '')}
                            className="rounded-xl bg-[#1E9E57] px-3 py-2 text-sm font-semibold text-white"
                          >
                            Danh gia dat
                          </button>
                          <button
                            type="button"
                            onClick={() => onNeedCoaching(selectedSnapshot.employee_id, item.id, draftNotes[draftKey] ?? item.note ?? 'Can kem them')}
                            className="rounded-xl bg-[#EEF4FB] px-3 py-2 text-sm font-semibold text-[#2F6FA8]"
                          >
                            Yeu cau luyen them
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 text-sm font-semibold text-[#8A5B00]">
                          {item.action_owner === 'employee' ? 'Dang cho nhan vien thao tac.' : item.action_owner === 'manager' ? 'Item nay dang cho quan ly duyet.' : 'Item nay da xong.'}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
