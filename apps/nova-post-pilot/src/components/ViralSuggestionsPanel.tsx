import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface ViralHook {
    hook: string;
    type: string;
    estimatedImpact: 'High' | 'Medium';
    rationale: string;
}

export function ViralSuggestionsPanel() {
    const { t } = useTranslation();
    const [hooks, setHooks] = useState<ViralHook[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const fetchHooks = async () => {
        setLoading(true);
        // Simulate fetching hooks
        setTimeout(() => {
            setHooks([
                {
                    hook: "What if I told you there's a better way?",
                    type: "Question Hook",
                    estimatedImpact: "High",
                    rationale: "Creates curiosity and challenges assumptions"
                },
                {
                    hook: "The secret they don't want you to know...",
                    type: "Mystery Hook",
                    estimatedImpact: "High",
                    rationale: "FOMO-driven engagement trigger"
                },
                {
                    hook: "Here's exactly how I did it (and you can too)",
                    type: "Value Hook",
                    estimatedImpact: "Medium",
                    rationale: "Promises actionable value"
                }
            ]);
            setLoading(false);
        }, 1000);
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success('Hook copied to clipboard!');
        setTimeout(() => setCopiedIndex(null), 2000);
    };
    // ...

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{t('growth.viralHooks')}</h3>
                        <p className="text-xs text-white/50">{t('growth.hooksSubtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={fetchHooks}
                    disabled={loading}
                    className="text-xs text-primary hover:text-primary-light transition-colors"
                >
                    {loading ? t('generator.button.generating') : t('growth.regenerate')}
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                    ))
                ) : (
                    hooks.map((hook, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative bg-black/20 hover:bg-black/40 border border-white/5 hover:border-primary/30 rounded-xl p-4 transition-all"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${hook.estimatedImpact === 'High'
                                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                            }`}>
                                            {hook.estimatedImpact} Impact
                                        </span>
                                        <span className="text-[10px] text-white/40 uppercase tracking-wider">
                                            {hook.type}
                                        </span>
                                    </div>
                                    <p className="text-white font-medium text-lg leading-snug mb-2">
                                        "{hook.hook}"
                                    </p>
                                    <p className="text-xs text-white/40 italic">
                                        💡 {hook.rationale}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleCopy(hook.hook, index)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                                >
                                    {copiedIndex === index ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
