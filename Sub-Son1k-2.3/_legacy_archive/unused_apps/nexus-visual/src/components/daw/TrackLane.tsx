import React from 'react';
import { useDAWStore, Track, Clip } from '../../store/dawStore';

interface Props {
    track: Track;
}

export function TrackLane({ track }: Props) {
    const { zoom, selectedClipId, selectClip } = useDAWStore();

    return (
        <div className="h-24 border-b border-gray-800 relative shrink-0 bg-gray-900/50">
            {track.clips.map(clip => (
                <ClipView
                    key={clip.id}
                    clip={clip}
                    zoom={zoom}
                    isSelected={selectedClipId === clip.id}
                    onSelect={() => selectClip(clip.id)}
                    color={track.color}
                />
            ))}
        </div>
    );
}

function ClipView({ clip, zoom, isSelected, onSelect, color }: { clip: Clip, zoom: number, isSelected: boolean, onSelect: () => void, color: string }) {
    return (
        <div
            className={`absolute top-1 bottom-1 rounded-md overflow-hidden cursor-pointer border ${isSelected ? 'border-white ring-1 ring-white' : 'border-transparent'}`}
            style={{
                left: clip.startTime * zoom,
                width: clip.duration * zoom,
                backgroundColor: color + '80', // Add transparency
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            <div className="px-2 py-1 text-xs text-white font-medium truncate shadow-sm">
                {clip.name}
            </div>
            {/* Waveform placeholder */}
            <div className="absolute inset-0 opacity-30 flex items-center">
                <div className="w-full h-1/2 bg-black/20" />
            </div>
        </div>
    );
}
