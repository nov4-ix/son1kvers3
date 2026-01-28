import React from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Activity, Disc, Radio, Settings } from 'lucide-react';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { AlvaeBadge } from '../ui/AlvaeBadge';

interface Props {
    children: React.ReactNode;
    currentView: string;
    onViewChange: (view: string) => void;
}

export function NexusShell({ children, currentView = 'dashboard', onViewChange }: Props) {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-nexus-dark text-white font-sans selection:bg-neon-cyan selection:text-black overflow-hidden relative">
            {/* ... background ... */}

            {/* Main Layout */}
            <div className="relative z-10 flex h-screen">
                {/* Sidebar */}
                <aside className="w-20 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col items-center py-8 gap-8">
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                        <Cpu size={24} className="text-white" />
                    </div>

                    <nav className="flex flex-col gap-6 w-full px-2">
                        <NavItem
                            icon={<Activity />}
                            label={t('shell.apps.nova')}
                            active={currentView === 'dashboard'}
                            onClick={() => onViewChange?.('dashboard')}
                        />
                        <NavItem
                            icon={<Disc />}
                            label={t('shell.apps.ghost')}
                            active={currentView === 'studio'}
                            onClick={() => onViewChange?.('studio')}
                        />
                        <NavItem icon={<Radio />} label={t('shell.apps.generator')} />
                        <NavItem icon={<Settings />} label={t('shell.user.settings')} />
                    </nav>
                </aside>

                {/* Content Area */}
                <main className="flex-1 overflow-hidden flex flex-col">
                    {/* Top Bar */}
                    <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-sm flex items-center justify-between px-8">
                        <div className="flex items-center gap-4">
                            <h1 className="font-display text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
                                SON1K VERS3
                            </h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
                                SYS.ONLINE
                            </span>
                        </div>
                        <div className="font-mono text-xs text-gray-400 flex items-center gap-4">
                            {/* User Identity */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                                <span className="text-neon-cyan font-bold">Nov4-ix</span>
                                {/* ALVAE Symbol - The Architects (Builders of the Universe) */}
                                <AlvaeBadge size={16} />
                            </div>

                            <LanguageSwitcher />
                            <div className="flex gap-4 border-l border-white/10 pl-4">
                                <span>CPU: 12%</span>
                                <span>MEM: 4.2GB</span>
                                <span>NET: SECURE</span>
                            </div>
                        </div>
                    </header>

                    {/* Viewport */}
                    <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 group relative
        ${active ? 'bg-neon-cyan/10 text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}
      `}
        >
            {icon}
            <span className="text-[9px] font-mono uppercase opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 w-max bg-black/80 px-2 py-0.5 rounded border border-white/10">
                {label}
            </span>
            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-neon-cyan rounded-r shadow-[0_0_10px_#00F0FF]" />}
        </button>
    );
}
