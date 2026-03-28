import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  glow?: boolean;
}

export function Card({
  title,
  glow = false,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white/5 border border-white/10
        rounded-xl p-6
        backdrop-blur-xl
        hover:bg-white/10 transition-all duration-300
        ${glow ? 'shadow-[0_0_20px_rgba(0,255,231,0.3)]' : ''}
        ${className}
      `}
      {...props}
    >
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4 bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
