import { OptimizationPlan } from '@/lib/staffing/types';
import { Check, Star, AlertTriangle } from 'lucide-react';

interface PlanComparisonTableProps {
  plans: OptimizationPlan[];
  selectedId?: string;
  onSelect: (plan: OptimizationPlan) => void;
}

export default function PlanComparisonTable({ plans, selectedId, onSelect }: PlanComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-medium">
          <tr>
            <th className="p-4 w-1/4">Tiêu chí</th>
            {plans.map(plan => (
              <th key={plan.id} className={`p-4 text-center ${selectedId === plan.id ? 'bg-primary/5 text-primary' : ''}`}>
                <div className="font-bold text-gray-900">{plan.name}</div>
                {plan.badge?.includes('KHUYÊN DÙNG') && (
                    <div className="text-xs text-primary flex items-center justify-center gap-1 mt-1">
                        <Star size={10} fill="currentColor"/> Đề xuất
                    </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="p-4 font-medium text-gray-700">Tổng chi phí/tháng</td>
            {plans.map(plan => (
              <td key={plan.id} className="p-4 text-center">
                <span className="font-bold text-gray-900">{(plan.totalCost / 1000000).toFixed(1)} tr</span>
                {plan.savingsVsA && plan.savingsVsA > 0 ? (
                    <div className="text-xs text-green-600 font-medium mt-1">
                        Tiết kiệm {(plan.savingsVsA / 1000000).toFixed(1)} tr
                    </div>
                ) : null}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4 font-medium text-gray-700">Nhân sự Full-time</td>
            {plans.map(plan => (
              <td key={plan.id} className="p-4 text-center text-gray-600">
                {plan.fulltime.length} người
              </td>
            ))}
          </tr>
          <tr>
             <td className="p-4 font-medium text-gray-700">Nhân sự Part-time</td>
             {plans.map(plan => (
              <td key={plan.id} className="p-4 text-center text-gray-600">
                {plan.parttime.length} người
              </td>
            ))}
          </tr>
          <tr>
             <td className="p-4 font-medium text-gray-700">Độ ổn định</td>
             {plans.map(plan => {
                 const score = plan.fulltime.length / (plan.fulltime.length + plan.parttime.length);
                 return (
                    <td key={plan.id} className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i <= (score * 5) ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            ))}
                        </div>
                    </td>
                 );
             })}
          </tr>
          <tr>
             <td className="p-4 font-medium text-gray-700">Ưu điểm</td>
             {plans.map(plan => (
              <td key={plan.id} className="p-4 align-top">
                <ul className="text-xs text-gray-600 space-y-1">
                    {plan.pros.map((pro, i) => (
                        <li key={i} className="flex gap-1">
                            <Check size={12} className="text-green-500 mt-0.5 shrink-0"/> {pro}
                        </li>
                    ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
             <td className="p-4 font-medium text-gray-700">Nhược điểm</td>
             {plans.map(plan => (
              <td key={plan.id} className="p-4 align-top">
                <ul className="text-xs text-gray-500 space-y-1">
                    {plan.cons.map((con, i) => (
                        <li key={i} className="flex gap-1">
                            <AlertTriangle size={12} className="text-orange-400 mt-0.5 shrink-0"/> {con}
                        </li>
                    ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
