import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import './index.css'

// Import components
import { PixelChatAdvanced } from './components/PixelChatAdvanced'
import { StripeCheckout, pricingTiers } from './components/StripeCheckout'
import { TheGeneratorPage } from './components/Generator/TheGeneratorPage'
import { TheGeneratorExpress } from './components/TheGeneratorExpress'
import { TransitionOverlay } from './components/TransitionOverlay'
import { AppNavigation } from './components/AppNavigation'
import Dashboard from './pages/Dashboard'
import { useSecretKey } from './hooks/useSecretKey'
import { AuthProvider } from './providers/AuthProvider'

// @ts-ignore
import { NovaPostPilot } from '@super-son1k/nova-post-pilot'
import '@super-son1k/nova-post-pilot/src/lib/i18n'
// @ts-ignore
import { GhostStudio } from '@super-son1k/ghost-studio'
import '@super-son1k/ghost-studio/src/styles/ghost.css'

// Main App Component
function App() {
  const location = useLocation()
  const [isChatOpen, setIsChatOpen] = React.useState(true) // Open by default

  // Easter Egg: Secret Key detection
  const secretTriggered = useSecretKey()
  const [showTransition, setShowTransition] = React.useState(false)

  // Handle Secret Key trigger
  React.useEffect(() => {
    if (secretTriggered) {
      setShowTransition(true)
    }
  }, [secretTriggered])

  // Navigate to Nexus after transition completes
  const handleTransitionComplete = () => {
    window.location.href = 'https://nexus-visual-am0iwec7d-son1kvers3s-projects-c805d053.vercel.app'
  }

  return (
    <div className="min-h-screen bg-[#171925] text-white overflow-x-hidden">
      {/* Routes */}
      <AppNavigation />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/generator" element={<TheGeneratorPage />} />
        <Route path="/nova" element={<NovaPostPilot />} />
        <Route path="/ghost-studio" element={<GhostStudio />} />
      </Routes>

      {/* Pixel Chat Floating Interface */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-4 pointer-events-none">

        {/* Pixel Chat Window */}
        <div className="pointer-events-auto">
          <PixelChatAdvanced
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </div>

        {/* Floating Toggle Button (Only visible when chat is closed) */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="pointer-events-auto w-14 h-14 bg-gradient-to-r from-[#40FDAE] to-[#B858FE] rounded-full shadow-[0_0_20px_rgba(64,253,174,0.4)] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer animate-float"
          >
            <div className="w-8 h-8 bg-[#171925] rounded-lg flex items-center justify-center">
              <span className="text-xl">👾</span>
            </div>
          </button>
        )}
      </div>

      {/* Epic Transition Overlay */}
      <TransitionOverlay
        isActive={showTransition}
        onComplete={handleTransitionComplete}
      />
    </div>
  )
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  </React.StrictMode>
)
