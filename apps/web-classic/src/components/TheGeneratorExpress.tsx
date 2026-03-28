import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { Play, Sparkles, Wand2, Image as ImageIcon, MessageSquare, Users, SkipBack, SkipForward, Music, Pause, Volume2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { ExtensionInstallWizard } from './ExtensionInstallWizard';

export const TheGeneratorExpress = () => {
    const [prompt, setPrompt] = useState('');
    const [voiceType, setVoiceType] = useState<'male' | 'female' | null>(null);
    const [isInstrumental, setIsInstrumental] = useState(false);
    const [isBoostEnabled, setIsBoostEnabled] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationMessage, setGenerationMessage] = useState('');
    const [generationProgress, setGenerationProgress] = useState(0); // Progress 0-100%
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0); // Seconds
    const [trackUrl, setTrackUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [credits, setCredits] = useState<number | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [showExtensionWizard, setShowExtensionWizard] = useState(false);

    // Initialize User & Credits
    useEffect(() => {
        let storedUserId = localStorage.getItem('son1k_user_id');
        if (!storedUserId) {
            storedUserId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('son1k_user_id', storedUserId);
        }
        setUserId(storedUserId);
        fetchCredits(storedUserId);
    }, []);

    const fetchCredits = async (uid: string) => {
        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            const res = await fetch(`${BACKEND_URL}/api/credits/${uid}`);
            const data = await res.json();
            if (data.success && data.credits) {
                setCredits(data.credits.totalCredits - data.credits.usedCredits);
            }
        } catch (e) {
            console.error('Error fetching credits', e);
        }
    };

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error('Por favor describe tu canción primero');
            return;
        }

        setIsGenerating(true);
        setGenerationMessage('Iniciando...');
        setTrackUrl(null);
        setIsPlaying(false);

        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

            // Construct prompt with voice type if selected
            let finalPrompt = prompt;
            if (voiceType) {
                finalPrompt += ` [${voiceType === 'male' ? 'Male Vocals' : 'Female Vocals'}]`;
            }

            setGenerationMessage('Conectando con Neural Engine...');

            // Use the new Robust API (Phoenix Protocol)
            const response = await fetch(`${BACKEND_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId, // Send User ID for credits
                    prompt: finalPrompt,
                    make_instrumental: isInstrumental,
                    boost: isBoostEnabled, // Send Boost flag
                    wait_audio: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Check for 401 specifically to guide user
                if (response.status === 401) {
                    throw new Error('NO_TOKENS_AVAILABLE');
                }
                throw new Error(`Error del servidor: ${errorText}`);
            }

            const data = await response.json();

            if (!data.success || !data.generationId) throw new Error('No se iniciaron clips de generación');

            const primaryClipId = data.generationId;

            setGenerationMessage('Generando audio (esto toma unos segundos)...');
            if (userId) fetchCredits(userId); // Refresh credits
            pollTrackStatus(primaryClipId);

        } catch (error: any) {
            console.error('Generation error:', error);

            // Check if error is due to missing tokens or auth
            if (error.message?.includes('NO_TOKENS_AVAILABLE') || error.message?.includes('No available tokens') || error.message?.includes('401')) {
                setShowExtensionWizard(true);
                toast.error('Se requiere instalar la extensión para generar música');
            } else {
                toast.error(error.message || 'Error al generar canción');
            }

            setIsGenerating(false);
            setGenerationMessage('');
        }
    };

    const pollTrackStatus = async (clipId: string) => {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://sub-son1k-2-2.fly.dev';

        let attempts = 0;
        const maxAttempts = 60; // 5 minutes (every 5s)
        const estimatedTotalTime = 120; // 120 seconds estimated

        const checkStatus = async () => {
            if (attempts >= maxAttempts) {
                toast.error('Tiempo de espera agotado');
                setIsGenerating(false);
                setGenerationProgress(0);
                return;
            }

            attempts++;

            // Update progress bar (0-90% during polling, 100% when done)
            const progressPercentage = Math.min(90, (attempts / maxAttempts) * 100);
            setGenerationProgress(progressPercentage);

            // Update estimated time
            const elapsedTime = attempts * 5; // 5 seconds per attempt
            const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);
            setEstimatedTimeRemaining(remainingTime);

            try {
                const response = await fetch(`${BACKEND_URL}/api/generation/${clipId}/status`);

                if (response.ok) {
                    const data = await response.json();

                    if (data.success) {
                        // Update message based on status
                        if (data.status === 'processing') {
                            setGenerationMessage('🎵 Generando música...');
                        } else if (data.status === 'pending') {
                            setGenerationMessage('⏳ En cola de generación...');
                        }

                        // Check for completion
                        if (data.status === 'completed' || data.status === 'complete') {
                            if (data.audioUrl || data.audio_url) {
                                setTrackUrl(data.audioUrl || data.audio_url);
                                setIsGenerating(false);
                                setGenerationProgress(100);
                                setGenerationMessage('¡Canción generada!');
                                toast.success('¡Tu canción está lista!');
                                return; // STOP polling
                            } else {
                                // Completed but no audio URL yet - keep polling
                                setGenerationMessage('Finalizando descarga...');
                            }
                        } else if (data.status === 'failed' || data.status === 'error') {
                            setIsGenerating(false);
                            setGenerationProgress(0);
                            throw new Error(data.error || 'La generación falló');
                        }
                    }
                }

                // Continue polling only if not completed
                setTimeout(checkStatus, 5000);
            } catch (error: any) {
                console.error('Polling error:', error);
                setIsGenerating(false);
                setGenerationProgress(0);
                toast.error(error.message || 'Error durante la generación');
            }
        };

        // Initialize progress
        setGenerationProgress(5);
        setEstimatedTimeRemaining(estimatedTotalTime);
        setTimeout(checkStatus, 3000);
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-[#171925] text-white font-sans selection:bg-[#B858FE]/30">
            {/* Institutional Header - Sober & Professional */}
            <header className="relative bg-[#171925]/95 backdrop-blur-sm border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Brand - Minimal & Corporate */}
                        <div className="flex items-center gap-3">
                            <Logo size={48} />
                            <div className="border-l border-white/10 pl-3">
                                <h1 className="text-xl font-light tracking-wider text-white">
                                    SON1KVERS<span className="font-normal">3</span>
                                </h1>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                    Music Generation Platform <span className="text-[#40FDAE]">v2.2</span>
                                </p>
                            </div>
                        </div>

                        {/* Navigation - Clean & Structured */}
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#generator" className="text-[13px] text-white/60 hover:text-white uppercase tracking-wider font-light transition-colors">
                                Generator
                            </a>
                            <a href="#archivo" className="text-[13px] text-white/60 hover:text-white uppercase tracking-wider font-light transition-colors">
                                Archive
                            </a>
                            <a href="#herramientas" className="text-[13px] text-white/60 hover:text-white uppercase tracking-wider font-light transition-colors">
                                Tools
                            </a>
                            <a href="#about" className="text-[13px] text-white/60 hover:text-white uppercase tracking-wider font-light transition-colors">
                                About
                            </a>
                        </nav>

                        {/* Actions - Minimal & Professional */}
                        <div className="flex items-center gap-4">
                            {credits !== null && (
                                <div className="hidden md:flex flex-col items-end mr-2 animate-in fade-in">
                                    <div className="text-xs text-white/40 font-mono tracking-wider">BALANCE</div>
                                    <div className="text-[#40FDAE] font-bold flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        {credits} CR
                                    </div>
                                </div>
                            )}
                            <button className="text-[13px] text-white/60 hover:text-white uppercase tracking-wider font-light transition-colors px-4 py-2">
                                Sign In
                            </button>
                            <button className="text-[13px] bg-white text-black uppercase tracking-wider font-light px-6 py-2 hover:bg-white/90 transition-colors">
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero / Generator Section */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="mb-6 flex flex-col items-center">
                            <img src="/son1k-logo.png" alt="Son1kvers3 Logo" className="w-32 h-32 object-contain mb-6" />
                            <h1 className="text-5xl font-light tracking-widest uppercase mb-4 text-[#BCAACD]">[Son1kvers3]</h1>
                        </div>
                        <h2 className="text-4xl font-light mb-2 tracking-tight text-white/80">
                            Ctrl+Alt= <span className="bg-gradient-to-r from-[#B858FE] to-[#047AF6] bg-clip-text text-transparent">Humanity</span>
                        </h2>
                    </div>

                    <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/5 shadow-2xl">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-white/70 mb-3 tracking-wide">Describe tu canción</label>
                            <textarea
                                placeholder="Ej: Una balada electrónica sobre la nostalgia con voces etéreas y sintetizadores ambient..."
                                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-5 py-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#B858FE] focus:border-transparent transition-all"
                                rows={3}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="mb-6 flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-[#B858FE]/20 rounded-lg text-[#B858FE]">
                                    <Music className="w-5 h-5" />
                                </span>
                                <div>
                                    <h4 className="font-medium text-white">Instrumental</h4>
                                    <p className="text-xs text-white/50">Generar canción sin letra</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isInstrumental}
                                    onChange={(e) => setIsInstrumental(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B858FE]"></div>
                            </label>
                        </div>

                        <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-[#B858FE]/10 to-[#047AF6]/10 p-4 rounded-xl border border-[#B858FE]/20">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-[#B858FE]/20 rounded-lg text-[#B858FE]">
                                    <Sparkles className="w-5 h-5" />
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-white">Boost Mode</h4>
                                        <span className="text-[10px] font-bold bg-[#B858FE] text-white px-1.5 py-0.5 rounded">FAST</span>
                                    </div>
                                    <p className="text-xs text-white/50">Prioridad en cola (Consume Boost Min)</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isBoostEnabled}
                                    onChange={(e) => setIsBoostEnabled(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B858FE]"></div>
                            </label>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-white/70 mb-3 tracking-wide">Tipo de voz</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setVoiceType('male')}
                                    className={`group relative overflow-hidden rounded-xl border-2 ${voiceType === 'male' ? 'border-[#B858FE] bg-white/10' : 'border-white/10 bg-white/5'} p-4 text-left transition-all hover:border-[#B858FE]/50 hover:bg-white/10`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#047AF6] to-[#B858FE] flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">Voz Masculina</p>
                                            <p className="text-xs text-white/50">Tono grave y profundo</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setVoiceType('female')}
                                    className={`group relative overflow-hidden rounded-xl border-2 ${voiceType === 'female' ? 'border-[#40FDAE] bg-white/10' : 'border-white/10 bg-white/5'} p-4 text-left transition-all hover:border-[#40FDAE]/50 hover:bg-white/10`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#15A4A2] to-[#40FDAE] flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">Voz Femenina</p>
                                            <p className="text-xs text-white/50">Tono agudo y claro</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-white/70 mb-3 tracking-wide">Estilo musical (opcional)</label>
                            <input
                                type="text"
                                placeholder="Ej: synthwave oscuro con toques de jazz, trap melódico, ambient experimental..."
                                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-5 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#B858FE] focus:border-transparent transition-all"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            <p className="text-xs text-white/40 mt-2">Describe libremente el estilo que imaginas. Sin límites.</p>
                        </div>


                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 w-full h-14 bg-gradient-to-r from-[#40FDAE] to-[#15A4A2] text-[#171925] font-semibold text-lg rounded-xl hover:shadow-[0_0_20px_rgba(64,253,174,0.3)]"
                        >
                            {isGenerating ? (
                                <span className="animate-pulse">{generationMessage || 'Generando...'}</span>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Generar Canción
                                </>
                            )}
                        </button>

                        {/* Progress Bar - Show when generating */}
                        {isGenerating && (
                            <div className="mt-6 space-y-3">
                                {/* Progress bar */}
                                <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#40FDAE] to-[#15A4A2] rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${generationProgress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                                    </div>
                                </div>

                                {/* Status info */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/70">
                                        {generationMessage || 'Procesando...'}
                                    </span>
                                    <span className="text-[#40FDAE] font-semibold">
                                        {generationProgress.toFixed(0)}%
                                        {estimatedTimeRemaining > 0 && (
                                            <span className="text-white/50 ml-2">
                                                (~{estimatedTimeRemaining}s)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-xs text-white/40 mt-4">La generación puede tardar entre 30-60 segundos</p>
                    </div>
                </div>
            </section>

            {/* El Archivo Section */}
            <section className="py-16 px-6 bg-gradient-to-b from-transparent to-[#122024]/30">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-3xl font-bold">El Archivo</h3>
                        <button className="text-[#15A4A2] hover:text-[#40FDAE] text-sm font-medium">Ver todas →</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: 'Ecos del Futuro', author: 'Usuario', plays: '2.4K', time: '3:24' },
                            { title: 'Resonancia Digital', author: 'CreadorX', plays: '1.8K', time: '2:56' },
                            { title: 'Fragmentos de Luz', author: 'SonikoAI', plays: '3.1K', time: '4:12' },
                            { title: 'Imperfección Perfecta', author: 'VanguardBeats', plays: '4.5K', time: '3:48' },
                        ].map((song, i) => (
                            <div key={i} className="rounded-xl border border-white/10 bg-[#1C232E] hover:border-[#B858FE]/50 transition-all group cursor-pointer overflow-hidden">
                                <div className="p-0">
                                    <div className="aspect-square bg-gradient-to-br from-[#15333B] to-[#15A4A2] relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                            <button className="w-16 h-16 rounded-full bg-gradient-to-r from-[#B858FE] to-[#047AF6] flex items-center justify-center text-white">
                                                <Play className="w-6 h-6 fill-current" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-semibold mb-1 text-white">{song.title}</h4>
                                        <p className="text-sm text-white/50 mb-2">{song.author}</p>
                                        <div className="flex items-center justify-between text-xs text-white/40">
                                            <span>{song.plays} reproducciones</span>
                                            <span>{song.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Top 10 Section */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <h3 className="text-3xl font-bold mb-8 text-center">Top 10 de la Semana</h3>
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                                    <span className="text-2xl font-bold text-[#B858FE] w-8">{i + 1}</span>
                                    <div className="w-12 h-12 rounded bg-gradient-to-br from-[#B858FE] to-[#047AF6]"></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">Canción Trending #{i + 1}</p>
                                        <p className="text-sm text-white/50">Artista • {12 - i}K plays</p>
                                    </div>
                                    <span className="text-sm text-white/40">3:{20 + i * 3}</span>
                                    <button className="text-white/70 hover:text-[#40FDAE] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Player Bar */}
                        <div className="border-t border-white/10 pt-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${trackUrl ? 'from-[#B858FE] to-[#047AF6]' : 'from-[#15A4A2] to-[#40FDAE]'} flex items-center justify-center`}>
                                    {trackUrl ? <Music className="w-8 h-8 text-white" /> : <div className="w-full h-full" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-white">{trackUrl ? 'Tu Creación Musical' : 'Selecciona una canción'}</p>
                                    <p className="text-sm text-white/50">{trackUrl ? 'Generado con Neural Engine' : 'Esperando...'}</p>
                                </div>
                            </div>

                            <div className="relative flex w-full touch-none select-none items-center mb-4 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                                onClick={(e) => {
                                    if (!audioRef.current || !duration) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const percent = (e.clientX - rect.left) / rect.width;
                                    audioRef.current.currentTime = percent * duration;
                                }}>
                                <div
                                    className="h-full bg-gradient-to-r from-[#B858FE] to-[#047AF6] transition-all duration-100"
                                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                ></div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-white/40 mb-4">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>

                            <div className="flex items-center justify-center gap-4">
                                <button className="text-white/70 hover:text-white" onClick={() => {
                                    if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                                }}>
                                    <SkipBack className="w-5 h-5" /></button>

                                <button
                                    onClick={togglePlay}
                                    disabled={!trackUrl}
                                    className={`w-12 h-12 rounded-full bg-gradient-to-r from-[#B858FE] to-[#047AF6] flex items-center justify-center text-white hover:scale-105 transition-transform ${!trackUrl && 'opacity-50 cursor-not-allowed'}`}
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                </button>

                                <button className="text-white/70 hover:text-white" onClick={() => {
                                    if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
                                }}>
                                    <SkipForward className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* El Santuario Promo */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#15333B] via-[#15A4A2] to-[#40FDAE] p-[2px]">
                        <div className="bg-[#171925] rounded-3xl p-12 text-center">
                            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold mb-4 bg-[#40FDAE]/20 text-[#40FDAE] border-[#40FDAE]/30">
                                Próximamente
                            </div>
                            <h3 className="text-4xl font-bold mb-4">El Santuario</h3>
                            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-6">
                                Una red social revolucionaria para creadores. Comparte, colabora y conecta con artistas de todo el mundo. Un espacio sagrado donde cada voz imperfecta encuentra su lugar.
                            </p>
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium bg-gradient-to-r from-[#B858FE] to-[#047AF6] text-white px-8 py-6 text-lg hover:opacity-90 transition-opacity">
                                <Users className="w-5 h-5 mr-2" />
                                Únete a la lista de espera
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tools Section */}
            <section id="herramientas" className="py-16 px-6 bg-gradient-to-b from-transparent to-[#122024]/30">
                <div className="max-w-7xl mx-auto">
                    <h3 className="text-3xl font-bold mb-12 text-center">Herramientas Creativas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <a href="https://the-generator.son1kvers3.com" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/10 bg-[#1C232E] hover:border-[#B858FE]/50 transition-all group cursor-pointer p-6">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#B858FE] to-[#047AF6] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-xl font-bold mb-2 text-white">The Generator</h4>
                            <p className="text-white/60 mb-3">Generador completo con 6 Perillas Literarias</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-[9px] bg-[#40FDAE] text-black px-2 py-1 rounded font-bold">COMPLETO</span>
                                <span className="text-[9px] bg-[#B858FE] text-white px-2 py-1 rounded font-bold">6 PERILLAS</span>
                                <span className="text-[9px] bg-gradient-to-r from-[#B858FE] to-[#047AF6] text-white px-2 py-1 rounded font-bold">ÚNICO</span>
                            </div>
                            <span className="text-[#40FDAE] group-hover:text-[#15A4A2] text-sm underline-offset-4 group-hover:underline inline-block">Abrir The Generator →</span>
                        </a>
                        <div className="block rounded-xl border border-white/10 bg-[#1C232E] opacity-60 p-6 relative">
                            <div className="absolute top-4 right-4 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">Próximamente</div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#15A4A2] to-[#40FDAE] flex items-center justify-center mb-4">
                                <Wand2 className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-xl font-bold mb-2 text-white">Ghost Studio</h4>
                            <p className="text-white/60">Edición profesional y mezcla de stems</p>
                        </div>
                        <a href="https://nova.son1kvers3.com" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/10 bg-[#1C232E] hover:border-[#B858FE]/50 transition-all group cursor-pointer p-6">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#047AF6] to-[#15A4A2] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-xl font-bold mb-2 text-white">Nova Post Pilot</h4>
                            <p className="text-white/60 mb-3">Automatiza tu presencia en redes sociales</p>
                            <span className="text-[#40FDAE] group-hover:text-[#15A4A2] text-sm underline-offset-4 group-hover:underline inline-block">Explorar →</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-[#122024]/30 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h3 className="text-4xl font-bold mb-4">Elige tu plan</h3>
                        <p className="text-white/60 text-lg">Desbloquea todo el potencial de la creación musical</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Free Tier */}
                        <div className="rounded-2xl border border-white/10 bg-[#1C232E] p-6 hover:border-white/20 transition-all">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold mb-2">Free</h4>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-bold">$0</span>
                                    <span className="text-white/50 text-sm">/mes</span>
                                </div>
                                <p className="text-white/60 text-sm">Para comenzar tu viaje musical</p>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#40FDAE]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#40FDAE] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">5 generaciones/mes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#40FDAE]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#40FDAE] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Calidad estándar</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#40FDAE]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#40FDAE] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Uso personal</span>
                                </li>
                            </ul>
                            <button className="w-full py-3 px-4 rounded-xl border border-white/20 hover:bg-white/5 transition-colors text-white text-sm">
                                Comenzar gratis
                            </button>
                        </div>

                        {/* Pro Tier */}
                        <div className="rounded-2xl border border-white/10 bg-[#1C232E] p-6 hover:border-white/20 transition-all">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold mb-2">Pro</h4>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-bold">$29</span>
                                    <span className="text-white/50 text-sm">/mes</span>
                                </div>
                                <p className="text-white/60 text-sm">Para creadores activos</p>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#15A4A2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#15A4A2] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">200 generaciones/mes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#15A4A2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#15A4A2] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Calidad alta (256kbps)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#15A4A2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#15A4A2] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Uso comercial</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#15A4A2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#15A4A2] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Soporte prioritario</span>
                                </li>
                            </ul>
                            <button className="w-full py-3 px-4 rounded-xl border border-[#15A4A2] hover:bg-[#15A4A2]/10 transition-colors text-white text-sm">
                                Comenzar ahora
                            </button>
                        </div>

                        {/* Premium Tier - Featured */}
                        <div className="rounded-2xl border-2 border-[#B858FE] bg-[#1C232E] p-6 relative overflow-hidden transform lg:scale-105 shadow-lg shadow-[#B858FE]/20">
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#B858FE] to-[#047AF6] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                POPULAR
                            </div>
                            <div className="mb-6 mt-4">
                                <h4 className="text-xl font-bold mb-2">Premium</h4>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-bold bg-gradient-to-r from-[#B858FE] to-[#047AF6] bg-clip-text text-transparent">$69</span>
                                    <span className="text-white/50 text-sm">/mes</span>
                                </div>
                                <p className="text-white/60 text-sm">Para profesionales</p>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#B858FE]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#B858FE] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">500 generaciones/mes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#B858FE]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#B858FE] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Calidad premium (320kbps)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#B858FE]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#B858FE] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Descarga de stems</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#B858FE]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#B858FE] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Acceso anticipado</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#B858FE]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#B858FE] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">API básica incluida</span>
                                </li>
                            </ul>
                            <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#B858FE] to-[#047AF6] hover:shadow-[0_0_20px_rgba(184,88,254,0.4)] transition-all text-white font-semibold text-sm">
                                Comenzar ahora
                            </button>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="rounded-2xl border border-white/10 bg-[#1C232E] p-6 hover:border-white/20 transition-all">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold mb-2">Enterprise</h4>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-3xl font-bold">Contacto</span>
                                </div>
                                <p className="text-white/60 text-sm">Soluciones a medida</p>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#047AF6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#047AF6] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Ilimitado</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#047AF6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#047AF6] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">API dedicada</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#047AF6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#047AF6] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Soporte 24/7</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#047AF6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#047AF6] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Modelos custom</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#047AF6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#047AF6] text-xs">✓</span>
                                    </div>
                                    <span className="text-white/80 text-sm">SLA garantizado</span>
                                </li>
                            </ul>
                            <button className="w-full py-3 px-4 rounded-xl border border-[#047AF6] hover:bg-[#047AF6]/10 transition-colors text-white text-sm">
                                Contactar ventas
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-white/40 text-sm mt-12">
                        Todos los planes incluyen acceso a nuevas funcionalidades y actualizaciones continuas
                    </p>
                </div>
            </section>


            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Logo size={40} className="opacity-80" />
                        <span className="text-xl font-bold">Son1kvers<span className="text-[#B858FE]">3</span></span>
                    </div>
                    <p className="text-white/40 italic mb-6">lo imperfecto también es sagrado</p>
                    <p className="text-sm text-white/30">© 2025 Son1kvers3. Todos los derechos reservados.</p>
                </div>
            </footer>

            {/* Floating Persistent Player */}
            {trackUrl && (
                <div className="fixed bottom-0 left-0 right-0 bg-[#0B121C]/95 backdrop-blur-xl border-t border-white/10 p-4 z-50 animate-in slide-in-from-bottom duration-300">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#B858FE] to-[#047AF6] flex items-center justify-center shrink-0 shadow-lg shadow-[#B858FE]/20 animate-pulse">
                                <Music className="w-6 h-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-white font-medium truncate text-base">Tu Canción Generada</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[#40FDAE] text-xs font-medium px-1.5 py-0.5 rounded bg-[#40FDAE]/10">NUEVA</span>
                                    <p className="text-white/40 text-xs truncate">Generado por Neural Engine</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Time */}
                            <div className="hidden md:block text-xs text-white/40 font-mono">
                                {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-4">
                                <button className="text-white/40 hover:text-white transition-colors hidden sm:block">
                                    <SkipBack className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={togglePlay}
                                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-transform active:scale-95 shadow-white/10 shadow-xl"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                                </button>

                                <button className="text-white/40 hover:text-white transition-colors hidden sm:block">
                                    <SkipForward className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4 border-l border-white/10 pl-6 hidden sm:flex">
                                <a
                                    href={trackUrl}
                                    download="son1k-track.mp3"
                                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                                    title="Descargar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#B858FE] to-[#047AF6] transition-all duration-100 ease-linear cursor-pointer group"
                        style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                        onClick={(e) => {
                            const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                            if (rect && audioRef.current) {
                                const x = e.clientX - rect.left;
                                const percent = x / rect.width;
                                audioRef.current.currentTime = percent * duration;
                            }
                        }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 -z-10" />
                </div>
            )}

            <Toaster position="bottom-center" toastOptions={{
                style: {
                    background: '#1C232E',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
            }} />

            <audio
                ref={audioRef}
                src={trackUrl || undefined}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={handleTimeUpdate}
            />

            {/* Extension Install Wizard */}
            <ExtensionInstallWizard
                isOpen={showExtensionWizard}
                onClose={() => setShowExtensionWizard(false)}
                onInstalled={() => {
                    setShowExtensionWizard(false);
                    toast.success('¡Extensión detectada! Generación habilitada.', {
                        duration: 5000,
                        icon: '🚀'
                    });
                }}
            />
        </div>
    );
};
