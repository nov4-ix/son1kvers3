import { useEffect, useState } from 'react'

/**
 * Hook to detect the secret key combination for accessing Nexus Mode
 * Trigger: Ctrl+Alt+H (Cmd+Option+H on Mac)
 * 
 * "Ctrl+Alt+Humanity" - The slogan of the resistance
 * 
 * @returns true when the combination is pressed
 */
export function useSecretKey(): boolean {
    const [triggered, setTriggered] = useState(false)

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // "Ctrl+Alt+Humanity" - The resistance slogan
            // Ctrl+Alt+H on Windows/Linux, Cmd+Option+H on Mac
            if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'h') {
                setTriggered(true)
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    return triggered
}
