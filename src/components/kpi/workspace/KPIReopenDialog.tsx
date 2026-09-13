'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import EditDrawer from '@/components/ui/EditDrawer'

interface KPIReopenDialogProps {
  isOpen: boolean
  isSaving?: boolean
  onClose: () => void
  onApprove: (reason: string) => void
}

export default function KPIReopenDialog({
  isOpen,
  isSaving = false,
  onClose,
  onApprove,
}: KPIReopenDialogProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const timer = window.setTimeout(() => {
      setReason('')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isOpen])

  return (
    <EditDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="CEO duyet mo lai ky KPI"
      size="md"
      onSave={() => onApprove(reason)}
      isSaving={isSaving}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-2 text-amber-700">
              <RotateCcw size={16} />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-800">Mo lai chi dung khi can doi soat that su</div>
              <p className="mt-1 text-xs text-amber-800">Sau khi mo lai, ky se quay ve buoc leader cham de bo sung du lieu, bang chung hoac dieu chinh lon.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-gray-700">Ly do mo lai</label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={5}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#2F6FA8]"
            placeholder="VD: Can bo sung bang chung vi pham, thieu xac nhan POS, sai nguon attendance..."
          />
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 text-rose-700" />
            <p className="text-[11px] font-medium text-rose-700">
              Hanh dong nay phai duoc CEO phe duyet. Tat ca ly do mo lai se duoc ghi vao audit log.
            </p>
          </div>
        </div>
      </div>
    </EditDrawer>
  )
}
