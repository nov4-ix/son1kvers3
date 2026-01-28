import React, { useRef } from 'react';
import { useDAWStore } from '../../store/dawStore';

export function Timeline() {
    const { zoom, currentTime, setCurrentTime } = useDAWStore();
    const containerRef = useRef<HTMLDivElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = x / zoom;
        setCurrentTime(time);
    };

    return (
        <div
            ref={containerRef}
            className="h-8 bg-gray-900 border-b border-gray-700 relative cursor-pointer shrink-0"
            onClick={handleClick}
            style={{ minWidth: '100%' }}
        >
            {/* Time Markers */}
            <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 100 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-gray-700 text-[10px] text-gray-500 pl-1"
                        style={{ left: i * zoom }}
                    >
                        {i}s
                    </div>
                ))}
            </div>

            {/* Playhead */}
            <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
                style={{ left: currentTime * zoom }}
            >
                <div className="w-3 h-3 -ml-1.5 bg-red-500 transform rotate-45 -mt-1.5" />
            </div>
        </div>
    );
}
