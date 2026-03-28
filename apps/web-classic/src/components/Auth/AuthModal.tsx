import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Github } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import toast from 'react-hot-toast'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { signIn, signUp, signInWithGoogle, signInWithFacebook } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
        toast.success('Welcome back!')
      } else {
        await signUp(email, password, username)
        toast.success('Account created! Check your email to verify.')
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      toast.success('Signed in with Google!')
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed')
    }
  }

  const handleFacebookSignIn = async () => {
    try {
      await signInWithFacebook()
      toast.success('Signed in with Facebook!')
    } catch (error: any) {
      toast.error(error.message || 'Facebook sign-in failed')
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 w-full max-w-md relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#00FFE7] mb-2">
              {isLogin ? 'Welcome Back' : 'Join Super-Son1k'}
            </h2>
            <p className="text-gray-400">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#333] border border-[#555] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00FFE7] focus:ring-1 focus:ring-[#00FFE7]"
                    placeholder="Enter your username"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#333] border border-[#555] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00FFE7] focus:ring-1 focus:ring-[#00FFE7]"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#333] border border-[#555] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00FFE7] focus:ring-1 focus:ring-[#00FFE7]"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00FFE7] text-black font-semibold py-2 px-4 rounded-lg hover:bg-[#00FFE7]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#333]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1a1a1a] text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleGoogleSignIn}
                className="w-full inline-flex justify-center py-2 px-4 border border-[#333] rounded-lg shadow-sm bg-[#333] text-sm font-medium text-white hover:bg-[#444] transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="ml-2">Google</span>
              </button>

              <button
                onClick={handleFacebookSignIn}
                className="w-full inline-flex justify-center py-2 px-4 border border-[#333] rounded-lg shadow-sm bg-[#333] text-sm font-medium text-white hover:bg-[#444] transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="ml-2">Facebook</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#00FFE7] hover:text-[#00FFE7]/80 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
