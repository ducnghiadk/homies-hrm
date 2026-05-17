import { Coffee, ShoppingBag, Smartphone } from 'lucide-react';
import { BusinessModel } from '@/lib/staffing/types';

interface BusinessModelSelectorProps {
  value: BusinessModel;
  onChange: (value: BusinessModel) => void;
}

export default function BusinessModelSelector({ value, onChange }: BusinessModelSelectorProps) {
  const options: { id: BusinessModel; label: string; icon: any }[] = [
    { id: 'dine-in', label: 'Tại quán', icon: Coffee },
    { id: 'takeaway', label: 'Mang đi', icon: ShoppingBag },
    { id: 'app-delivery', label: 'App + Mang đi', icon: Smartphone },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        const Icon = opt.icon;
        
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
            }`}
          >
            <Icon size={24} className="mb-2" />
            <span className="text-sm font-medium">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
