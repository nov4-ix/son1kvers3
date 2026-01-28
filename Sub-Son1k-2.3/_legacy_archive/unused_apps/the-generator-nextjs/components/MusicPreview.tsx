'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as Tone from 'tone';
import { Play, Pause, Volume2, Download, Share2 } from 'lucide-react';
import { GenerationWebSocketClient } from '../lib/websocket-client';

interface MusicPreviewProps {
    generationId: string;
    serverUrl?: string;
}

export function MusicPreview({ generationId, serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001' }: MusicPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playerRef = useRef<Tone.Player | null>(null);
    const wsRef = useRef<GenerationWebSocketClient | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'queued' | 'processing' | 'ready' | 'complete' | 'failed'>('queued');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.8);

    // Initialize WebSocket
    useEffect(() => {
        const ws = new GenerationWebSocketClient(serverUrl);
        wsRef.current = ws;

        ws.on('generation:progress', (data: any) => {
            setProgress(data.progress);
            setStatus(data.status);

            if (data.audioUrl) setAudioUrl(data.audioUrl);
            if (data.previewUrl && !audioUrl) setAudioUrl(data.previewUrl);
        });

        ws.connect(generationId);

        return () => {
            ws.disconnect();
            playerRef.current?.dispose();
        };
    }, [generationId, serverUrl]);

    // Initialize Tone.js player when audio is ready
    useEffect(() => {
        if (audioUrl && !playerRef.current) {
            const player = new Tone.Player({
                url: audioUrl,
                onload: () => {
                    setDuration(player.buffer.duration);
                    drawWaveform(player.buffer);
                }
            }).toDestination();

            player.volume.value = Tone.gainToDb(volume);
            playerRef.current = player;
        }
    }, [audioUrl]);

    // Draw waveform
    const drawWaveform = (buffer: Tone.ToneAudioBuffer) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d')!;
        const data = buffer.toArray(0) as Float32Array;
        const step = Math.ceil(data.length / canvas.width);
        const amp = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#0b0b0d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Waveform
        ctx.beginPath();
        ctx.strokeStyle = '#00bfff';
        ctx.lineWidth = 2;

        for (let i = 0; i < canvas.width; i++) {
            const min = Math.min(...data.slice(i * step, (i + 1) * step));
            const max = Math.max(...data.slice(i * step, (i + 1) * step));

            ctx.moveTo(i, (1 + min) * amp);
            ctx.lineTo(i, (1 + max) * amp);
        }

        ctx.stroke();
    };

    // Playback control
    const togglePlay = async () => {
        if (!playerRef.current) return;

        await Tone.start();

        if (isPlaying) {
            playerRef.current.stop();
            setIsPlaying(false);
        } else {
            playerRef.current.start();
            setIsPlaying(true);

            // Update progress
            const updateInterval = setInterval(() => {
                if (playerRef.current && Tone.Transport.state === 'started') {
                    setCurrentTime(Tone.Transport.seconds);
                } else {
                    clearInterval(updateInterval);
                }
            }, 100);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!playerRef.current || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        const seekTime = percent * duration;

        playerRef.current.stop();
        playerRef.current.start('+0', seekTime);
        setCurrentTime(seekTime);
    };

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (playerRef.current) {
            playerRef.current.volume.value = Tone.gainToDb(newVolume);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 shadow-2xl"
        >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'complete' ? 'bg-green-500' :
                            status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                                status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                    <span className="text-sm text-gray-400 capitalize">{status}</span>
                </div>

                {status === 'processing' && (
                    <span className="text-sm font-mono text-cyan-400">{Math.round(progress)}%</span>
                )}
            </div>

            {/* Waveform Canvas */}
            <canvas
                ref={canvasRef}
                width={800}
                height={120}
                className="w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleSeek}
            />

            {/* Progress Bar */}
            {status !== 'queued' && (
                <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : progress}%` }}
                        transition={{ duration: 0.1 }}
                    />
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={togglePlay}
                        disabled={!audioUrl}
                        className="p-3 rounded-full bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>

                    <div className="flex items-center gap-2">
                        <Volume2 size={18} className="text-gray-400" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="w-20 accent-cyan-500"
                        />
                    </div>

                    <span className="text-sm font-mono text-gray-400">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                        <Share2 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                        <Download size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
