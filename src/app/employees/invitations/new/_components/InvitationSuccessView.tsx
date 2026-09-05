'use client'

import { ArrowLeft, ArrowRight, CheckCircle, User, UserPlus, Users } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { mockPositions, mockStores } from '@/lib/mock-data'
import type { CreatedInvitationState, InvitationFormData } from './invitation-types'

interface InvitationSuccessViewProps {
  createdInvitation: CreatedInvitationState
  form: InvitationFormData
  onBack: () => void
  onOpenList: () => void
  onCreateAnother: () => void
}

export function InvitationSuccessView({
  createdInvitation,
  form,
  onBack,
  onOpenList,
  onCreateAnother,
}: InvitationSuccessViewProps) {
  const storeName = mockStores.find((store) => store.id === form.store_id)?.name.replace('Homies Milk Tea - ', '') || form.store_id
  const positionName = mockPositions.find((position) => position.id === form.position_id)?.name || form.position_id

  return (
    <AppShell>
      <div className="animate-scale-in">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-primary-500 mb-4 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-50">
            <CheckCircle size={40} className="text-green-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {createdInvitation.status === 'draft'
              ? 'Đã lưu lời mời ở trạng thái nháp'
              : createdInvitation.send_status === 'sent_success'
                ? 'Đã tạo và gửi lời mời thành công!'
                : 'Đã tạo lời mời, nhưng gửi email chưa thành công'}
          </h2>

          <div className="bg-vanilla-50 rounded-xl p-4 text-left mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <User size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{createdInvitation.full_name}</p>
                <p className="text-sm text-gray-500">{createdInvitation.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-gray-500 text-xs">Ngày gia nhập</p>
                <p className="font-medium text-gray-900">{form.hire_date}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-gray-500 text-xs">Cửa hàng</p>
                <p className="font-medium text-gray-900">{storeName}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-gray-500 text-xs">Vị trí</p>
                <p className="font-medium text-gray-900">{positionName}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-gray-500 text-xs">Bộ phận</p>
                <p className="font-medium text-gray-900">{form.department_name}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-gray-500 text-xs">Lương chính thức</p>
                <p className="font-medium text-gray-900">{Number(form.official_salary || 0).toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-gray-500 text-xs">Thử việc</p>
                <p className="font-medium text-gray-900">{form.is_probationary ? 'Có' : 'Không'}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 col-span-2">
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-medium text-gray-900">{createdInvitation.email}</p>
              </div>
            </div>
          </div>

          {createdInvitation.status === 'draft' ? (
            <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left">
              <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <ArrowRight size={16} /> Trạng thái hiện tại
              </p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Lời mời đã được lưu nhưng chưa gửi email cho ứng viên</li>
                <li>• Vào danh sách lời mời để kiểm tra lại preview rồi bấm gửi khi sẵn sàng</li>
              </ul>
            </div>
          ) : createdInvitation.send_status === 'sent_success' ? (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <ArrowRight size={16} /> Bước tiếp theo
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ứng viên đã có thể mở link và tự điền hồ sơ</li>
                <li>• Theo dõi tab Chờ duyệt khi ứng viên hoàn tất thông tin</li>
                <li>• Duyệt hoặc yêu cầu bổ sung trước khi tạo nhân viên chính thức</li>
              </ul>
            </div>
          ) : (
            <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
              <p className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <ArrowRight size={16} /> Cần xử lý tiếp
              </p>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Lời mời đã được tạo nhưng email chưa gửi được</li>
                <li>• Vào danh sách lời mời để kiểm tra lỗi và bấm gửi lại</li>
                {createdInvitation.last_send_error && (
                  <li>• Lý do gần nhất: {createdInvitation.last_send_error}</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={onOpenList}
              className="w-full py-3 px-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Users size={18} /> Về danh sách lời mời
            </button>
            <button
              onClick={onCreateAnother}
              className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-vanilla-50 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus size={18} /> Tạo lời mời khác
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
