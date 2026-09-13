import { OptimizationState, OptimizationPlan } from '@/lib/staffing/types';
import HourlyDemandChart from './HourlyDemandChart';
import FeaturedPlanCard from '../FeaturedPlanCard';
import { ArrowLeft, Download, ClipboardList, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import ScheduleDetailModal from './ScheduleDetailModal';
import { toast } from 'sonner';

interface Step4Props {
  state: OptimizationState;
  plans: OptimizationPlan[];
  onSelectPlan: (plan: OptimizationPlan) => void;
  onBack: () => void;
}

export default function Step4Results({ state, plans, onSelectPlan, onBack }: Step4Props) {
  const [detailPlan, setDetailPlan] = useState<OptimizationPlan | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(state.selectedPlan);

  const handleSelect = (plan: OptimizationPlan) => {
    setSelectedId(plan.id);
    onSelectPlan(plan);
  };

  const hourlyDemand = plans[0]?.hourlyDemand || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <ClipboardList size={20} className="text-primary-600" />
          Bước 4/4: Kết quả phân tích
        </h2>
        <p className="text-gray-500 text-sm">Chúng tôi đề xuất phương án tối ưu dựa trên traffic của bạn</p>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <BarChart3 size={14} className="text-primary-600" />
                Nhu cầu nhân sự theo giờ
                <span className="text-xs font-normal text-gray-500 bg-primary-50 px-2 py-0.5 rounded-full">Dự báo</span>
             </h3>
             <div className="flex gap-4 text-xs text-gray-500">
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-primary-500 rounded-sm" /> Cần thiết</div>
             </div>
         </div>
         <HourlyDemandChart demand={hourlyDemand} />
      </div>

      {/* Featured Plan + Alternatives + Comparison (Progressive Disclosure) */}
      <FeaturedPlanCard
        plans={plans}
        selectedId={selectedId}
        onSelect={handleSelect}
        onViewDetail={(plan) => setDetailPlan(plan)}
        highlightBestValues={true}
      />

      {/* Navigation — Button Hierarchy */}
      <div className="flex justify-between pt-4">
        {/* GHOST: Back */}
        <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
            <ArrowLeft size={16} /> Quay lại
        </button>
        {/* TERTIARY: Export */}
        <button 
            onClick={() => toast.success('Đang xuất báo cáo PDF...')}
            className="flex items-center gap-2 px-4 py-2 text-primary hover:text-primary/80 text-sm hover:underline transition-colors"
        >
            <Download size={16} /> Xuất báo cáo
        </button>
      </div>

      {/* Detail Modal */}
      {detailPlan && (
        <ScheduleDetailModal 
            plan={detailPlan}
            onClose={() => setDetailPlan(null)}
            onSelect={() => {
                handleSelect(detailPlan);
                setDetailPlan(null);
            }}
        />
      )}
    </div>
  );
}
