import React from 'react';
import { useDAWStore, Track } from '../../store/dawStore';
import { Volume2, Mic, Headphones, VolumeX } from 'lucide-react';
import { audioEngine } from '../../lib/audio/AudioEngine';

interface Props {
    track: Track;
}

export function TrackHeader({ track }: Props) {
    const { updateTrack, removeTrack, selectTrack, selectedTrackId } = useDAWStore();

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        updateTrack(track.id, { volume: vol });
        audioEngine.updateTrackVolume(track.id, vol);
    };

    return (
        <div
            className={`h-24 border-b border-gray-700 p-2 flex flex-col gap-2 shrink-0 cursor-pointer transition-colors ${selectedTrackId === track.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-750'}`}
            onClick={() => selectTrack(track.id)}
        >
            <div className="flex items-center justify-between">
                <input
                    type="text"
                    value={track.name}
                    onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                    className="bg-transparent text-white text-sm font-semibold w-24 focus:outline-none focus:border-b border-blue-500"
                />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }} />
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => updateTrack(track.id, { muted: !track.muted })}
                    className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center ${track.muted ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}
                >
                    M
                </button>
                <button
                    onClick={() => updateTrack(track.id, { soloed: !track.soloed })}
                    className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center ${track.soloed ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}`}
                >
                    S
                </button>
                <button
                    onClick={() => updateTrack(track.id, { isRecording: !track.isRecording })}
                    className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center ${track.isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-400'}`}
                >
                    <Mic size={12} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <Volume2 size={14} className="text-gray-400" />
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={track.volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        </div>
    );
}
