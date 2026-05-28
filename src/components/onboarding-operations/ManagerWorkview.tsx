'use client'

import { useMemo, useState } from 'react'
import type { OnboardingThreeViewSnapshot } from '@/lib/career-path-types'

type ManagerWorkviewProps = {
  snapshots: OnboardingThreeViewSnapshot[]
  selectedEmployeeId: string | null
  onSelect: (employeeId: string) => void
  onApprove: (employeeId: string, itemId: string, note: string) => void
  onNeedCoaching: (employeeId: string, itemId: string, note: string) => void
}

export function ManagerWorkview({
  snapshots,
  selectedEmployeeId,
  onSelect,
  onApprove,
  onNeedCoaching,
}: ManagerWorkviewProps) {
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const selectedSnapshot = snapshots.find((snapshot) => snapshot.employee_id === selectedEmployeeId) ?? snapshots[0] ?? null

  const summary = useMemo(() => {
    const blocked = snapshots.filter((snapshot) => snapshot.blockers.length > 0).length
    const ready = snapshots.filter((snapshot) => snapshot.blockers.length === 0).length
    const waitingManager = snapshots.flatMap((snapshot) => snapshot.current_stage_items).filter((item) => item.action_owner === 'manager').length
    const buddyBottlenecks = snapshots.reduce<Record<string, number>>((acc, snapshot) => {
      const key = snapshot.assigned_buddy_name || 'Chua gan buddy'
      const count = snapshot.blockers.filter((blocker) => blocker.action_owner === 'buddy').length
      acc[key] = (acc[key] ?? 0) + count
      return acc
    }, {})

    return {
      blocked,
      ready,
      waitingManager,
      buddyBottlenecks: Object.entries(buddyBottlenecks).sort((left, right) => right[1] - left[1]).slice(0, 4),
    }
  }, [snapshots])

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['Tong dang onboarding', snapshots.length],
          ['Dang block', summary.blocked],
          ['Dang di dung huong', summary.ready],
          ['Cho quan ly duyet', summary.waitingManager],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[24px] border border-[#E8E1D1] bg-white p-4 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A6B53]">{label}</div>
            <div className="mt-2 text-2xl font-extrabold text-[#001D3D]">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="rounded-[28px] border border-[#E8E1D1] bg-white p-4 shadow-[0_10px_30px_rgba(0,29,61,0.06)]">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6B53]">Nhan vien can chu y</div>
            <div className="mt-4 space-y-3">
              {snapshots.map((snapshot) => (
                <button
                  key={snapshot.employee_id}
                  type="button"
                  onClick={() => onSelect(snapshot.employee_id)}
                  className={`w-full rounded-[22px] border p-4 text-left transition ${snapshot.employee_id === (selectedEmployeeId || selectedSnapshot?.employee_id) ? 'border-[#2F6FA8] bg-[#F4F8FC]' : 'border-[#E8E1D1] bg-[#FFFDF9]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-[#001D3D]">{snapshot.employee_name}</div>
                      <div className="mt-1 text-xs text-[#516273]">{snapshot.current_stage_label}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${snapshot.blockers.length ? 'bg-[#FFF4D6] text-[#8A5B00]' : 'bg-[#DDF4EC] text-[#107C41]'}`}>
                      {snapshot.blockers.length ? `${snapshot.blockers.length} block` : 'On dinh'}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-[#516273]">{snapshot.blockers[0]?.detail || 'Khong co blocker dang mo'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E8E1D1] bg-white p-4 shadow-[0_10px_30px_rgba(0,29,61,0.06)]">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6B53]">Buddy dang nghen</div>
            <div className="mt-4 space-y-3">
              {summary.buddyBottlenecks.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between rounded-[18px] bg-[#FFFDF9] px-3 py-3 text-sm">
                  <span className="font-semibold text-[#001D3D]">{name}</span>
                  <span className="rounded-full bg-[#EEF4FB] px-3 py-1 text-[11px] font-bold text-[#2F6FA8]">{count} item</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E8E1D1] bg-white p-5 shadow-[0_10px_30px_rgba(0,29,61,0.06)]">
          {!selectedSnapshot ? (
            <div className="text-sm text-[#516273]">Chon 1 nhan vien de xem ca block.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6B53]">Ca block</div>
                <h2 className="mt-2 text-2xl font-extrabold text-[#001D3D]">{selectedSnapshot.employee_name}</h2>
                <div className="mt-1 text-sm text-[#516273]">
                  {selectedSnapshot.current_stage_label} • Buddy: {selectedSnapshot.assigned_buddy_name || 'Chua gan'}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] bg-[#FFF8E8] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5B00]">Ly do block</div>
                  <div className="mt-2 text-sm font-semibold text-[#001D3D]">
                    {selectedSnapshot.blockers.map((blocker) => blocker.label).join(', ') || 'Khong con block'}
                  </div>
                </div>
                <div className="rounded-[22px] bg-[#FFFDF9] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2F6FA8]">Dang cho ai</div>
                  <div className="mt-2 text-sm font-semibold text-[#001D3D]">
                    {selectedSnapshot.blockers[0]?.action_owner === 'manager'
                      ? 'Dang cho quan ly quyet dinh'
                      : selectedSnapshot.blockers[0]?.action_owner === 'buddy'
                        ? 'Dang cho buddy xu ly'
                        : selectedSnapshot.blockers[0]?.action_owner === 'employee'
                          ? 'Dang cho nhan vien luyen tiep'
                          : 'Khong co ai dang giu buoc nay'}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedSnapshot.current_stage_items.map((item) => {
                  const draftKey = `${selectedSnapshot.employee_id}:${item.id}`
                  const canReview = item.action_owner === 'manager'

                  return (
                    <article key={item.id} className="rounded-[22px] border border-[#E8E1D1] bg-[#FFFDF9] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-[#001D3D]">{item.title}</div>
                          <div className="mt-1 text-xs text-[#516273]">{item.passing_standard}</div>
                        </div>
                        <span className="rounded-full bg-[#EEF4FB] px-3 py-1 text-[11px] font-bold text-[#2F6FA8]">
                          {item.action_owner === 'manager' ? 'Cho quan ly' : item.status}
                        </span>
                      </div>

                      <div className="mt-3 rounded-[18px] bg-white p-3 text-sm text-[#001D3D]">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2F6FA8]">Quan ly can kiem</div>
                        <div className="mt-1">{item.manager_check}</div>
                      </div>

                      <textarea
                        value={draftNotes[draftKey] ?? item.note ?? ''}
                        onChange={(event) => setDraftNotes((current) => ({ ...current, [draftKey]: event.target.value }))}
                        className="mt-3 min-h-[88px] w-full rounded-[18px] border border-[#E8E1D1] bg-white px-3 py-2 text-sm text-[#001D3D] outline-none"
                        placeholder="Ghi ly do can thiep, nhac buddy, hoac gop y tra ve..."
                      />

                      {canReview ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onApprove(selectedSnapshot.employee_id, item.id, draftNotes[draftKey] ?? item.note ?? '')}
                            className="rounded-xl bg-[#1E9E57] px-3 py-2 text-sm font-semibold text-white"
                          >
                            Duyet dat
                          </button>
                          <button
                            type="button"
                            onClick={() => onNeedCoaching(selectedSnapshot.employee_id, item.id, draftNotes[draftKey] ?? item.note ?? 'Can kem them')}
                            className="rounded-xl bg-[#EEF4FB] px-3 py-2 text-sm font-semibold text-[#2F6FA8]"
                          >
                            Tra ve kem them
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 text-sm font-semibold text-[#8A5B00]">
                          {item.action_owner === 'buddy' ? 'Case nay dang ket o buddy.' : item.action_owner === 'employee' ? 'Case nay dang ket o nhan vien.' : 'Item nay da xong.'}
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
