import { OptimizationState } from '@/lib/staffing/types';
import TimeRangeSlider from '../shared/TimeRangeSlider';
import TrafficChart from './TrafficChart';
import { ArrowLeft, ArrowRight, SkipForward, BarChart3, Target } from 'lucide-react';
import { getBubbleTeaTemplate } from '@/lib/staffing/traffic-templates';
import { toast } from 'sonner';
import { useState } from 'react';
import TemplateSelector, { TrafficCardRenderer } from '../TemplateSelector';
import { TRAFFIC_TEMPLATES } from '@/lib/staffing/onboarding-templates';

interface Step2Props {
  state: OptimizationState;
  onUpdate: (data: Partial<OptimizationState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Traffic({ state, onUpdate, onNext, onBack }: Step2Props) {
  const { trafficPattern } = state;
  const currentTotal = trafficPattern.reduce((sum, slot) => sum + slot.percentage, 0);
  const isValid = currentTotal === 100;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    trafficPattern.length > 0 ? null : 'bubble_tea'
  );

  const handleTrafficChange = (index: number, newVal: number) => {
    const newPattern = [...trafficPattern];
    newPattern[index] = { ...newPattern[index], percentage: newVal };
    onUpdate({ trafficPattern: newPattern });
  };



  const handleTemplateSelect = (key: string) => {
    setSelectedTemplate(key);
    const tmpl = TRAFFIC_TEMPLATES.find(t => t.key === key);
    if (tmpl?.pattern) {
      // Convert onboarding template to TrafficSlot format
      const hourRanges = [[7,9],[9,11],[11,14],[14,17],[17,21],[21,23]];
      const converted = tmpl.pattern.map((p, i) => ({
        label: p.hours,
        startHour: hourRanges[i]?.[0] ?? 7,
        endHour: hourRanges[i]?.[1] ?? 9,
        percentage: p.percent,
        level: p.level === 'very_low' ? 'low' as const : p.level as 'low' | 'medium' | 'high',
      }));
      onUpdate({ trafficPattern: converted });
      toast.success(`Đã áp dụng mẫu "${tmpl.name}"`);
    }
  };

  const handleSkipWithDefault = () => {
    // Apply bubble tea default and proceed
    const bubbleTea = getBubbleTeaTemplate();
    onUpdate({ trafficPattern: bubbleTea });
    onNext();
  };

  const handleNext = () => {
    if (!isValid) {
        toast.error('Tổng tỷ lệ phải bằng 100%');
        return;
    }
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <BarChart3 size={20} className="text-primary-600" />
          Bước 2/4: Khách đông lúc nào?
        </h2>
        <p className="text-gray-500 text-sm">Ước tính % khách trong mỗi khung giờ (tổng = 100%)</p>
      </div>

      {/* Template Selector Cards */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
          <Target size={14} className="text-primary-600" />
          Chọn mẫu phù hợp với quán:
        </h3>
        <TemplateSelector
          templates={TRAFFIC_TEMPLATES}
          selectedKey={selectedTemplate}
          onSelect={handleTemplateSelect}
          defaultKey="bubble_tea"
          renderCard={(t, isSelected) => TrafficCardRenderer(t, isSelected)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: SLIDERS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">

            <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 px-1">
                    <span>Khung giờ</span>
                    <span>Tỷ lệ %</span>
                </div>
                {trafficPattern.map((slot, index) => (
                    <TimeRangeSlider
                        key={index}
                        label={slot.label}
                        value={slot.percentage}
                        onChange={(val) => handleTrafficChange(index, val)}
                        color={slot.percentage > 20 ? 'bg-warning-500' : slot.percentage > 10 ? 'bg-primary-500' : 'bg-gray-300'}
                    />
                ))}
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-600">Tổng cộng:</span>
                <span className={`text-xl font-bold ${isValid ? 'text-success-600' : 'text-error-500'}`}>
                    {currentTotal}% {isValid && '✓'}
                </span>
            </div>
        </div>

        {/* RIGHT: CHART */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Biểu đồ phân bố</h3>
            <div className="flex-1 flex items-end">
                <TrafficChart data={trafficPattern} />
            </div>
             <p className="text-xs text-gray-400 mt-4 text-center">
                Biểu đồ giúp hình dung giờ cao điểm (cột cao) và giờ thấp điểm.
            </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
        >
            <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleSkipWithDefault}
            className="flex items-center gap-1.5 px-4 py-3 text-gray-400 hover:text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all"
          >
            <SkipForward size={14} /> Dùng mặc định, tiếp →
          </button>
          <button 
              onClick={handleNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  isValid ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
              Tiếp tục <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
