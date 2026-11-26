'use client'

import type { ApplicableBucket } from '@/lib/career-path/assessment'
import type { CareerSkillConfig } from '@/lib/career-path/settings'
import { BUCKET_LABEL, SKILL_LEVEL_BADGE, SKILL_LEVEL_LABEL } from './career-ui'

const BUCKET_ORDER: ApplicableBucket[] = ['common', 'main', 'support', 'second', 'advanced']

const DOT: Record<number, string> = {
  0: 'bg-gray-300',
  1: 'bg-amber-400',
  2: 'bg-sky-500',
  3: 'bg-emerald-500',
}

type ApplicableSkill = { skill: CareerSkillConfig; bucket: ApplicableBucket }

interface Props {
  skills: ApplicableSkill[]
  levels: Record<string, { level: number }>
  /** Nhóm mở sẵn khi vào trang. Mặc định: không mở nhóm nào. */
  openBuckets?: ApplicableBucket[]
  /** Ô bên phải mỗi kỹ năng (vd: nút chấm mức). Không truyền thì hiện nhãn mức hiện tại. */
  renderAction?: (code: string) => React.ReactNode
  /** Số kỹ năng đã chọn mức mới trong nhóm (chỉ dùng khi đang chấm). */
  pendingCount?: (bucket: ApplicableBucket) => number
}

/** Danh sách kỹ năng gom theo nhóm, mỗi nhóm gập lại kèm tóm tắt để màn hình gọn. */
export default function SkillGroupList({ skills, levels, openBuckets = [], renderAction, pendingCount }: Props) {
  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
      {BUCKET_ORDER.map((bucket) => {
        const list = skills.filter((s) => s.bucket === bucket)
        if (list.length === 0) return null
        const rated = list.filter(({ skill }) => levels[skill.code]).length
        const pending = pendingCount?.(bucket) || 0
        return (
          <details key={bucket} open={openBuckets.includes(bucket)} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 hover:bg-gray-50/70">
              <span className="text-gray-400 transition group-open:rotate-90">›</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#001D3D]">{BUCKET_LABEL[bucket]}</span>
                <span className="mt-1 flex flex-wrap gap-1" aria-hidden>
                  {list.map(({ skill }) => (
                    <span key={skill.code} className={`h-1.5 w-3 rounded-full ${levels[skill.code] ? DOT[levels[skill.code].level] : 'bg-gray-100'}`} />
                  ))}
                </span>
              </span>
              <span className="shrink-0 text-right text-xs text-gray-500">
                {rated}/{list.length} đã chấm
                {pending > 0 && <span className="block font-semibold text-[#2F6FA8]">+{pending} mức mới</span>}
              </span>
            </summary>
            <ul className="divide-y divide-gray-50 px-3 pb-2">
              {list.map(({ skill }) => {
                const lv = levels[skill.code]
                return (
                  <li key={skill.code} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2">
                    <span className="min-w-0 text-sm text-[#001D3D]" title={skill.standard || undefined}>
                      {skill.name} <span className="text-xs text-gray-400">{skill.code}</span>
                    </span>
                    {renderAction ? (
                      renderAction(skill.code)
                    ) : (
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs ${lv ? SKILL_LEVEL_BADGE[lv.level] : 'bg-gray-50 text-gray-400'}`}>
                        {lv ? SKILL_LEVEL_LABEL[lv.level] : 'Chưa đánh giá'}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </details>
        )
      })}
    </div>
  )
}

/** Chú thích màu mức kỹ năng, đặt cạnh danh sách. */
export function SkillLevelLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
      {[0, 1, 2, 3].map((l) => (
        <span key={l} className="inline-flex items-center gap-1">
          <span className={`h-1.5 w-3 rounded-full ${DOT[l]}`} />
          {SKILL_LEVEL_LABEL[l]}
        </span>
      ))}
    </div>
  )
}
