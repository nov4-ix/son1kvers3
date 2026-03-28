import React, { useEffect } from 'react'

export function TheGeneratorPage() {
  useEffect(() => {
    console.log('🔴 THE GENERATOR LOADED - ROUTING WORKS!')
  }, [])

  return (
    <div style={{
      background: '#FF0000',
      color: 'white',
      padding: '50px',
      minHeight: '100vh',
      fontSize: '24px',
      textAlign: 'center'
    }}>
      <h1>🎵 THE GENERATOR PAGE WORKS! 🎵</h1>
      <h2>Background is RED to confirm it's not the old dashboard</h2>
      <p>Routing is working correctly!</p>
      <p>If you see this RED background, the migration worked!</p>
    </div>
  )
}
