import React from 'react';
import SmartPaymentSelector from '../components/SmartPaymentSelector';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0b0b0d] via-[#0f121a] to-[#0b0b0d] text-white p-6 relative">
            {/* Background similar to Generator */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(0, 191, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 191, 255, 0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    Back to Generator
                </Link>

                <SmartPaymentSelector />
            </div>
        </div>
    );
}
