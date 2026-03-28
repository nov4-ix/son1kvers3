import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TransitionOverlayProps {
    isActive: boolean
    onComplete: () => void
}

/**
 * Epic transition overlay - "Goku SSJ" style transformation
 * Sequence: Screen shake → Blinding white light → Energy burst → Navigate
 */
export function TransitionOverlay({ isActive, onComplete }: TransitionOverlayProps) {
    const [phase, setPhase] = useState<'shake' | 'whiteout' | 'burst' | 'complete'>('shake')

    useEffect(() => {
        if (!isActive) return

        // Phase 1: Screen shake (500ms)
        const shakeTimer = setTimeout(() => {
            setPhase('whiteout')
        }, 500)

        // Phase 2: Blinding whiteout (1000ms)
        const whiteoutTimer = setTimeout(() => {
            setPhase('burst')
        }, 1500)

        // Phase 3: Energy burst (800ms)
        const burstTimer = setTimeout(() => {
            setPhase('complete')
            onComplete()
        }, 2300)

        return () => {
            clearTimeout(shakeTimer)
            clearTimeout(whiteoutTimer)
            clearTimeout(burstTimer)
        }
    }, [isActive, onComplete])

    if (!isActive) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9999] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Phase 1: Screen Shake Effect */}
                {phase === 'shake' && (
                    <motion.div
                        className="absolute inset-0 bg-transparent"
                        animate={{
                            x: [0, -10, 10, -10, 10, -5, 5, 0],
                            y: [0, 10, -10, 10, -10, 5, -5, 0],
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: 0,
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-magenta/20 animate-pulse" />
                    </motion.div>
                )}

                {/* Phase 2: Blinding Whiteout */}
                {phase === 'whiteout' && (
                    <motion.div
                        className="absolute inset-0 bg-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Radial glow effect */}
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,215,0,0.8) 50%, rgba(255,255,255,1) 100%)',
                            }}
                            animate={{
                                scale: [1, 1.5, 1],
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                            }}
                        />
                    </motion.div>
                )}

                {/* Phase 3: Energy Burst */}
                {phase === 'burst' && (
                    <motion.div
                        className="absolute inset-0 overflow-hidden"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Golden energy particles */}
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                }}
                                animate={{
                                    x: Math.cos((i / 20) * Math.PI * 2) * 1000,
                                    y: Math.sin((i / 20) * Math.PI * 2) * 1000,
                                    opacity: [1, 0],
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}

                        {/* Central flash */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-radial from-yellow-200 via-orange-400 to-transparent"
                            animate={{
                                scale: [0, 3],
                                opacity: [1, 0],
                            }}
                            transition={{
                                duration: 0.8,
                            }}
                        />
                    </motion.div>
                )}

                {/* Audio cue (optional - can add sound effect here) */}
                {phase === 'whiteout' && (
                    <audio autoPlay>
                        {/* Add power-up sound effect here if available */}
                    </audio>
                )}
            </motion.div>
        </AnimatePresence>
    )
}
