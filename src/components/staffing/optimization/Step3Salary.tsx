import { OptimizationState, SalaryConfig } from '@/lib/staffing/types';
import SalaryInput from '../shared/SalaryInput';
import { ArrowLeft, ArrowRight, SkipForward, DollarSign, Building2 } from 'lucide-react';
import { getHCMSalaryDefaults, getHanoiSalaryDefaults } from '@/lib/staffing/salary-templates';
import { validateSalaryConfig } from '@/lib/staffing/validators';
import { toast } from 'sonner';
import { useState } from 'react';
import TemplateSelector, { SalaryCardRenderer } from '../TemplateSelector';
import { SALARY_TEMPLATES } from '@/lib/staffing/onboarding-templates';

interface Step3Props {
  state: OptimizationState;
  onUpdate: (data: Partial<OptimizationState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Salary({ state, onUpdate, onNext, onBack }: Step3Props) {
  const { salaryConfig, includeBHXH } = state;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    salaryConfig.length > 0 ? null : 'hcm'
  );

  const handleSalaryChange = (index: number, newVal: number) => {
    const newConfig = [...salaryConfig];
    newConfig[index] = { ...newConfig[index], amount: newVal };
    onUpdate({ salaryConfig: newConfig });
  };

  const applyTemplate = (type: 'hcm' | 'hanoi') => {
    const template = type === 'hcm' ? getHCMSalaryDefaults() : getHanoiSalaryDefaults();
    onUpdate({ salaryConfig: template });
    toast.success(`Đã áp dụng mức lương ${type.toUpperCase()}`);
  };

  const handleTemplateSelect = (key: string) => {
    setSelectedTemplate(key);
    if (key === 'hcm') {
      applyTemplate('hcm');
    } else if (key === 'hanoi') {
      applyTemplate('hanoi');
    } else if (key === 'province') {
      // Use province data from onboarding templates
      const tmpl = SALARY_TEMPLATES.find(t => t.key === 'province');
      if (tmpl) {
        const config: SalaryConfig[] = tmpl.salaries.flatMap(s => {
          const items: SalaryConfig[] = [{
            positionId: s.position,
            positionName: s.label,
            type: 'fullTime',
            amount: s.ft,
          }];
          if (s.pt !== null) {
            items.push({
              positionId: s.position,
              positionName: s.label,
              type: 'partTime',
              amount: s.pt,
            });
          }
          return items;
        });
        onUpdate({ salaryConfig: config });
        toast.success('Đã áp dụng mức lương Tỉnh');
      }
    }
    // 'custom' = do nothing, let user fill in
  };

  const handleSkipWithDefault = () => {
    applyTemplate('hcm');
    onNext();
  };

  const handleNext = () => {
    const validation = validateSalaryConfig(salaryConfig);
    if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
    }
    onNext();
  };

  // Group by Position Name to simpler UI
  // But our config is flat array. We need to render it carefully.
  // Let's assume standard order or render as list.
  
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <DollarSign size={20} className="text-emerald-600" />
          Bước 3/4: Mức lương tại quán
        </h2>
        <p className="text-gray-500 text-sm">Nhập mức lương bạn đang trả hoặc dự định trả</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
         {/* Template Selector Cards */}
         <div>
           <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
             <Building2 size={14} className="text-primary-600" />
             Chọn khu vực để áp dụng mức lương:
           </h3>
           <TemplateSelector
             templates={SALARY_TEMPLATES}
             selectedKey={selectedTemplate}
             onSelect={handleTemplateSelect}
             defaultKey="hcm"
             renderCard={(t, isSelected) => SalaryCardRenderer(t, isSelected)}
           />
         </div>

         <div className="space-y-4">
             <div className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-4 text-xs font-bold text-gray-400 px-2">
                 <div>Vị trí</div>
                 <div>Full-time (tháng)</div>
                 <div>Part-time (giờ)</div>
             </div>
             
             {/* We manually group based on knowledge of templates: Barista, Cashier, Helper */}
             {/* A generic renderer is safer */}
             {['Pha chế', 'Thu ngân', 'Phụ việc', 'Quản lý'].map((role) => {
                 const ft = salaryConfig.find(c => c.positionName.includes(role) && c.type === 'fullTime');
                 const pt = salaryConfig.find(c => c.positionName.includes(role) && c.type === 'partTime');
                 
                 // If role doesn't exist in config, skip
                 if (!ft && !pt) return null;

                 return (
                     <div key={role} className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-4 items-center py-2 border-b border-gray-50 last:border-0">
                         <div className="font-medium text-gray-700">{role} {role === 'Pha chế' ? 'chính' : ''}</div>
                         <div>
                             {ft ? (
                                 <SalaryInput 
                                    value={ft.amount} 
                                    onChange={(v) => handleSalaryChange(salaryConfig.indexOf(ft), v)} 
                                 />
                             ) : <span className="text-gray-300 text-xs italic opacity-0">-</span>}
                         </div>
                         <div>
                             {pt ? (
                                 <SalaryInput 
                                    value={pt.amount} 
                                    onChange={(v) => handleSalaryChange(salaryConfig.indexOf(pt), v)} 
                                    suffix="đ/h"
                                 />
                             ) : <span className="text-gray-300 text-xs italic text-center block">-</span>}
                         </div>
                     </div>
                 );
             })}
         </div>

         <div className="flex items-center gap-2 pt-2">
             <input 
                type="checkbox" 
                id="bhxh" 
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={includeBHXH}
                onChange={(e) => onUpdate({ includeBHXH: e.target.checked })}
             />
             <label htmlFor="bhxh" className="text-sm text-gray-600 select-none">
                 Đã bao gồm chi phí BHXH & phụ cấp trong mức lương trên?
             </label>
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
            <SkipForward size={14} /> Dùng mặc định, tạo luôn →
          </button>
          <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
          >
              Xong, Tạo phương án <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
