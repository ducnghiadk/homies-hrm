'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Check, Eraser, PenLine, ShieldCheck, X } from 'lucide-react'

interface SignaturePadModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (signatureDataUrl: string) => void
  signerName: string
  signerRole: 'employee' | 'hr'
  contractCode?: string
}

export default function SignaturePadModal({
  isOpen,
  onClose,
  onConfirm,
  signerName,
  signerRole,
  contractCode,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // Cấu hình kích thước và scale canvas theo devicePixelRatio để nét vẽ luôn sắc nét
  const initCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = '#001D3D' // Deep Navy
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    setHasDrawn(false)
  }

  useEffect(() => {
    if (isOpen) {
      // Delay nhỏ để modal render xong kích thước thật
      const timer = setTimeout(() => {
        initCanvas()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    if ('clientX' in e) {
      return {
        x: (e as MouseEvent | React.MouseEvent).clientX - rect.left,
        y: (e as MouseEvent | React.MouseEvent).clientY - rect.top,
      }
    }
    return { x: 0, y: 0 }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.nativeEvent)
    setIsDrawing(true)
    setLastPoint(coords)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentPoint = getCanvasCoords(e.nativeEvent)

    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(currentPoint.x, currentPoint.y)
    ctx.stroke()

    setLastPoint(currentPoint)
    setHasDrawn(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setLastPoint(null)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHasDrawn(false)
  }

  const handleSave = () => {
    if (!hasDrawn) return
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    onConfirm(dataUrl)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-[#2F6FA8]">
              <PenLine size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D]">Ký điện tử bằng ngón tay</h3>
              <p className="text-xs text-slate-500">
                {contractCode ? `Hợp đồng: ${contractCode} • ` : ''}
                {signerRole === 'employee' ? 'Nhân sự' : 'Đại diện HR'}: <span className="font-semibold text-slate-800">{signerName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <ShieldCheck size={14} className="text-emerald-600" />
              Chữ ký sẽ được lưu vào hồ sơ pháp lý hợp đồng
            </span>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasDrawn}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40 disabled:hover:text-rose-600"
            >
              <Eraser size={13} />
              Ký lại
            </button>
          </div>

          {/* Vùng Canvas ký cảm ứng */}
          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
              style={{ touchAction: 'none' }}
              className="h-48 w-full cursor-crosshair"
            />

            {/* Hướng dẫn mờ khi chưa vẽ */}
            {!hasDrawn && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <PenLine size={28} className="mb-1 opacity-40" />
                <p className="text-xs font-medium">Dùng ngón tay hoặc bút cảm ứng ký vào đây</p>
                <div className="mt-4 w-48 border-b border-slate-300/80" />
                <p className="mt-1 text-[11px] text-slate-400">Vạch ký tên</p>
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            Bằng việc xác nhận ký, bạn xác nhận đã đọc, hiểu rõ các điều khoản và đồng ý chịu trách nhiệm pháp lý với chữ ký này.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-4 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] disabled:opacity-40 disabled:hover:bg-[#2F6FA8] transition shadow-xs"
          >
            <Check size={14} />
            Xác nhận ký
          </button>
        </div>
      </div>
    </div>
  )
}
