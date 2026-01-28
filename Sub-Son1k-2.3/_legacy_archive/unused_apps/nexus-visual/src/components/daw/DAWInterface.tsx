import React, { useEffect, useRef, useState } from 'react';
import { useDAWStore } from '../../store/dawStore';
import { audioEngine } from '../../lib/audio/AudioEngine';
import { Play, Pause, Square, Plus, Mic, Volume2, Scissors, Magnet, Save, FolderOpen } from 'lucide-react';
import { TrackHeader } from './TrackHeader';
import { Timeline } from './Timeline';
import { TrackLane } from './TrackLane';
import { PluginRack } from './PluginRack';
import { useAnalyzer } from '../../hooks/useAnalyzer';

export function DAWInterface() {
    const {
        tracks,
        isPlaying,
        currentTime,
        addTrack,
        setIsPlaying,
        setCurrentTime,
        snapToGrid,
        toggleSnap,
        selectedTrackId,
        selectedClipId,
        saveProject,
        loadProject,
        addClip
    } = useDAWStore();

    const [isReady, setIsReady] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzerActive, setIsAnalyzerActive] = useState(false);
    const { runAnalysis } = useAnalyzer();

    useEffect(() => {
        audioEngine.init().then(() => setIsReady(true));
    }, []);

    const handlePlayPause = () => {
        if (isPlaying) {
            setIsPlaying(false);
            audioEngine.stopAll();
            if (isRecording) {
                stopRecording();
            }
        } else {
            setIsPlaying(true);
            audioEngine.startPlayback(currentTime);
            if (isRecording) {
                // Si ya estaba en modo grabación (pre-armado), iniciar grabación real
                startRecordingProcess();
            }
        }
    };

    const handleRecordToggle = () => {
        if (isRecording) {
            // Si estamos grabando, detener
            setIsRecording(false);
            if (isPlaying) {
                handlePlayPause(); // Detener todo
            }
        } else {
            // Armar grabación global
            setIsRecording(true);
            // Si ya está reproduciendo, iniciar grabación al vuelo (punch-in) - TODO
            // Por ahora, requerimos iniciar desde stop para simplificar
            if (!isPlaying) {
                handlePlayPause(); // Iniciar reproducción y grabación
            }
        }
    };

    const startRecordingProcess = async () => {
        // Buscar track armado
        const armedTrack = tracks.find(t => t.isRecording);
        if (armedTrack) {
            await audioEngine.startRecording(armedTrack.id);
        } else {
            alert('No track armed for recording! Click the "R" button on a track.');
            setIsRecording(false);
            setIsPlaying(false); // Abortar
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        const result = await audioEngine.stopRecording();
        if (result) {
            const { trackId, buffer } = result;
            // Crear nuevo clip
            const newClip = {
                id: Math.random().toString(36).substr(2, 9),
                trackId,
                audioBuffer: buffer,
                url: '', // TODO: Create blob URL if needed for UI
                startTime: currentTime, // TODO: Ajustar al tiempo real de inicio de grabación
                duration: buffer.duration,
                offset: 0,
                name: `Recording ${new Date().toLocaleTimeString()}`,
                color: '#FF4444'
            };
            addClip(newClip);
        }
    };

    const handleStop = () => {
        audioEngine.stopAll();
        setIsPlaying(false);
        setCurrentTime(0);
    };

    // Actualizar tiempo visualmente durante reproducción
    useEffect(() => {
        let raf: number;
        if (isPlaying) {
            const startTime = performance.now();
            const startAudioTime = currentTime;

            const loop = () => {
                const elapsed = (performance.now() - startTime) / 1000;
                setCurrentTime(startAudioTime + elapsed);
                raf = requestAnimationFrame(loop);
            };
            raf = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(raf);
    }, [isPlaying]);

    return (
        <div className="flex flex-col h-[800px] bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            {/* Toolbar */}
            <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePlayPause}
                        className={`p-2 rounded-full ${isPlaying ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black'}`}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                        onClick={handleRecordToggle}
                        className={`p-3 rounded-full ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-red-500 hover:bg-gray-700'}`}
                    >
                        <Mic size={20} />
                    </button>
                    <div className="w-px h-8 bg-gray-700 mx-2" />
                    <div className="font-mono text-xl text-cyan-400">
                        {formatTime(currentTime)}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            saveProject();
                            alert('Project Saved!');
                        }}
                        className="p-2 rounded text-gray-400 hover:bg-gray-700 hover:text-neon-cyan"
                        title="Save Project"
                    >
                        <Save size={18} />
                    </button>
                    <button
                        onClick={() => {
                            const tracks = loadProject();
                            if (tracks) {
                                alert('Project Loaded!');
                                // TODO: Rehydrate AudioEngine here
                            }
                        }}
                        className="p-2 rounded text-gray-400 hover:bg-gray-700 hover:text-neon-cyan"
                        title="Load Project"
                    >
                        <FolderOpen size={18} />
                    </button>
                    {/* Analyzer / Fidelity Control */}
                    <div className="flex items-center gap-2 bg-gray-900 p-1 rounded border border-gray-700 ml-2">
                        <div className="flex items-center gap-1 px-2">
                            <span className="text-[10px] uppercase text-gray-400 font-semibold">Maqueta</span>
                            <button
                                onClick={() => setIsAnalyzerActive(!isAnalyzerActive)}
                                className={`w-8 h-4 rounded-full relative transition-colors ${isAnalyzerActive ? 'bg-neon-cyan' : 'bg-gray-600'}`}
                                title="Enable Analysis for Generation Adherence"
                            >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${isAnalyzerActive ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>

                        {isAnalyzerActive && (
                            <div className="flex items-center gap-2 px-2 border-l border-gray-700">
                                <span className="text-[10px] text-gray-400">Fidelity</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    defaultValue="80"
                                    className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                                    title="Adherence to Original (0-100%)"
                                />
                            </div>
                        )}
                    </div>
                    <div className="w-px h-8 bg-gray-700 mx-2" />
                    <button
                        onClick={toggleSnap}
                        className={`p-2 rounded ${snapToGrid ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                        title="Snap to Grid"
                    >
                        <Magnet size={18} />
                    </button>
                    <button className="p-2 rounded text-gray-400 hover:bg-gray-700" title="Split Tool">
                        <Scissors size={18} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Track Headers (Left) */}
                <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
                    {tracks.map(track => (
                        <TrackHeader key={track.id} track={track} />
                    ))}
                    <button
                        onClick={() => addTrack()}
                        className="m-2 p-2 border-2 border-dashed border-gray-600 rounded text-gray-400 hover:border-gray-400 hover:text-gray-200 flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add Track
                    </button>
                </div>

                {/* Timeline & Lanes (Right) */}
                <div className="flex-1 flex flex-col bg-gray-900 overflow-x-auto relative">
                    <Timeline />
                    <div className="flex-1 relative">
                        {/* Grid Background */}
                        <div className="absolute inset-0 pointer-events-none opacity-10"
                            style={{ backgroundImage: 'linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '50px 100%' }}
                        />

                        {tracks.map(track => (
                            <TrackLane key={track.id} track={track} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Plugin Rack (Bottom) */}
            {selectedTrackId && (
                <PluginRack trackId={selectedTrackId} />
            )}
        </div>
    );
}

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
