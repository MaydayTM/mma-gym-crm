import { ChevronUp, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  icon: Icon,
  variant = 'default',
  className = '',
}: StatCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-gradient-to-br from-white/10 to-white/0',
      label: 'text-neutral-500',
      trend: trendDirection === 'up' ? 'text-emerald-300' : trendDirection === 'down' ? 'text-rose-300' : 'text-neutral-400',
    },
    success: {
      bg: 'bg-emerald-500/5',
      label: 'text-emerald-300',
      trend: 'text-emerald-300',
    },
    warning: {
      bg: 'bg-amber-500/5',
      label: 'text-amber-300',
      trend: 'text-amber-300',
    },
    error: {
      bg: 'bg-rose-500/5',
      label: 'text-rose-300',
      trend: 'text-rose-300',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`flex flex-col rounded-2xl p-4 ${styles.bg} ${className}`}
      style={{
        position: 'relative',
        '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
        '--border-radius-before': '16px',
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <p className={`text-[11px] uppercase tracking-[0.22em] ${styles.label}`}>{label}</p>
        {Icon && (
          <Icon className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
        )}
      </div>

      <p className="mt-2 text-[20px] font-medium text-neutral-50">{value}</p>

      {trend && (
        <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${styles.trend}`}>
          {trendDirection === 'up' && <ChevronUp className="w-3 h-3" />}
          {trendDirection === 'down' && <ChevronDown className="w-3 h-3" />}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
