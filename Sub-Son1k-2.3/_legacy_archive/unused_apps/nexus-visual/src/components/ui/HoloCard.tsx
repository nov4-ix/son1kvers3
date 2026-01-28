import React from 'react';

interface Props {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export function HoloCard({ children, className = '', title }: Props) {
    return (
        <div className={`relative group ${className}`}>
            {/* Glass Background */}
            <div className="absolute inset-0 bg-nexus-panel backdrop-blur-md border border-nexus-border rounded-lg transition-all duration-300 group-hover:border-neon-cyan/50 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]" />

            {/* Content */}
            <div className="relative z-10 p-6">
                {title && (
                    <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
                        <h3 className="font-display text-lg text-white tracking-widest uppercase">{title}</h3>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse delay-75" />
                        </div>
                    </div>
                )}
                {children}
            </div>

            {/* Decorative Lines */}
            <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -bottom-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-neon-purple/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
    );
}
