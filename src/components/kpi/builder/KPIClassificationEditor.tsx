'use client'

import { AlertTriangle, Award, Palette } from 'lucide-react'

export interface KPIClassificationBand {
  code: string
  label: string
  min: number
  max: number
  tone: string
}

export interface KPIClassificationEditorProps {
  grades: KPIClassificationBand[]
  warningThreshold: number
  onUpdateBand(code: string, patch: Partial<KPIClassificationBand>): void
  onUpdateWarningThreshold(value: number): void
}

interface ClassificationIssue {
  code: string
  message: string
}

function getClassificationIssues(grades: KPIClassificationBand[]): ClassificationIssue[] {
  const issues: ClassificationIssue[] = []
  const ordered = [...grades].sort((left, right) => left.min - right.min)

  ordered.forEach((grade, index) => {
    if (grade.max < grade.min) {
      issues.push({ code: grade.code, message: 'Mức trên phải lớn hơn mức dưới.' })
    }

    const nextGrade = ordered[index + 1]
    if (!nextGrade) return

    if (grade.max >= nextGrade.min) {
      issues.push({ code: grade.code, message: 'Khoảng điểm bị chồng lấn với mức kế tiếp.' })
    }

    if (nextGrade.min - grade.max > 0.0001) {
      issues.push({ code: grade.code, message: 'Khoảng điểm bị ngắt quãng, cần liền mạch.' })
    }
  })

  return issues
}

const TONE_STYLES: Record<string, { bg: string; text: string; badge: string }> = {
  emerald: { bg: 'bg-emerald-50/60 border-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
  sky: { bg: 'bg-sky-50/60 border-sky-100', text: 'text-sky-800', badge: 'bg-sky-100 text-sky-800' },
  slate: { bg: 'bg-gray-50/60 border-gray-100', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-800' },
  amber: { bg: 'bg-amber-50/60 border-amber-100', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800' },
  red: { bg: 'bg-rose-50/60 border-rose-100', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800' },
}

export function KPIClassificationEditor({
  grades,
  warningThreshold,
  onUpdateBand,
  onUpdateWarningThreshold,
}: KPIClassificationEditorProps) {
  const issues = getClassificationIssues(grades)

  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-gray-50/50">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Khung xếp loại</p>
          <h3 className="mt-0.5 text-base font-bold text-[#001D3D]">Thang điểm đánh giá (A / B / C / D)</h3>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2F6FA8]">
          <Award size={13} />
          Thang điểm 1 - 5
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Warning Threshold setting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3.5">
          <div>
            <p className="text-xs font-bold text-amber-900">Mốc điểm kích hoạt kèm cặp / Đào tạo lại</p>
            <p className="mt-0.5 text-[11px] text-amber-700">
              Nhân viên dưới mức này sẽ được hệ thống gợi ý kèm thêm ca, không trừ thẳng vào kỷ luật.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-800 font-medium">Ngưỡng:</span>
            <input
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={warningThreshold}
              onChange={(event) => onUpdateWarningThreshold(Number(event.target.value))}
              className="h-8 w-18 rounded-lg border border-amber-200 bg-white px-2 text-center text-xs font-mono font-bold tabular-nums text-[#001D3D] outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Grade Bands */}
        <div className="space-y-2.5">
          {grades.map((grade) => {
            const issue = issues.find((item) => item.code === grade.code)
            const style = TONE_STYLES[grade.tone] || TONE_STYLES.slate

            return (
              <article
                key={grade.code}
                className={`rounded-xl border p-3 transition-all ${style.bg}`}
              >
                <div className="grid gap-2.5 sm:grid-cols-[100px_minmax(0,1fr)_90px_90px]">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Mã bậc</span>
                    <input
                      value={grade.code}
                      onChange={(event) => onUpdateBand(grade.code, { code: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold font-mono text-[#001D3D] outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Tên hiển thị</span>
                    <input
                      value={grade.label}
                      onChange={(event) => onUpdateBand(grade.code, { label: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#001D3D] outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Điểm tối thiểu</span>
                    <input
                      type="number"
                      step={0.1}
                      min={1}
                      max={5}
                      value={grade.min}
                      onChange={(event) => onUpdateBand(grade.code, { min: Number(event.target.value) })}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-mono font-bold tabular-nums text-center text-[#001D3D] outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Điểm tối đa</span>
                    <input
                      type="number"
                      step={0.1}
                      min={1}
                      max={5}
                      value={grade.max}
                      onChange={(event) => onUpdateBand(grade.code, { max: Number(event.target.value) })}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-mono font-bold tabular-nums text-center text-[#001D3D] outline-none"
                    />
                  </div>
                </div>

                {issue && (
                  <p className="mt-2 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {issue.message}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
