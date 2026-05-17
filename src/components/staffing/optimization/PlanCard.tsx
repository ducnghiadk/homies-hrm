import { OptimizationPlan } from '@/lib/staffing/types';
import { ArrowRight, Check, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming generic utility

interface PlanCardProps {
  plan: OptimizationPlan;
  onSelect: (plan: OptimizationPlan) => void;
  onViewDetail: (plan: OptimizationPlan) => void;
}

export default function PlanCard({ plan, onSelect, onViewDetail }: PlanCardProps) {
  const isRecommended = plan.badge?.includes('ĐỀ XUẤT') || plan.badge?.includes('KHUYÊN DÙNG');

  return (
    <div className={cn(
      "border rounded-2xl p-6 relative transition-all duration-300 flex flex-col h-full",
      isRecommended ? "border-primary bg-primary/5 shadow-lg scale-105 z-10" : "border-gray-200 bg-white hover:border-gray-300"
    )}>
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Star size={12} fill="currentColor" /> {plan.badge}
        </div>
      )}
      
      {plan.badge?.includes('TIẾT KIỆM') && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          {plan.badge}
        </div>
      )}

      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
      </div>

      <div className="py-4 border-t border-b border-gray-100 mb-4 flex-1">
        <div className="text-3xl font-bold text-center text-gray-900 mb-1">
          {(plan.totalCost / 1000000).toFixed(1)} <span className="text-sm font-normal text-gray-500">tr/tháng</span>
        </div>
        
        {/* Staff Breakdown */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-white border rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-gray-700">{plan.fulltime.length}</div>
            <div className="text-xs text-gray-500 uppercase font-bold">Full-time</div>
          </div>
          <div className="bg-white border rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-gray-700">{plan.parttime.length}</div>
            <div className="text-xs text-gray-500 uppercase font-bold">Part-time</div>
          </div>
        </div>

        {/* Pros/Cons */}
        <div className="mt-4 space-y-2">
            {plan.pros.slice(0, 2).map((pro, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span>{pro}</span>
                </div>
            ))}
        </div>
      </div>

      <div className="space-y-3 mt-auto">
        <button 
          onClick={() => onViewDetail(plan)}
          className="w-full py-2 text-sm text-gray-500 hover:text-primary transition-colors hover:underline"
        >
          Xem chi tiết
        </button>
        <button 
          onClick={() => onSelect(plan)}
          className={cn(
            "w-full py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2",
            isRecommended 
              ? "bg-primary text-white hover:bg-primary/90 hover:shadow-primary/20" 
              : "bg-gray-900 text-white hover:bg-gray-800"
          )}
        >
          Chọn phương án này
        </button>
      </div>
    </div>
  );
}
