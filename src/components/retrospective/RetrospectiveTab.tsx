'use client'

interface RetrospectiveTabProps {
  storeId?: string
}

export default function RetrospectiveTab({ storeId }: RetrospectiveTabProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
      Tổng kết tuần cho {storeId || 'toàn cửa hàng'} đang được chuẩn bị.
    </div>
  )
}
