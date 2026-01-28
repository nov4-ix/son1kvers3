import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    isPlaying: boolean;
    color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, color = '#00FFE7' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const bars = 30;
        const barWidth = canvas.width / bars;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < bars; i++) {
                // Simulate frequency data
                const height = isPlaying
                    ? Math.random() * canvas.height * 0.8 + 10
                    : 5;

                const x = i * barWidth;
                const y = canvas.height - height;

                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, '#B84DFF');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth - 2, height);

                // Reflection effect
                ctx.globalAlpha = 0.2;
                ctx.fillRect(x, canvas.height, barWidth - 2, height * 0.5);
                ctx.globalAlpha = 1.0;
            }

            if (isPlaying) {
                animationId = requestAnimationFrame(draw);
            } else {
                // Draw static low bars when paused
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < bars; i++) {
                    const height = 5;
                    const x = i * barWidth;
                    const y = canvas.height - height;
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, barWidth - 2, height);
                }
            }
        };

        draw();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [isPlaying, color]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className="w-full h-16 rounded-lg opacity-80"
        />
    );
};
