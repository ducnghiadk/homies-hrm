'use client'

import { Undo2, Redo2, RotateCcw, FileEdit } from 'lucide-react'

interface EditorToolbarProps {
  canUndo: boolean
  canRedo: boolean
  changeCount: number
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
}

export default function EditorToolbar({
  canUndo, canRedo, changeCount, onUndo, onRedo, onReset
}: EditorToolbarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileEdit size={20} className="text-primary" />
            Điều chỉnh lịch
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Kéo thả các thanh màu để thay đổi ca làm việc
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-gray-50 active:bg-gray-100 border-gray-200 text-gray-700"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 size={16} /> Hoàn tác
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-gray-50 active:bg-gray-100 border-gray-200 text-gray-700"
            title="Làm lại (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} /> Làm lại
          </button>
          <button
            onClick={onReset}
            disabled={changeCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-red-50 active:bg-red-100 border-red-200 text-red-600"
            title="Reset về lịch gốc"
          >
            <RotateCcw size={16} /> Reset
          </button>

          {changeCount > 0 && (
            <div className="ml-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 border border-blue-100">
              <FileEdit size={14} className="inline mr-1" /> Đã sửa: {changeCount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
