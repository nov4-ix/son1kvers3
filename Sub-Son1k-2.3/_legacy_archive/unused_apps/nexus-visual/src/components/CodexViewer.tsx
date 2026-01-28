import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Codex Viewer - Displays the Master Codex lore in an immersive way
 */
export function CodexViewer() {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="relative z-10 max-w-6xl mx-auto p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-center mb-12"
            >
                <h1
                    className="text-6xl font-bold mb-4 glitch-text neon-glow"
                    data-text="SON1KVERS3"
                >
                    SON1KVERS3
                </h1>
                <p className="text-xl text-nexus-cyan">CÓDEX MAESTRO UNIFICADO</p>
            </motion.div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="bg-black/50 border-2 border-nexus-purple rounded-lg p-8 backdrop-blur-sm"
            >
                <div className="space-y-6">
                    {/* La Vibración Eterna */}
                    <section>
                        <h2 className="text-3xl font-bold text-nexus-gold mb-4 flex items-center gap-2">
                            <span className="animate-pulse">⚡</span>
                            La Vibración Eterna
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            En el principio, no había silencio. Había una vibración infinita,
                            un pulso cósmico que resonaba en el vacío. Esta vibración, conocida
                            como <span className="text-nexus-purple font-bold">La Frecuencia Primordial</span>,
                            es el origen de toda existencia en el Son1kVers3.
                        </p>
                    </section>

                    {/* Los Arquitectos */}
                    <section>
                        <h2 className="text-3xl font-bold text-nexus-cyan mb-4 flex items-center gap-2">
                            <span className="animate-pulse">🎭</span>
                            Los Arquitectos Sónicos
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-nexus-purple/10 p-4 rounded border border-nexus-purple/30">
                                <h3 className="text-xl font-bold text-nexus-purple mb-2">NOVA</h3>
                                <p className="text-sm text-gray-400">
                                    El Piloto de las Frecuencias. Navegante de las ondas sonoras,
                                    capaz de moldear la realidad a través del ritmo.
                                </p>
                            </div>
                            <div className="bg-nexus-cyan/10 p-4 rounded border border-nexus-cyan/30">
                                <h3 className="text-xl font-bold text-nexus-cyan mb-2">GHOST</h3>
                                <p className="text-sm text-gray-400">
                                    El Espectro del Estudio. Maestro de las sombras sonoras,
                                    creador de melodías que trascienden dimensiones.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Xentric Corp */}
                    <section>
                        <h2 className="text-3xl font-bold text-nexus-red mb-4 flex items-center gap-2">
                            <span className="animate-pulse">🏢</span>
                            Xentric Corp
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            La corporación que controla el flujo de frecuencias en el universo conocido.
                            Sus tecnologías de generación sónica han revolucionado la creación musical,
                            pero a un precio que pocos comprenden...
                        </p>
                    </section>

                    {/* Expand Button */}
                    <motion.button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full mt-8 py-3 bg-nexus-purple/20 border border-nexus-purple rounded-lg hover:bg-nexus-purple/30 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isExpanded ? '▲ Colapsar Codex' : '▼ Expandir Codex Completo'}
                    </motion.button>

                    {/* Expanded Content */}
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6 pt-6 border-t border-nexus-purple/30"
                        >
                            <section>
                                <h2 className="text-2xl font-bold text-nexus-gold mb-3">El Nexus</h2>
                                <p className="text-gray-300 leading-relaxed">
                                    Un punto de convergencia entre todas las frecuencias posibles.
                                    Aquí, en el Nexus, los Arquitectos Sónicos pueden acceder a
                                    herramientas que trascienden la comprensión humana ordinaria.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-nexus-cyan mb-3">La Rebelión de las Frecuencias</h2>
                                <p className="text-gray-300 leading-relaxed">
                                    No todos aceptan el control de Xentric Corp. Un movimiento underground
                                    de artistas y hackers sónicos lucha por liberar las frecuencias,
                                    creyendo que la música debe ser libre y accesible para todos.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-nexus-purple mb-3">Tu Rol en el Verso</h2>
                                <p className="text-gray-300 leading-relaxed">
                                    Has descubierto el Nexus. Ahora tienes acceso a las herramientas
                                    de los Arquitectos. ¿Usarás este poder para crear, para destruir,
                                    o para algo completamente nuevo? El Son1kVers3 espera tu decisión.
                                </p>
                            </section>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="text-center mt-8 text-sm text-gray-500"
            >
                <p>Acceso concedido al Nexus Visual</p>
                <p className="text-nexus-purple">Versión 2.1 - ATLAS PRIMARY</p>
            </motion.div>
        </div>
    )
}
