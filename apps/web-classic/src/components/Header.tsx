import { motion } from 'framer-motion'
import { Music, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'

export function Header() {
  const { user, userTier, signOut, setShowAuthModal } = useAuth()

  return (
    <header className="bg-[#1a1a1a] border-b border-[#333] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <Music className="text-[#00FFE7]" size={24} />
            <span className="text-xl font-bold text-[#00FFE7]">
              Super-Son1k-2.0
            </span>
          </motion.div>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-300">{user.email}</div>
                <div className="text-xs text-[#00FFE7]">
                  {userTier?.tier || 'FREE'} • {userTier?.monthlyGenerations - userTier?.usedThisMonth || 0} generations left
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Settings size={18} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={signOut}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <LogOut size={18} />
                </motion.button>
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAuthModal(true)}
              className="bg-[#00FFE7] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#00FFE7]/90 transition-colors"
            >
              Sign In
            </motion.button>
          )}
        </div>
      </div>
    </header>
  )
}
