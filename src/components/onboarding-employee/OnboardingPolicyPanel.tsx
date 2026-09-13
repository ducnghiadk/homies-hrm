'use client'

import { FileText, MessageCircleQuestion, ShieldCheck } from 'lucide-react'
import {
  type EmployeeOnboardingPolicyRecord,
  type OnboardingDayOneChecklistItem,
  type OnboardingDayOneChecklistSnapshot,
  OnboardingPolicyService,
} from '@/lib/services/onboarding-policy-service'

type OnboardingPolicyPanelProps = {
  policyRecord: EmployeeOnboardingPolicyRecord | null
  policySnapshot: OnboardingDayOneChecklistSnapshot
  onAcknowledge: () => void
  onRequestClarification: () => void
}

function formatPolicyTime(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

function getStatusTone(item: OnboardingDayOneChecklistItem) {
  if (item.tone === 'done') {
    return {
      color: 'var(--success)',
      background: 'color-mix(in srgb, var(--success) 12%, white)',
      border: '1px solid color-mix(in srgb, var(--success) 22%, white)',
    }
  }

  if (item.tone === 'warning') {
    return {
      color: 'var(--warning)',
      background: 'color-mix(in srgb, var(--warning) 12%, white)',
      border: '1px solid color-mix(in srgb, var(--warning) 22%, white)',
    }
  }

  return {
    color: 'var(--primary)',
    background: 'color-mix(in srgb, var(--primary) 10%, white)',
    border: '1px solid color-mix(in srgb, var(--primary) 18%, white)',
  }
}

function getPolicyStatusTone(snapshot: OnboardingDayOneChecklistSnapshot) {
  if (snapshot.storeConfirmed || snapshot.acknowledged) {
    return { label: '\u0110\u00e3 \u0068\u006f\u00e0\u006e \u0074\u1ea5\u0074', className: 'bg-[#DDF4EC] text-[#107C41]' }
  }
  if (snapshot.clarificationRequested) {
    return { label: '\u0043\u1ea7\u006e \u0048\u0052 \u0067\u0069\u1ea3\u0069 \u0074\u0068\u00ed\u0063\u0068', className: 'bg-[#FFF4D6] text-[#8A5B00]' }
  }
  if (snapshot.needsEmployeeAction) {
    return { label: '\u0110\u0061\u006e\u0067 \u0063\u0068\u1edd \u0062\u1ea1\u006e \u0070\u0068\u1ea3\u006e \u0068\u1ed3\u0069', className: 'bg-[#EEF4FB] text-[#2F6FA8]' }
  }
  if (snapshot.summarySent && !snapshot.fullSent) {
    return { label: '\u0110\u00e3 \u0067\u1eedi \u0074\u00f3\u006d \u0074\u1eaft', className: 'bg-[#FFF8E8] text-[#9A6700]' }
  }
  return { label: '\u0110\u0061\u006e\u0067 \u0063\u0068\u1edd \u0048\u0052', className: 'bg-[#F3F4F6] text-[#6B7280]' }
}

export function OnboardingPolicyPanel({
  policyRecord,
  policySnapshot,
  onAcknowledge,
  onRequestClarification,
}: OnboardingPolicyPanelProps) {
  const policyStatusTone = getPolicyStatusTone(policySnapshot)
  const policyTemplate =
    policyRecord && (policySnapshot.summarySent || policySnapshot.fullSent)
      ? OnboardingPolicyService.getTemplate(policyRecord.template_id)
      : null

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#2F6FA8]">
          <ShieldCheck size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">
                {'\u0043\u0068\u00ed\u006e\u0068 \u0073\u00e1\u0063\u0068'}
              </div>
              <h3 className="mt-1 text-lg font-bold text-[#001D3D]">
                {'\u004e\u1ed9\u0069 \u0071\u0075\u0079 \u006e\u0068\u1ead\u006e \u0076\u0069\u1ec7\u0063'}
              </h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${policyStatusTone.className}`}>
              {policyStatusTone.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-[#6B7280]">{policySnapshot.waitingLabel}</p>
          <p className="mt-1 text-sm font-medium text-[#4B5563]">{policySnapshot.nextActionLabel}</p>
        </div>
      </div>

      {policyTemplate ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-[#E8E1D1] bg-[#FFFDF9] p-3">
            <div className="mb-2 flex items-center gap-2">
              <FileText size={15} className="text-[#2F6FA8]" />
              <span className="text-xs font-bold text-[#001D3D]">
                {'\u0043\u00e1\u0063 \u0111\u0069\u1ec3\u006d \u0063\u1ea7\u006e \u006e\u0068\u1edb'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {policyTemplate.summary_points.map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-[#ECE7DA] bg-white px-3 py-2 text-xs font-medium text-[#4B5563]"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          {policySnapshot.fullSent ? (
            <div className="rounded-2xl border border-[#E8E1D1] bg-[#FFFDF9] p-3">
              <div className="mb-2 flex items-center gap-2">
                <FileText size={15} className="text-[#2F6FA8]" />
                <span className="text-xs font-bold text-[#001D3D]">
                  {'\u004e\u1ed9\u0069 \u0064\u0075\u006e\u0067 \u0111\u1ea7\u0079 \u0111\u1ee7'}
                </span>
              </div>
              <div className="space-y-2">
                {policyTemplate.full_sections.map((section) => (
                  <div key={section.title} className="rounded-xl border border-[#ECE7DA] bg-white p-3">
                    <div className="text-xs font-bold text-[#001D3D]">{section.title}</div>
                    <div className="mt-1 text-xs leading-5 text-[#4B5563]">{section.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#E8E1D1] bg-[#FFFDF9] p-3">
            <div className="mb-2 text-xs font-bold text-[#001D3D]">
              {'\u0043\u00e1\u0063 \u006d\u1ed1\u0063 \u0111\u0061\u006e\u0067 \u0074\u0068\u0065\u006f \u0064\u00f5\u0069'}
            </div>
            <div className="space-y-2">
              {policySnapshot.items.map((item) => {
                const tone = getStatusTone(item)

                return (
                  <div key={item.id} className="rounded-xl bg-white p-3" style={{ border: tone.border }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-[#001D3D]">{item.label}</div>
                        <div className="mt-1 text-xs text-[#4B5563]">{item.hint}</div>
                        <div className="mt-2 text-[11px] text-[#6B7280]">{item.scheduleLabel}</div>
                      </div>
                      <span
                        className="rounded-full px-2 py-1 text-[10px] font-bold whitespace-nowrap"
                        style={{ color: tone.color, background: tone.background }}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {policySnapshot.fullSent && !policySnapshot.storeConfirmed ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={onAcknowledge}
                disabled={policySnapshot.acknowledged || policySnapshot.clarificationRequested}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: 'var(--primary)' }}
              >
                {policySnapshot.acknowledged
                  ? '\u0042\u1ea1\u006e \u0111\u00e3 \u0078\u00e1\u0063 \u006e\u0068\u1ead\u006e \u006e\u1ed9\u0069 \u0071\u0075\u0079'
                  : '\u0054\u00f4\u0069 \u0111\u00e3 \u0111\u1ecdc \u0076\u00e0 \u0078\u00e1\u0063 \u006e\u0068\u1ead\u006e'}
              </button>
              <button
                type="button"
                onClick={onRequestClarification}
                disabled={policySnapshot.clarificationRequested}
                className="rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: 'white', color: 'var(--text-primary)', borderColor: 'var(--gray-300)' }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <MessageCircleQuestion size={16} />
                  {policySnapshot.clarificationRequested
                    ? '\u0110\u0061\u006e\u0067 \u0063\u0068\u1edd \u0048\u0052 \u0067\u0069\u1ea3\u0069 \u0074\u0068\u00ed\u0063\u0068'
                    : '\u0054\u00f4\u0069 \u0063\u1ea7\u006e \u0048\u0052 \u0067\u0069\u1ea3\u0069 \u0074\u0068\u00ed\u0063\u0068 \u0074\u0068\u00ea\u006d'}
                </span>
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-xl bg-[#FFFDF9] p-3">
              <div className="text-[#6B7280]">
                {'\u004c\u1ea7\u006e \u0067\u1eedi \u0111\u1ea7\u0079 \u0111\u1ee7'}
              </div>
              <div className="mt-1 font-semibold text-[#001D3D]">{formatPolicyTime(policyRecord?.full_sent_at)}</div>
            </div>
            <div className="rounded-xl bg-[#FFFDF9] p-3">
              <div className="text-[#6B7280]">
                {'\u004c\u1ea7\u006e \u0070\u0068\u1ea3\u006e \u0068\u1ed3\u0069 \u0067\u1ea7\u006e \u006e\u0068\u1ea5\u0074'}
              </div>
              <div className="mt-1 font-semibold text-[#001D3D]">
                {formatPolicyTime(policyRecord?.acknowledged_at || policyRecord?.clarification_requested_at)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E1D1] bg-[#FFFDF9] p-3">
            <div className="mb-2 text-xs font-bold text-[#001D3D]">
              {'\u004c\u1ecb\u0063\u0068 \u0073\u1eed \u006e\u1ed9\u0069 \u0071\u0075\u0079'}
            </div>
            <div className="space-y-2">
              {policyRecord?.history.length ? (
                policyRecord.history.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-[#ECE7DA] bg-white p-3">
                    <div className="text-xs font-semibold text-[#001D3D]">{entry.note}</div>
                    <div className="mt-1 text-[11px] text-[#6B7280]">
                      {entry.actor_name} {'\u2022'} {formatPolicyTime(entry.at)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#6B7280]">
                  {'\u0043\u0068\u01b0\u0061 \u0063\u00f3 \u006c\u1ecb\u0063\u0068 \u0073\u1eed \u0078\u1eed \u006c\u00fd\u002e'}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-[#FFFDF9] p-3 text-sm text-[#6B7280]">
          {'\u0048\u0052 \u0063\u0068\u01b0\u0061 \u0067\u1eedi \u006e\u1ed9\u0069 \u0071\u0075\u0079 \u0111\u1ea7\u0079 \u0111\u1ee7\u002e \u0042\u1ea1\u006e \u0063\u0068\u01b0\u0061 \u0063\u1ea7\u006e \u0078\u00e1\u0063 \u006e\u0068\u1ead\u006e \u006c\u00fa\u0063 \u006e\u00e0\u0079\u002e'}
        </div>
      )}
    </section>
  )
}
