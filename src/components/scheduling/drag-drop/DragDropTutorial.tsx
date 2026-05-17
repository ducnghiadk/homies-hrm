'use client'

import { useState } from 'react'
import { X, ArrowRight, MoveHorizontal, ArrowUpDown, MousePointer, BookOpen, Keyboard } from 'lucide-react'

interface DragDropTutorialProps {
  onClose: () => void
  onDismissPermanent: () => void
}

const STEPS = [
  {
    icon: <MoveHorizontal size={20} />,
    title: 'KÉO NGANG',
    description: 'Đổi giờ bắt đầu/kết thúc của ca',
    visual: '▓▓▓▓▓▓▓▓▓▓▓▓  →  ▓▓▓▓▓▓▓▓▓▓▓▓',
  },
  {
    icon: <ArrowUpDown size={20} />,
    title: 'KÉO MÉP PHẢI',
    description: 'Thay đổi độ dài ca (kéo dài hoặc rút ngắn)',
    visual: '▓▓▓▓▓▓▓▓▓▓▓|←→',
  },
  {
    icon: <ArrowUpDown size={20} />,
    title: 'KÉO DỌC',
    description: 'Chuyển ca sang nhân viên khác',
    visual: '↑ ▓▓▓▓▓ → Người khác ↓',
  },
  {
    icon: <MousePointer size={20} />,
    title: 'BẤM ĐÚP',
    description: 'Mở popup sửa chi tiết (giờ, vị trí, nghỉ giữa ca)',
    visual: 'Double-click → Edit Modal',
  },
]

export default function DragDropTutorial({ onClose, onDismissPermanent }: DragDropTutorialProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleClose = () => {
    if (dontShowAgain) {
      onDismissPermanent()
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" /> Hướng dẫn nhanh <span className="text-xs font-normal text-gray-400">(30 giây)</span>
          </h3>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-5 space-y-4">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl animate-in fade-in slide-in-from-left-4"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900">{step.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{step.description}</div>
                <div className="text-xs text-primary font-mono mt-1.5 bg-primary/5 px-2 py-1 rounded-md inline-block">
                  {step.visual}
                </div>
              </div>
            </div>
          ))}

          {/* Keyboard shortcuts bonus */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1"><Keyboard size={12} /> Phím tắt</div>
            <div className="grid grid-cols-2 gap-1 text-xs text-amber-700">
              <div><kbd className="px-1 bg-white rounded border text-xs">Ctrl+Z</kbd> Hoàn tác</div>
              <div><kbd className="px-1 bg-white rounded border text-xs">Ctrl+Y</kbd> Làm lại</div>
              <div><kbd className="px-1 bg-white rounded border text-xs">←→</kbd> Dời 1 giờ</div>
              <div><kbd className="px-1 bg-white rounded border text-xs">↑↓</kbd> Đổi người</div>
              <div><kbd className="px-1 bg-white rounded border text-xs">Enter</kbd> Sửa chi tiết</div>
              <div><kbd className="px-1 bg-white rounded border text-xs">Del</kbd> Xóa ca</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tutorial-dismiss"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/50"
            />
            <label htmlFor="tutorial-dismiss" className="text-xs text-gray-400 select-none cursor-pointer">
              Không hiện lại
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Bỏ qua
            </button>
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 shadow-sm transition-all"
            >
              Thử ngay <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
