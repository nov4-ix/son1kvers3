import React from 'react';

interface NexusCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    icon?: React.ReactNode;
    borderColor?: string;
}

export const NexusCard: React.FC<NexusCardProps> = ({
    children,
    className = '',
    title,
    icon,
    borderColor = 'border-[#00FFE7]/30'
}) => {
    return (
        <div className={`relative group ${className}`}>
            {/* Holographic Border Effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#00FFE7]/20 to-[#B84DFF]/20 rounded-3xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200`}></div>

            <div className={`relative bg-[#0A0C10]/80 backdrop-blur-xl rounded-3xl p-6 border ${borderColor} shadow-2xl overflow-hidden`}>
                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FFE7]/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-[3s] pointer-events-none"></div>

                {/* Header */}
                {(title || icon) && (
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        {icon && (
                            <div className="p-3 bg-gradient-to-br from-[#B84DFF]/20 to-[#00FFE7]/20 border border-[#00FFE7]/30 rounded-xl shadow-[0_0_15px_rgba(0,255,231,0.1)]">
                                {icon}
                            </div>
                        )}
                        {title && (
                            <h3 className="text-2xl font-bold text-white font-mono tracking-wide">
                                {title}
                            </h3>
                        )}
                    </div>
                )}

                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
};
