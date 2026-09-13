'use client'

import { BarChart3, Pencil, Users } from 'lucide-react'
import { mockPositions, mockShifts } from '@/lib/mock-data'
import { staffingRequirements } from '@/lib/mock-data-staffing'

const positions = mockPositions.filter((position) =>
  ['pos-001', 'pos-002', 'pos-004'].includes(position.id)
)

function getReqCount(storeId: string, shiftId: string, posId: string) {
  const requirement = staffingRequirements.find(
    (item) => item.store_id === storeId && item.shift_id === shiftId && item.position_id === posId
  )

  return requirement?.required_count || 0
}

export function StaffingSectionView({
  selectedStore,
  onEdit,
}: {
  selectedStore: string
  onEdit: () => void
}) {
  const perShift = mockShifts.map((shift) => ({
    ...shift,
    total: positions.reduce((sum, position) => sum + getReqCount(selectedStore, shift.id, position.id), 0),
  }))

  const totalPerDay = perShift.reduce((sum, shift) => sum + shift.total, 0)
  const busiestShift = perShift.reduce((max, shift) => shift.total > max.total ? shift : max, perShift[0])
  const lightestShift = perShift.reduce((min, shift) => shift.total < min.total ? shift : min, perShift[0])

  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <Users size={20} />
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 font-bold text-gray-800">
              <BarChart3 size={16} className="text-primary-600" />
              Dinh bien co ban
            </h3>
            <p className="text-xs text-gray-500">Tra loi cau hoi moi ca toi thieu can bao nhieu nguoi.</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
        >
          <Pencil size={12} />
          Sua
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tong nhan su / ngay</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{totalPerDay}</div>
          <p className="mt-1 text-xs text-gray-500">Tong so nguoi can phu khi chay du 3 ca.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Ca can nhieu nhat</div>
          <div className="mt-2 text-lg font-bold text-gray-900">{busiestShift.name}</div>
          <p className="mt-1 text-xs text-amber-700">{busiestShift.total} nguoi · {busiestShift.start_time} - {busiestShift.end_time}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Ca nhe nhat</div>
          <div className="mt-2 text-lg font-bold text-gray-900">{lightestShift.name}</div>
          <p className="mt-1 text-xs text-emerald-700">{lightestShift.total} nguoi · {lightestShift.start_time} - {lightestShift.end_time}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-vanilla-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Doc nhanh</div>
        <p className="mt-2 text-sm text-gray-600">
          Neu ca toi da cham nguong cao nhat, manager nen uu tien bo tri truong ca va pha che truoc.
          Neu ca sang dang thap hon, co the bo tri nhan su linh hoat hoac part-time de toi uu chi phi.
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {positions.map((position) => (
            <span key={position.id} className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-600 shadow-sm">
              {position.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function StaffingSectionEdit({
  selectedStore,
  onReqChange,
}: {
  selectedStore: string
  onReqChange: (shiftId: string, posId: string, val: number) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Thiet lap so nguoi toi thieu cho moi vai tro trong tung ca. Nen nhap theo muc can de van hanh on dinh,
        khong phai muc ly tuong de tranh doi chi phi qua muc.
      </p>

      <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-700">
        Goi y: bat dau tu vai tro bat buoc truoc, sau do moi cong them nguoi cho ca dong khach.
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-vanilla-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">Ca</th>
              {positions.map((position) => (
                <th key={position.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500">
                  {position.name}
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">Tong</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockShifts.map((shift) => {
              const total = positions.reduce((sum, position) => sum + getReqCount(selectedStore, shift.id, position.id), 0)

              return (
                <tr key={shift.id} className="hover:bg-vanilla-50/60">
                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-700">{shift.name}</div>
                    <div className="text-xs text-gray-400">{shift.start_time} - {shift.end_time}</div>
                  </td>
                  {positions.map((position) => (
                    <td key={position.id} className="px-3 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        className="w-14 rounded-lg border border-gray-200 p-1.5 text-center text-sm font-medium transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={getReqCount(selectedStore, shift.id, position.id)}
                        onChange={(event) => onReqChange(shift.id, position.id, parseInt(event.target.value, 10) || 0)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {total}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
