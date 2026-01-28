import { useEffect, useState } from 'react'

interface MatrixRainProps {
    density?: number
}

/**
 * Matrix-style falling characters effect
 */
export function MatrixRain({ density = 0.5 }: MatrixRainProps) {
    const [chars, setChars] = useState<Array<{ id: number; left: number; delay: number }>>([])

    useEffect(() => {
        const charCount = Math.floor(window.innerWidth / 20 * density)
        const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'

        const newChars = Array.from({ length: charCount }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 3,
        }))

        setChars(newChars)
    }, [density])

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {chars.map((char) => (
                <div
                    key={char.id}
                    className="matrix-char"
                    style={{
                        left: `${char.left}%`,
                        animationDelay: `${char.delay}s`,
                    }}
                >
                    {String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))}
                </div>
            ))}
        </div>
    )
}
