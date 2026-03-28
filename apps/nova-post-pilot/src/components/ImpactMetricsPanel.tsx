import { TrendingUp, ArrowUpRight, Users, Heart, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ImpactMetricsPanel() {
    const { t } = useTranslation();

    const metrics = [
        { icon: Users, label: 'Followers', current: '12.5K', projected: '18K' },
        { icon: Heart, label: 'Engagement', current: '8.2%', projected: '12%' },
        { icon: Eye, label: 'Reach', current: '50K', projected: '80K' }
    ];

    const data = {
        insights: [
            'Post 3x per week during peak hours',
            'Use carousel posts for 2x engagement'
        ]
    };
    // ...

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                    <TrendingUp className="w-24 h-24 text-emerald-500" />
                </div>

                <h3 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    {t('growth.impact')} (3 Months)
                </h3>

                <div className="grid grid-cols-3 gap-4 relative z-10">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                                <m.icon className="w-3 h-3" />
                                {m.label}
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-lg font-bold text-white">{m.current}</span>
                                <span className="text-xs text-emerald-400 mb-1">→ {m.projected}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                    <p className="text-xs text-emerald-400 font-medium mb-2">💡 {t('insights.title')}</p>
                    <ul className="space-y-1">
                        {data.insights.slice(0, 2).map((insight, i) => (
                            <li key={i} className="text-[10px] text-white/60 flex gap-2">
                                <span className="text-emerald-500">•</span> {insight}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
