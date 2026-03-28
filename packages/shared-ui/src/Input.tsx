import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-[#e0e0e0] mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2
          bg-white/5 border border-white/10
          rounded-lg text-white placeholder-gray-500
          backdrop-blur-xl
          focus:outline-none focus:border-[#00FFE7] focus:ring-1 focus:ring-[#00FFE7]
          transition-all duration-300
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
