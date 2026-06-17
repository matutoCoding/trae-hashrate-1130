import { useBookingStore } from '@/stores/useBookingStore';
import { Package } from '@/types';
import { formatMoney } from '@/utils/dateUtils';
import { Check, Wine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackageSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  category?: string;
}

export function PackageSelector({ selectedId, onSelect, category }: PackageSelectorProps) {
  const { packages } = useBookingStore();
  
  const filteredPackages = category
    ? packages.filter((p) => p.category === category)
    : packages;
  
  return (
    <div className="grid grid-cols-3 gap-3">
      {filteredPackages.map((pkg) => (
        <div
          key={pkg.id}
          onClick={() => onSelect(selectedId === pkg.id ? '' : pkg.id)}
          className={cn(
            'relative p-3 rounded-lg border cursor-pointer transition-all duration-200',
            selectedId === pkg.id
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
          )}
        >
          {selectedId === pkg.id && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Wine className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">{pkg.name}</h4>
              <p className="text-xs text-gray-500">{pkg.description}</p>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-amber-400">
              {formatMoney(pkg.price)}
            </span>
            <span className="text-xs text-gray-500 line-through">
              {formatMoney(pkg.originalPrice)}
            </span>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-1">
            {pkg.items.slice(0, 3).map((item, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 rounded text-gray-400"
              >
                {item.name} ×{item.quantity}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
