import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'purple' | 'blue' | 'green' | 'amber' | 'red';
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'purple', className }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/5 border-green-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    red: 'from-red-500/20 to-red-600/5 border-red-500/30',
  };
  
  const iconColors: Record<string, string> = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };
  
  return (
    <div
      className={cn(
        'bg-gradient-to-br rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02]',
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-lg bg-gray-800/50', iconColors[color])}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-500">较昨日</span>
        </div>
      )}
    </div>
  );
}
