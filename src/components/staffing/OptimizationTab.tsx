import { useState } from 'react';
import { OptimizationState, OptimizationPlan } from '@/lib/staffing/types';
import Step1BasicInfo from './optimization/Step1BasicInfo';
import Step2Traffic from './optimization/Step2Traffic';
import Step3Salary from './optimization/Step3Salary';
import Step4Results from './optimization/Step4Results';
import ProgressBar from './ProgressBar';
import TooltipGuide from './TooltipGuide';
import { useOnboarding, type OnboardingTooltips } from '@/hooks/useOnboarding';
import { WIZARD_TOOLTIPS } from '@/lib/staffing/onboarding-templates';
import { generateOptimizationPlans } from '@/lib/staffing/optimization';
import { toast } from 'sonner';

interface OptimizationTabProps {
  initialState?: Partial<OptimizationState>;
  onPlanSelected: (plan: OptimizationPlan) => void;
}

// Initial default state
const defaultState: OptimizationState = {
  currentStep: 1,
  basicInfo: {
    businessModel: 'dine-in',
    dailyCups: 0,
    openTime: '07:00',
    closeTime: '22:00',
    operatingDays: [1, 2, 3, 4, 5, 6, 0]
  },
  trafficPattern: [], // Empty initially
  salaryConfig: [], // Empty initially
  includeBHXH: true
};

export default function OptimizationTab({ initialState, onPlanSelected }: OptimizationTabProps) {
  // Merge initial state if provided (e.g. from Quick Estimate)
  // Be careful with deep merge.
  const [state, setState] = useState<OptimizationState>(() => ({
    ...defaultState,
    ...initialState,
    // Ensure basicInfo is merged correctly
    basicInfo: { ...defaultState.basicInfo, ...(initialState?.basicInfo || {}) },
    currentStep: initialState?.currentStep || 1
  }));

  const [generatedPlans, setGeneratedPlans] = useState<OptimizationPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const onboarding = useOnboarding();
  const [activeTooltip, setActiveTooltip] = useState<number | null>(() => {
    // Show tooltip for step 1 on first visit
    return onboarding.shouldShowTooltip('step1') ? 1 : null;
  });

  // Steps handler
  const updateState = (updates: Partial<OptimizationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (state.currentStep === 3) {
      handleGeneratePlans();
    } else {
      const next = (state.currentStep + 1) as 1|2|3|4;
      setState(prev => ({ ...prev, currentStep: next }));
      // Show tooltip for next step
      const tooltipKey = `step${next}` as keyof OnboardingTooltips;
      if (onboarding.shouldShowTooltip(tooltipKey)) {
        setActiveTooltip(next);
      }
    }
  };

  const prevStep = () => {
    setState(prev => ({ ...prev, currentStep: (prev.currentStep - 1) as 1|2|3|4 }));
  };

  const handleGeneratePlans = async () => {
    setIsGenerating(true);
    // Simulate calc delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const plans = generateOptimizationPlans(state);
      setGeneratedPlans(plans);
      setState(prev => ({ ...prev, currentStep: 4 }));
      toast.success('✅ Đã tạo 3 phương án tối ưu');
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi khi tạo phương án');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render Steps
  return (
    <div className="py-6">
      {/* Enhanced Progress Bar */}
      <ProgressBar currentStep={state.currentStep} />

      {/* Step Tooltip */}
      {activeTooltip && WIZARD_TOOLTIPS[activeTooltip] && (
        <TooltipGuide
          id={`step${activeTooltip}`}
          title={WIZARD_TOOLTIPS[activeTooltip].title}
          body={WIZARD_TOOLTIPS[activeTooltip].body}
          step={{ current: activeTooltip, total: 4 }}
          onDismiss={() => {
            const key = `step${activeTooltip}` as keyof OnboardingTooltips;
            onboarding.markTooltipViewed(key);
            setActiveTooltip(null);
          }}
        />
      )}

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Đang phân tích dữ liệu & tối ưu...</p>
        </div>
      ) : (
        <>
            {state.currentStep === 1 && (
                <Step1BasicInfo 
                    state={state} 
                    onUpdate={updateState} 
                    onNext={nextStep} 
                />
            )}
            {state.currentStep === 2 && (
                <Step2Traffic 
                    state={state} 
                    onUpdate={updateState} 
                    onNext={nextStep} 
                    onBack={prevStep}
                />
            )}
            {state.currentStep === 3 && (
                <Step3Salary 
                    state={state} 
                    onUpdate={updateState} 
                    onNext={nextStep} 
                    onBack={prevStep}
                />
            )}
            {state.currentStep === 4 && (
                <Step4Results 
                    state={state} 
                    plans={generatedPlans}
                    onSelectPlan={onPlanSelected}
                    onBack={prevStep}
                />
            )}
        </>
      )}
    </div>
  );
}
