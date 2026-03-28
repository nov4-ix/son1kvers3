import React from 'react';

export const Logo = ({ size = 60, className = "opacity-90" }: { size?: number, className?: string }) => {
    return (
        <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#B858FE', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#047AF6', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#40FDAE', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="90" stroke="url(#logoGrad)" strokeWidth="2" fill="none" opacity="0.3" />
                <path d="M 100 30 L 170 150 L 30 150 Z" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
                <circle cx="100" cy="100" r="25" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
                <circle cx="100" cy="100" r="8" fill="url(#logoGrad)" />
                <line x1="100" y1="30" x2="100" y2="70" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.5" />
                <line x1="30" y1="150" x2="60" y2="110" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.5" />
                <line x1="170" y1="150" x2="140" y2="110" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.5" />
            </svg>
        </div>
    );
};
