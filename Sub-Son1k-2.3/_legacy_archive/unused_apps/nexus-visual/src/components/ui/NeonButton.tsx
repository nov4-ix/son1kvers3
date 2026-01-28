import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    glow?: boolean;
}

export function NeonButton({ children, className = '', variant = 'primary', glow = false, ...props }: Props) {
    const baseStyles = "relative px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 border clip-path-polygon hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]",
        secondary: "border-neon-purple text-neon-purple hover:bg-neon-purple/10 hover:shadow-[0_0_20px_rgba(188,19,254,0.5)]",
        danger: "border-neon-red text-neon-red hover:bg-neon-red/10 hover:shadow-[0_0_20px_rgba(255,42,109,0.5)]",
    };

    const glowEffect = glow ? "animate-pulse-glow" : "";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${glowEffect} ${className}`}
            {...props}
        >
            {/* Corner Accents */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />

            {children}
        </button>
    );
}
