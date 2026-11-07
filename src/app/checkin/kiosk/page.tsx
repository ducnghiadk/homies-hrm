'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ShieldCheck, RefreshCw, MapPin, Clock, Smartphone, AlertCircle } from 'lucide-react'

export default function CheckinKioskPage() {
  const [storeId, setStoreId] = useState('store-001')
  const [tokenData, setTokenData] = useState<{
    token: string
    store_name: string
    generated_at: number
    expires_in_seconds: number
  } | null>(null)
  const [countdown, setCountdown] = useState(30)
  const [loading, setLoading] = useState(false)

  // Fetch token mới
  async function fetchToken(targetStoreId: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/attendance/qr-token?store_id=${targetStoreId}`)
      const json = await res.json()
      if (json.success) {
        setTokenData(json)
        setCountdown(30)
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchToken(storeId)
  }, [storeId])

  // Đếm ngược 30 giây và tự động làm mới
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchToken(storeId)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [storeId])

  const qrImageUrl = tokenData?.token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
        tokenData.token
      )}&margin=10`
    : ''

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 font-['Inter']">
      {/* Header */}
      <header className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
            H
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Poppins']">Kiosk Chấm Công Thông Minh</h1>
            <p className="text-xs text-slate-400">Hệ thống Homies Milk Tea • Chống Gian Lận Hai Lớp (Dual-Verification)</p>
          </div>
        </div>

        {/* Chọn chi nhánh */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={storeId === 'store-001' ? 'primary' : 'outline'}
            onClick={() => setStoreId('store-001')}
            className="text-xs h-9"
          >
            Hồ Bá Phấn
          </Button>
          <Button
            size="sm"
            variant={storeId === 'store-002' ? 'primary' : 'outline'}
            onClick={() => setStoreId('store-002')}
            className="text-xs h-9"
          >
            Đường 429
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center my-6 max-w-xl w-full mx-auto">
        <Card className="w-full bg-slate-800/90 border-slate-700 p-8 rounded-3xl shadow-2xl backdrop-blur text-center flex flex-col items-center">
          {/* Badge Store */}
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-slate-200">
              {tokenData?.store_name || (storeId === 'store-001' ? 'Homies Hồ Bá Phấn' : 'Homies Đường 429')}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="relative p-4 bg-white rounded-2xl shadow-inner mb-6 flex items-center justify-center">
            {qrImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrImageUrl}
                alt="Dynamic QR Code"
                width={260}
                height={260}
                className="rounded-xl"
              />
            ) : (
              <div className="w-[260px] h-[260px] flex items-center justify-center text-slate-400 text-xs">
                Đang tạo mã QR...
              </div>
            )}

            {/* Corner Markers */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-600" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-600" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-600" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-600" />
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-3 mb-6 bg-slate-900/60 px-4 py-2.5 rounded-2xl border border-slate-700/60">
            <RefreshCw size={16} className={`text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs text-slate-300">
              Tự đổi mã mới sau: <strong className="text-emerald-400 font-mono text-sm">{countdown}s</strong>
            </span>
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-1000"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Hướng dẫn an toàn */}
          <div className="space-y-2 text-left w-full bg-slate-900/40 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
            <div className="flex items-start gap-2 text-emerald-400 font-semibold mb-1">
              <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />
              <span>Cơ chế bảo vệ kép chống gian lận (Dual-Verification):</span>
            </div>
            <div className="flex items-start gap-2 text-slate-400">
              <Clock size={14} className="flex-shrink-0 mt-0.5" />
              <span>Mã QR đổi liên tục mỗi 30s. Mã chụp lại gửi qua Zalo sau 60s sẽ tự hết hạn.</span>
            </div>
            <div className="flex items-start gap-2 text-slate-400">
              <MapPin size={14} className="flex-shrink-0 mt-0.5" />
              <span>Hệ thống bắt buộc đối soát GPS. Nếu đứng cách quán &gt; 100m sẽ bị từ chối chấm công.</span>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-2">
        Homies Milk Tea HRM • Kiosk Mode • Cập nhật trực tiếp máy chủ
      </footer>
    </div>
  )
}
