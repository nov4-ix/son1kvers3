import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../providers/AuthProvider';
import { motion } from 'framer-motion';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase?.auth.getSession();
      
      if (error) {
        console.error('Auth error:', error);
        navigate('/pricing?error=auth_failed');
        return;
      }

      navigate('/dashboard');
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-carbón flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-cian border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">Completing sign in...</h2>
        <p className="text-gray-400">Please wait while we redirect you</p>
      </motion.div>
    </div>
  );
}
