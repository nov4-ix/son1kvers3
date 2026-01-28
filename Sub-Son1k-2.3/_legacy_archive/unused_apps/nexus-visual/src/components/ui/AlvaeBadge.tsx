import { motion } from 'framer-motion';

interface Props {
    size?: number;
    className?: string;
}

export function AlvaeBadge({ size = 24, className = '' }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative flex items-center justify-center ${className}`}
            title="ALVAE: Identidad Sonora Desbloqueada"
        >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-lg rounded-full" />

            {/* Symbol */}
            <img
                src="/alvae_symbol.png"
                alt="ALVAE Symbol"
                width={size}
                height={size}
                className="relative z-10 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
            />

            {/* Particle Ring (CSS only for performance) */}
            <div className="absolute inset-0 border border-amber-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
        </motion.div>
    );
}
