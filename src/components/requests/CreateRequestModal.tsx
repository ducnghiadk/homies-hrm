'use client'

import { useState } from 'react'
import { X, Clock, Calendar, AlertCircle, CheckCircle2, Sparkles, Send } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'

interface CreateRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const REASON_PRESETS: Record<string, string[]> = {
  missed_checkin: [
    'Quên quét mã QR khi vào ca',
    'Quên check-out khi hết ca',
    'Lỗi Wifi quầy thu ngân',
    'Điện thoại hết pin trước giờ về',
    'Lỗi GPS định vị ngoài phạm vi',
    'Tăng ca đột xuất hỗ trợ quầy bar',
  ],
  learning_shift: [
    'Bổ sung ca học việc pha chế',
    'Bổ sung ca học việc thu ngân & order POS',
    'Học việc sơ chế trân châu & thạch BTP',
    'Học quy trình kiểm kê kho nguyên liệu',
  ],
  leave: [
    'Bận việc gia đình đột xuất',
    'Nghỉ ốm / khám sức khỏe',
    'Trùng lịch thi tại trường',
  ],
  shift_swap: [
    'Đổi ca Sáng sang ca Tối',
    'Đổi ca Trưa sang ca Sáng',
    'Nhờ bạn cùng ca trực thay',
  ],
  salary_advance: [
    'Đề nghị tạm ứng chi phí sinh hoạt giữa tháng',
    'Chi phí học tập đột xuất đầu kỳ',
  ],
}

export default function CreateRequestModal({ isOpen, onClose, onSuccess }: CreateRequestModalProps) {
  const { user } = useAuthStore()
  const [type, setType] = useState<'missed_checkin' | 'learning_shift' | 'leave' | 'shift_swap' | 'salary_advance'>('missed_checkin')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [requestedHours, setRequestedHours] = useState<number>(3.5)
  const [amount, setAmount] = useState<number>(1000000)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Vui lòng nhập hoặc chọn lý do')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const typeTitles: Record<string, string> = {
        missed_checkin: 'Giải trình bổ sung chấm công',
        learning_shift: 'Bổ sung ca học việc',
        leave: 'Đơn xin nghỉ phép',
        shift_swap: 'Yêu cầu đổi ca làm việc',
        salary_advance: 'Đề nghị tạm ứng lương',
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: user?.id || 'emp-nv0028',
          employee_name: user?.full_name || 'Nhân sự',
          store_id: user?.store_id || 'store-001',
          type,
          title: typeTitles[type] || 'Yêu cầu nhân sự',
          reason,
          date,
          requested_hours: type === 'missed_checkin' || type === 'learning_shift' ? Number(requestedHours) : undefined,
          amount: type === 'salary_advance' ? Number(amount) : undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Không thể tạo đơn yêu cầu')
      }
    } catch {
      setError('Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPreset = (preset: string) => {
    setReason(preset)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Tạo Đơn Yêu Cầu Mới</h3>
              <p className="text-xs text-gray-500">Gửi giải trình chấm công & đơn từ trực tiếp cho Quản lý</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 border border-red-200 dark:border-red-900">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loại yêu cầu */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Loại Yêu Cầu
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'missed_checkin', label: '⏱️ Bổ sung chấm công' },
                { id: 'learning_shift', label: '🎓 Ca học việc' },
                { id: 'leave', label: '🏖️ Xin nghỉ phép' },
                { id: 'shift_swap', label: '🔄 Đổi ca' },
                { id: 'salary_advance', label: '💵 Tạm ứng lương' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setType(item.id as typeof type)
                    setReason('')
                  }}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition ${
                    type === item.id
                      ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ngày áp dụng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-500" /> Ngày áp dụng
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Số giờ hoặc số tiền */}
            {type === 'salary_advance' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Số tiền tạm ứng (VNĐ)
                </label>
                <input
                  type="number"
                  step="100000"
                  min="100000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-hidden focus:border-amber-500 font-bold"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500" /> Số giờ công đề xuất
                </label>
                <select
                  value={requestedHours}
                  onChange={(e) => setRequestedHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-hidden focus:border-amber-500"
                >
                  <option value={3.0}>3.0 giờ (Ca Cao Điểm)</option>
                  <option value={3.5}>3.5 giờ (Ca Sáng / Dọn quầy)</option>
                  <option value={5.0}>5.0 giờ (Ca Trưa / Ca Tối)</option>
                  <option value={8.0}>8.0 giờ (Full ca kép)</option>
                </select>
              </div>
            )}
          </div>

          {/* Chọn nhanh lý do mẫu (1-Tap Presets) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              ⚡ Gợi ý lý do chuẩn F&B (Nhấn để chọn nhanh):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(REASON_PRESETS[type] || []).map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    reason === preset
                      ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700'
                      : 'bg-gray-100/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-gray-700 hover:border-amber-400'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Nhập lý do chi tiết */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Lý do chi tiết & Giải trình
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do cụ thể gửi Quản lý phê duyệt..."
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-hidden focus:border-amber-500 placeholder-gray-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={14} />
                  <span>Gửi Phê Duyệt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
