import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Music,
  Palette,
  Zap,
  Users,
  Settings,
  ExternalLink,
  Star,
  Clock,
  TrendingUp,
  PlayCircle,
  ChevronRight
} from 'lucide-react'
import { Logo } from '@super-son1k/shared-ui'
import { APPS_CONFIG, AppConfig } from '../config/apps'
import { BRANDING } from '@super-son1k/shared-ui'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'primary' | 'social'>('all')

  const filteredApps = Object.entries(APPS_CONFIG).filter(([key, app]: [string, AppConfig]) => {
    if (selectedCategory === 'all') return true
    return app.category === selectedCategory
  })

  const stats = [
    { label: 'Canciones Generadas', value: '2.4K', icon: Music, color: 'text-cyan-400' },
    { label: 'Usuarios Activos', value: '847', icon: Users, color: 'text-purple-400' },
    { label: 'Proyectos Hoy', value: '156', icon: TrendingUp, color: 'text-green-400' },
    { label: 'Tiempo de Respuesta', value: '<2s', icon: Clock, color: 'text-yellow-400' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b0d] via-[#0f121a] to-[#0b0b0d] text-white">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0, 191, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 191, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#00bfff]/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size={45} showText={true} />
            <nav className="flex items-center gap-6">
              <Link to="/pricing" className="text-[#00bfff] hover:text-white transition-colors font-medium">
                Pricing
              </Link>
              <button className="bg-[#00bfff]/10 border border-[#00bfff]/30 rounded-lg px-4 py-2 text-[#00bfff] hover:bg-[#00bfff]/20 transition-all">
                <Settings size={18} />
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold mb-4">
            <span
              style={{
                background: BRANDING.gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Super-Son1k
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Plataforma completa de creación musical con IA. Genera, edita y comparte música de manera profesional.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#0f121a] border border-[#00bfff]/20 rounded-xl p-4"
              >
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-[#0f121a] border border-[#00bfff]/20 rounded-lg p-1 flex">
            {[
              { key: 'all', label: 'Todas las Apps', icon: Star },
              { key: 'primary', label: 'Herramientas', icon: Zap },
              { key: 'social', label: 'Social', icon: Users }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as any)}
                className={`px-6 py-3 rounded-md font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === key
                    ? 'bg-[#00bfff] text-black shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-[#00bfff]/10'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Apps Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredApps.map(([key, app], index) => {
            const appConfig = app as AppConfig
            return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                appConfig.status === 'active'
                  ? 'border-[#00bfff]/30 bg-[#0f121a] hover:border-[#00bfff] hover:shadow-lg hover:shadow-[#00bfff]/20'
                  : 'border-gray-600/30 bg-[#0f121a]/50 opacity-60'
              }`}
            >
              {/* Coming Soon Badge */}
              {appConfig.comingSoon && (
                <div className="absolute top-4 right-4 bg-[#ff49c3] text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                  Próximamente
                </div>
              )}

              <div className="p-6">
                {/* Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                    appConfig.status === 'active'
                      ? 'bg-[#00bfff]/20 text-[#00bfff]'
                      : 'bg-gray-600/20 text-gray-500'
                  }`}>
                    {appConfig.icon}
                  </div>
                  {appConfig.status === 'active' && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-2 text-white">{appConfig.name}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{appConfig.description}</p>

                {/* Features */}
                {appConfig.features && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {appConfig.features.slice(0, 2).map((feature: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[#00bfff]/10 border border-[#00bfff]/20 rounded text-xs text-[#00bfff]"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  {appConfig.status === 'active' ? (
                    <button
                      onClick={() => navigate(appConfig.path)}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#00bfff] to-[#ff49c3] text-white px-4 py-2 rounded-lg font-medium hover:from-[#00a8e6] hover:to-[#ff3dba] transition-all group-hover:shadow-lg group-hover:shadow-[#00bfff]/30"
                    >
                      <PlayCircle size={16} />
                      Abrir App
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <span className="text-gray-500 text-sm">En desarrollo</span>
                  )}

                  {appConfig.external && (
                    <ExternalLink size={16} className="text-gray-500" />
                  )}
                </div>
              </div>

              {/* Hover effect overlay */}
              {appConfig.status === 'active' && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#00bfff]/5 to-[#ff49c3]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
            </motion.div>
            )
          })}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 pt-8 border-t border-[#00bfff]/20"
        >
          <p className="text-gray-400 text-sm">
            © 2026 Super-Son1k. Tecnología de vanguardia para creadores musicales.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard