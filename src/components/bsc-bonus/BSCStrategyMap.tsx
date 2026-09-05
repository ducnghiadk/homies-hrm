import React from 'react'
import {
  TrendingUp,
  Package,
  Users,
  ArrowDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'

interface BSCStrategyMapProps {
  storeId?: string
  period?: string
}

export default function BSCStrategyMap({ storeId = 'store-001', period = '2026-07' }: BSCStrategyMapProps) {
  const [actualRevenueMonthly, setActualRevenueMonthly] = React.useState(255440000)

  React.useEffect(() => {
    let isMounted = true
    async function loadTarget() {
      const targets = await bscAdapter.getRevenueTargets(storeId, period)
      const found = targets.find(t => t.store_id === storeId && t.period === period)
      if (isMounted && found) {
        setActualRevenueMonthly(found.actual_revenue_monthly)
      }
    }
    loadTarget()
    return () => { isMounted = false }
  }, [storeId, period])

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="card p-6 rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white via-gray-50/50 to-white shadow-2xs space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Bản Đồ Chiến Lược BSC SaaS (BSC Strategy Map Visualizer)
            </h3>
            <p className="text-xs text-gray-500">
              Biểu đồ trực quan hóa mối quan hệ nguyên nhân – kết quả giữa 4 khía cạnh vận hành chuỗi Homies
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-2xs">
          Mô Hình BSC Norton & Kaplan
        </span>
      </div>

      {/* STRATEGY MAP CASCADING FLOW (TOP TO BOTTOM) */}
      <div className="space-y-4 relative">
        {/* LEVEL 1: KHÍA CẠNH TÀI CHÍNH (FINANCIAL PERSPECTIVE) */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-primary">
                1. Khía Cạnh Tài Chính (Financial Perspective — Trọng số 40%)
              </h4>
            </div>
            <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded">
              MỤC TIÊU TỐI THƯỢNG
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-1">
              <span className="font-bold text-gray-800">Doanh Thu Thuần Tháng</span>
              <div className="text-base font-black text-primary">
                {formatVnd(actualRevenueMonthly)}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block">
                Đạt 102.4% Target (Mở thưởng Quỹ 1%)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-1">
              <span className="font-bold text-gray-800">Kiểm Soát Tỷ Lệ Hao Hụt (COGS)</span>
              <div className="text-base font-black text-emerald-600">2.5%</div>
              <span className="text-[10px] text-gray-500 font-semibold block">
                Định mức 85tr đ vs Thực tế 87.1tr đ (Thang 4/5đ)
              </span>
            </div>
          </div>
        </div>

        {/* CONNECTOR ARROW 1 */}
        <div className="flex justify-center text-primary/60">
          <ArrowDown size={18} className="animate-bounce" />
        </div>

        {/* LEVEL 2: KHÍA CẠNH KHÁCH HÀNG (CUSTOMER PERSPECTIVE) */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-amber-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                2. Khía Cạnh Khách Hàng (Customer Perspective — Trọng số 15%)
              </h4>
            </div>
            <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded">
              TẠO DOANH THU LẮP ĐẦU
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-white border border-amber-100 shadow-2xs space-y-1">
              <span className="font-bold text-gray-800">Điểm Khảo Sát QR Cửa Hàng</span>
              <div className="text-base font-black text-amber-900">85 / 100 điểm</div>
              <span className="text-[10px] text-emerald-600 font-bold block">
                Đánh giá chất lượng nước & phục vụ tốt
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-100 shadow-2xs space-y-1">
              <span className="font-bold text-gray-800">An Toàn Vệ Sinh Thực Phẩm (ATTP)</span>
              <div className="text-base font-black text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={16} /> KHÔNG VI PHẠM
              </div>
              <span className="text-[10px] text-gray-500 font-semibold block">
                Không có dị vật / Không hạ ép 1đ
              </span>
            </div>
          </div>
        </div>

        {/* CONNECTOR ARROW 2 */}
        <div className="flex justify-center text-amber-700/60">
          <ArrowDown size={18} className="animate-bounce" />
        </div>

        {/* LEVEL 3: KHÍA CẠNH QUY TRÌNH NỘI BỘ (INTERNAL PROCESS PERSPECTIVE) */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-emerald-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                3. Khía Cạnh Quy Trình Nội Bộ (Internal Operations — Trọng số 25%)
              </h4>
            </div>
            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
              VẬN HÀNH CHUẨN CA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-1">
              <span className="font-bold text-gray-800">Checklist Mở / Đóng Ca</span>
              <div className="text-sm font-black text-emerald-700">100% Hoàn Thành</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-1">
              <span className="font-bold text-gray-800">Điểm Lỗi Vận Hành Ca</span>
              <div className="text-sm font-black text-emerald-700">Trừ 2 điểm lỗi</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-1">
              <span className="font-bold text-gray-800">Đóng Gói & Giao Đơn</span>
              <div className="text-sm font-black text-emerald-700">0 Lỗi Rò Rỉ</div>
            </div>
          </div>
        </div>

        {/* CONNECTOR ARROW 3 */}
        <div className="flex justify-center text-emerald-700/60">
          <ArrowDown size={18} className="animate-bounce" />
        </div>

        {/* LEVEL 4: KHÍA CẠNH ĐÀO TẠO & PHÁT TRIỂN (LEARNING & GROWTH) */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                4. Khía Cạnh Nhân Sự & Tác Phong (Learning & Growth)
              </h4>
            </div>
            <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">
              NỀN TẢNG CON NGƯỜI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-1">
              <span className="font-bold text-gray-800">Mốc Giờ Làm Tối Thiểu (110h)</span>
              <div className="text-sm font-black text-indigo-900">100% Nhân Viên Đạt</div>
              <span className="text-[10px] text-gray-500 font-semibold block">Duy trì định biên tối đa</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-1">
              <span className="font-bold text-gray-800">Ý Thức Chấm Công & Tác Phong</span>
              <div className="text-sm font-black text-indigo-900">98% Chuẩn Giờ</div>
              <span className="text-[10px] text-gray-500 font-semibold block">Hệ số lỗi cá nhân thấp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
