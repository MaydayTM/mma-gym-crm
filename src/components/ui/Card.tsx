import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  variant?: 'default' | 'elevated' | 'success';
}

export function Card({
  children,
  className = '',
  noPadding = false,
  variant = 'default',
  style,
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'bg-gradient-to-br from-white/5 to-white/0',
    elevated: 'bg-gradient-to-br from-white/10 to-white/0',
    success: 'bg-emerald-500/5',
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        rounded-3xl
        ${noPadding ? '' : 'p-6'}
        ${className}
      `}
      style={{
        position: 'relative',
        '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
        '--border-radius-before': '24px',
        ...style,
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}
