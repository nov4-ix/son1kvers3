import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { motion } from 'framer-motion';
import { User, Mail, Crown, Calendar, Shield } from 'lucide-react';

export default function Profile() {
  const { user, userTier } = useAuth();
  const [editing, setEditing] = useState(false);

  const tierBenefits = {
    FREE: { generations: 3, quality: ['standard'], features: ['Basic generation'] },
    CREATOR: { generations: 50, quality: ['standard', 'high'], features: ['Advanced editing', 'Ghost Studio Lite'] },
    PRO: { generations: 200, quality: ['standard', 'high', 'ultra'], features: ['All features', 'Ghost Studio', 'Nova Pilot'] },
    STUDIO: { generations: -1, quality: ['standard', 'high', 'ultra'], features: ['Enterprise', 'White label', 'Priority support'] },
  };

  const currentTier = userTier?.tier || 'FREE';
  const tierInfo = tierBenefits[currentTier as keyof typeof tierBenefits] || tierBenefits.FREE;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

      <div className="grid gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-carbón-dark border border-cian/20 rounded-xl p-6"
        >
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cian to-magenta flex items-center justify-center text-white text-3xl font-bold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {user?.email?.split('@')[0] || 'User'}
                </h2>
                {currentTier !== 'FREE' && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">{currentTier}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-carbón-dark border border-cian/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Subscription</h3>
            {currentTier === 'FREE' && (
              <a
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-cian to-magenta text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all"
              >
                Upgrade
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-carbón rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Generations</p>
              <p className="text-2xl font-bold text-white">
                {tierInfo.generations === -1 ? 'Unlimited' : tierInfo.generations}
              </p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
            
            <div className="bg-carbón rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Quality</p>
              <p className="text-2xl font-bold text-white">
                {tierInfo.quality.length}
              </p>
              <p className="text-xs text-gray-500">tiers available</p>
            </div>
            
            <div className="bg-carbón rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Used This Month</p>
              <p className="text-2xl font-bold text-white">
                {userTier?.usedThisMonth || 0}
              </p>
              <p className="text-xs text-gray-500">
                {userTier?.monthlyGenerations ? `of ${userTier.monthlyGenerations}` : 'of 3'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-gray-400 text-sm mb-3">Features included:</p>
            <div className="flex flex-wrap gap-2">
              {tierInfo.features.map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1 bg-cian/10 text-cian rounded-full text-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-carbón-dark border border-cian/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">ALVAE Status</h3>
            <Shield className="w-5 h-5 text-gray-400" />
          </div>
          
          <p className="text-gray-400 mb-4">
            ALVAE (Alpha Level Visionary Access Elite) is an exclusive badge for founding team and early adopters.
          </p>
          
          <div className="bg-carbón rounded-lg p-4">
            <p className="text-gray-400">You don't have ALVAE status yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Stay tuned for exclusive opportunities to join!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
