import React from 'react'
import { BRANDING } from '../branding'

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
  variant?: 'default' | 'minimal' | 'cyber'
}

export const Logo: React.FC<LogoProps> = ({
  size = 60,
  showText = true,
  className = '',
  variant = 'default'
}) => {
  const renderLogo = () => {
    switch (variant) {
      case 'minimal':
        return (
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="minimalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: BRANDING.colors.primary }} />
                <stop offset="100%" style={{ stopColor: BRANDING.colors.secondary }} />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" stroke="url(#minimalGrad)" strokeWidth="2" fill="none" />
            <path d="M20 8 L32 28 L8 28 Z" stroke="url(#minimalGrad)" strokeWidth="1.5" fill="none" />
            <circle cx="20" cy="20" r="6" stroke="url(#minimalGrad)" strokeWidth="1.5" fill="none" />
          </svg>
        )

      case 'cyber':
        return (
          <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: BRANDING.colors.primary }} />
                <stop offset="50%" style={{ stopColor: BRANDING.colors.secondary }} />
                <stop offset="100%" style={{ stopColor: BRANDING.colors.accent }} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Cyber grid background */}
            <rect width="60" height="60" fill="none" />
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="url(#cyberGrad)" strokeWidth="0.2" opacity="0.3"/>
            </pattern>
            <rect width="60" height="60" fill="url(#grid)" />
            {/* Main logo */}
            <circle cx="30" cy="30" r="25" stroke="url(#cyberGrad)" strokeWidth="1" fill="none" filter="url(#glow)" opacity="0.8" />
            <path d="M 30 10 L 50 45 L 10 45 Z" stroke="url(#cyberGrad)" strokeWidth="1.5" fill="none" filter="url(#glow)" />
            <circle cx="30" cy="30" r="8" stroke="url(#cyberGrad)" strokeWidth="1.5" fill="none" />
            <circle cx="30" cy="30" r="3" fill="url(#cyberGrad)" filter="url(#glow)" />
          </svg>
        )

      default: // 'default'
        return (
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: BRANDING.colors.primary }} />
                <stop offset="50%" style={{ stopColor: BRANDING.colors.secondary }} />
                <stop offset="100%" style={{ stopColor: BRANDING.colors.accent }} />
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0, 191, 255, 0.3)"/>
              </filter>
            </defs>
            {/* Outer ring */}
            <circle cx="100" cy="100" r="90" stroke="url(#logoGrad)" strokeWidth="2" fill="none" opacity="0.3" />
            {/* Main triangle */}
            <path d="M 100 30 L 170 150 L 30 150 Z" stroke="url(#logoGrad)" strokeWidth="2" fill="none" filter="url(#shadow)" />
            {/* Inner circle */}
            <circle cx="100" cy="100" r="25" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
            {/* Center dot */}
            <circle cx="100" cy="100" r="8" fill="url(#logoGrad)" filter="url(#shadow)" />
            {/* Connecting lines */}
            <line x1="100" y1="30" x2="100" y2="75" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.6" />
            <line x1="30" y1="150" x2="65" y2="112.5" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.6" />
            <line x1="170" y1="150" x2="135" y2="112.5" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.6" />
            {/* Corner accents */}
            <circle cx="30" cy="30" r="3" fill="url(#logoGrad)" opacity="0.7" />
            <circle cx="170" cy="30" r="3" fill="url(#logoGrad)" opacity="0.7" />
            <circle cx="30" cy="170" r="3" fill="url(#logoGrad)" opacity="0.7" />
            <circle cx="170" cy="170" r="3" fill="url(#logoGrad)" opacity="0.7" />
          </svg>
        )
    }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div style={{ width: size, height: size }}>
        {renderLogo()}
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className="text-xl font-bold"
            style={{
              background: BRANDING.gradients.header,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {BRANDING.name}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {BRANDING.tagline}
          </span>
        </div>
      )}
    </div>
  )
}