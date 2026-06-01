'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, AlertCircle, Sparkles, Lightbulb } from 'lucide-react'
import type { ValidationResult, ValidationItem } from '@/lib/scheduling/drag-drop-validation'

interface WarningPanelProps {
  validation: ValidationResult
  onApplyFix: (fixedShifts: ReturnType<NonNullable<ValidationItem['autoFix']>>) => void
}

export default function WarningPanel({ validation, onApplyFix }: WarningPanelProps) {
  const [previewFix, setPreviewFix] = useState<{ item: ValidationItem; preview: ReturnType<NonNullable<ValidationItem['autoFix']>> } | null>(null)

  const handleShowPreview = (item: ValidationItem) => {
    if (!item.autoFix) return
    const result = item.autoFix()
    setPreviewFix({ item, preview: result })
  }

  const handleApplyFix = () => {
    if (!previewFix) return
    onApplyFix(previewFix.preview)
    setPreviewFix(null)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-3 bg-gray-50 border-b font-bold text-sm text-gray-700 flex items-center gap-2">
        <AlertTriangle size={16} className="text-warning-600" /> Kiểm tra & Cảnh báo
      </div>

      <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto">
        {/* Errors */}
        {validation.errors.length > 0 && (
          <div>
            <div className="text-xs font-bold text-error-600 flex items-center gap-1 mb-2">
              <AlertCircle size={14} /> LỖI ({validation.errors.length})
            </div>
            <div className="space-y-2">
              {validation.errors.map(err => (
                <div key={err.id} className="bg-error-50 border border-error-200 rounded-lg p-3">
                  <div className="text-xs font-medium text-error-800">• {err.message}</div>
                  {err.suggestion && (
                    <div className="text-xs text-error-600 mt-1 flex items-start gap-1">
                      <Lightbulb size={11} className="inline shrink-0 mt-0.5" /> {err.suggestion}
                    </div>
                  )}
                  {err.autoFix && (
                    <button
                      onClick={() => handleShowPreview(err)}
                      className="mt-2 flex items-center gap-1 px-2.5 py-1 text-xs font-bold
                        bg-white border border-error-300 text-error-700 rounded-md
                        hover:bg-error-100 transition-colors"
                    >
                      <Sparkles size={12} /> Áp dụng gợi ý
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div>
            <div className="text-xs font-bold text-warning-600 flex items-center gap-1 mb-2">
              <AlertTriangle size={14} /> CẢNH BÁO ({validation.warnings.length})
            </div>
            <div className="space-y-2">
              {validation.warnings.map(w => (
                <div key={w.id} className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                  <div className="text-xs font-medium text-warning-800">• {w.message}</div>
                  {w.suggestion && (
                    <div className="text-xs text-warning-600 mt-1 flex items-center gap-1"><Lightbulb size={11} /> {w.suggestion}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passed */}
        {validation.passed.length > 0 && (
          <div>
            <div className="text-xs font-bold text-success-600 flex items-center gap-1 mb-2">
              <CheckCircle2 size={14} /> ĐÃ ĐẠT ({validation.passed.length})
            </div>
            <div className="space-y-1">
              {validation.passed.map(p => (
                <div key={p.id} className="text-xs text-success-700 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-success-500" /> {p.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All clear */}
        {validation.errors.length === 0 && validation.warnings.length === 0 && (
          <div className="text-center py-4 text-success-600">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-success-400" />
            <div className="text-sm font-bold">Không có vấn đề!</div>
          </div>
        )}
      </div>

      {/* Auto-fix Preview Popup */}
      {previewFix && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPreviewFix(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-4 shadow-xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={16} className="text-primary" /> Xem trước thay đổi
            </h4>
            <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-700 space-y-1">
              <div className="font-medium text-gray-900">{previewFix.item.message}</div>
              <div className="text-primary">→ {previewFix.item.suggestion}</div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setPreviewFix(null)}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleApplyFix}
                className="flex-1 px-3 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
