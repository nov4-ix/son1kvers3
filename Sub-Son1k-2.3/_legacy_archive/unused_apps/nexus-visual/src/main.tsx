import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './lib/i18n'
import { NexusShell } from './components/layout/NexusShell'
import { HoloCard } from './components/ui/HoloCard'
import { NeonButton } from './components/ui/NeonButton'
import { DAWInterface } from './components/daw/DAWInterface'
import { MatrixRain } from './components/MatrixRain'
import { CodexViewer } from './components/CodexViewer'

function App() {
    // Default to 'codex' if that's the intended entry from the Easter Egg, 
    // but for now let's keep 'dashboard' as default and add a way to switch.
    // Or better: check URL params or local storage to see if we came from the Easter Egg.
    const [currentView, setCurrentView] = useState('dashboard');

    return (
        <>
            {/* Always show Matrix Rain in background for immersion */}
            <MatrixRain density={0.2} />

            <NexusShell currentView={currentView} onViewChange={setCurrentView}>
                {currentView === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto relative z-10">
                        {/* Welcome Card */}
                        <div className="col-span-full">
                            <HoloCard className="p-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-4xl font-display mb-2 text-white">Welcome back, <span className="text-neon-cyan">Nov4-ix</span></h2>
                                    <p className="text-gray-400 font-mono max-w-xl">
                                        System initialized. Neural link established. Ready to synthesize new audio realities.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <NeonButton variant="primary" glow onClick={() => setCurrentView('studio')}>Launch Studio</NeonButton>
                                    <NeonButton variant="secondary" onClick={() => setCurrentView('codex')}>Access Codex</NeonButton>
                                </div>
                            </HoloCard>
                        </div>

                        {/* Stats Cards */}
                        <HoloCard title="System Status">
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Core Stability</span>
                                    <span className="text-neon-green">98.4%</span>
                                </div>
                                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full w-[98%] bg-neon-green shadow-[0_0_10px_#0AFF64]" />
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Token Pool</span>
                                    <span className="text-neon-pink">ACTIVE</span>
                                </div>
                                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full w-[75%] bg-neon-pink shadow-[0_0_10px_#ff49c3]" />
                                </div>
                            </div>
                        </HoloCard>

                        <HoloCard title="Recent Projects">
                            <ul className="space-y-3">
                                {['Neon Nights', 'Cyber Punk 2099', 'Void Walker'].map((project, i) => (
                                    <li key={i} className="flex items-center justify-between group cursor-pointer">
                                        <span className="text-gray-300 group-hover:text-neon-cyan transition-colors">{project}</span>
                                        <span className="text-xs text-gray-500 font-mono">2h ago</span>
                                    </li>
                                ))}
                            </ul>
                        </HoloCard>

                        <HoloCard title="Quick Actions">
                            <div className="grid grid-cols-2 gap-3">
                                <NeonButton variant="primary" className="text-xs py-2" onClick={() => setCurrentView('studio')}>New Track</NeonButton>
                                <NeonButton variant="secondary" className="text-xs py-2">Import Audio</NeonButton>
                                <NeonButton variant="danger" className="text-xs py-2">Purge Cache</NeonButton>
                                <NeonButton className="text-xs py-2 border-white text-white hover:bg-white/10">Settings</NeonButton>
                            </div>
                        </HoloCard>
                    </div>
                )}

                {currentView === 'studio' && (
                    <div className="h-full flex flex-col relative z-10">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-display text-white tracking-widest">GHOST STUDIO <span className="text-neon-cyan text-sm ml-2">v2.2</span></h2>
                            <div className="flex gap-2">
                                <NeonButton className="text-xs py-1 px-3" onClick={() => setCurrentView('dashboard')}>Exit Studio</NeonButton>
                            </div>
                        </div>
                        <DAWInterface />
                    </div>
                )}

                {currentView === 'codex' && (
                    <div className="h-full flex flex-col relative z-10">
                        <div className="mb-4 flex items-center justify-between">
                            <NeonButton className="text-xs py-1 px-3" onClick={() => setCurrentView('dashboard')}>Return to Dashboard</NeonButton>
                        </div>
                        <CodexViewer />
                    </div>
                )}
            </NexusShell>
        </>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
