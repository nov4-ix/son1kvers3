import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { motion } from 'framer-motion';
import { Settings, Bell, Lock, Palette, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      toast.success('Account deletion requested');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <Settings className="w-8 h-8 text-cian" />
        Settings
      </h1>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-carbón-dark border border-cian/20 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-cian" />
            Notifications
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Email notifications</span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-5 h-5 rounded bg-carbón border-cian/30 text-cian focus:ring-cian"
              />
            </label>
            <p className="text-sm text-gray-500">
              Receive updates about your generations and account
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-carbón-dark border border-cian/20 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Palette className="w-5 h-5 text-cian" />
            Appearance
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Dark mode</span>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="w-5 h-5 rounded bg-carbón border-cian/30 text-cian focus:ring-cian"
              />
            </label>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-carbón-dark border border-cian/20 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cian" />
            Account
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-700">
              <div>
                <p className="text-white">Email</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="w-full py-3 bg-carbón border border-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-carbón-dark border border-red-500/20 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h2>

          <p className="text-gray-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>

          <button
            onClick={handleDeleteAccount}
            className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Delete Account
          </button>
        </motion.div>
      </div>
    </div>
  );
}
