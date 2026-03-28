import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Search, X } from 'lucide-react';
import { pixelCommands, getSuggestedCommands } from '../lib/pixelCommands';

interface PixelCommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCommand: (command: string) => void;
    currentApp?: string;
}

export function PixelCommandPalette({
    isOpen,
    onClose,
    onSelectCommand,
    currentApp = 'web-classic'
}: PixelCommandPaletteProps) {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const suggestedCommands = getSuggestedCommands(currentApp);

    const filteredCommands = search
        ? Object.values(pixelCommands).filter(cmd =>
            cmd.name.toLowerCase().includes(search.toLowerCase()) ||
            cmd.description.toLowerCase().includes(search.toLowerCase())
        )
        : suggestedCommands;

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
            e.preventDefault();
            onSelectCommand(filteredCommands[selectedIndex].name);
            onClose();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: -20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-carbon/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-[0_0_50px_rgba(0,255,231,0.3)] w-full max-w-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Command className="w-5 h-5 text-primary" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar comandos..."
                            autoFocus
                            className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-lg"
                        />
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Commands List */}
                <div className="max-h-96 overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="text-center py-8 text-white/60">
                            No se encontraron comandos
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {filteredCommands.map((cmd, index) => (
                                <motion.div
                                    key={cmd.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    onClick={() => {
                                        onSelectCommand(cmd.name);
                                        onClose();
                                    }}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${index === selectedIndex
                                            ? 'bg-primary/20 border border-primary/50'
                                            : 'bg-white/5 border border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <code className="text-primary font-mono text-sm">
                                                    {cmd.name}
                                                </code>
                                                <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                                                    {cmd.category}
                                                </span>
                                            </div>
                                            <p className="text-white/70 text-sm mt-1">
                                                {cmd.description}
                                            </p>
                                            {cmd.examples.length > 0 && (
                                                <div className="mt-2 flex gap-2">
                                                    {cmd.examples.slice(0, 2).map((example, i) => (
                                                        <code
                                                            key={i}
                                                            className="text-xs text-white/50 bg-black/30 px-2 py-1 rounded font-mono"
                                                        >
                                                            {example}
                                                        </code>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 bg-black/20">
                    <div className="flex items-center justify-between text-xs text-white/50">
                        <span>↑↓ Navegar</span>
                        <span>Enter Seleccionar</span>
                        <span>Esc Cerrar</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
