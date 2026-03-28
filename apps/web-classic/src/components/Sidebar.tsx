import { motion } from 'framer-motion'
import { 
  Home, 
  Music, 
  Mic, 
  Zap, 
  Eye, 
  Users, 
  Shield,
  ExternalLink
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Main dashboard'
  },
  {
    name: 'The Generator',
    href: '/generator',
    icon: Music,
    description: 'AI music generation',
    external: 'https://the-generator.super-son1k.com'
  },
  {
    name: 'Ghost Studio',
    href: '/ghost-studio',
    icon: Mic,
    description: 'Music production DAW',
    external: 'https://ghost-studio.super-son1k.com'
  },
  {
    name: 'Nova Post Pilot',
    href: '/nova-post',
    icon: Zap,
    description: 'Marketing intelligence',
    external: 'https://nova-post.super-son1k.com'
  },
  {
    name: 'Nexus Visual',
    href: '/nexus-visual',
    icon: Eye,
    description: 'Immersive experience',
    external: 'https://nexus-visual.super-son1k.com'
  },
  {
    name: 'Sanctuary Social',
    href: '/sanctuary',
    icon: Users,
    description: 'Creator community',
    external: 'https://sanctuary.super-son1k.com'
  },
  {
    name: 'Admin Panel',
    href: '/admin',
    icon: Shield,
    description: 'Administration',
    requiresAuth: true
  }
]

export function Sidebar() {
  const { isAuthenticated } = useAuth()

  return (
    <aside className="w-64 bg-[#1a1a1a] border-r border-[#333] min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isExternal = item.external
          const requiresAuth = item.requiresAuth
          
          // Skip admin panel if not authenticated
          if (requiresAuth && !isAuthenticated) {
            return null
          }

          const content = (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#333]"
            >
              <Icon className="text-gray-400 group-hover:text-[#00FFE7] transition-colors" size={20} />
              <div className="flex-1">
                <div className="text-sm font-medium text-white group-hover:text-[#00FFE7] transition-colors">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500">
                  {item.description}
                </div>
              </div>
              {isExternal && (
                <ExternalLink className="text-gray-400 group-hover:text-[#00FFE7] transition-colors" size={14} />
              )}
            </motion.div>
          )

          if (isExternal) {
            return (
              <a
                key={item.name}
                href={item.external}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            )
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `block ${isActive ? 'bg-[#333]' : ''}`
              }
            >
              {content}
            </NavLink>
          )
        })}
      </nav>

      {/* System Status */}
      <div className="absolute bottom-4 left-4 right-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#333] rounded-lg p-3"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-300">System Online</span>
          </div>
          <div className="text-xs text-gray-500">
            All services operational
          </div>
        </motion.div>
      </div>
    </aside>
  )
}
