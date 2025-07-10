"use client";
import { motion } from 'framer-motion';
import { SparklesIcon, ArrowsRightLeftIcon, BeakerIcon, BanknotesIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

const features = [
  { name: 'Trade', icon: ArrowsRightLeftIcon, color: 'from-cyan-400 to-purple-500', href: '/swap', desc: 'Swap tokens instantly' },
  { name: 'Grow', icon: BeakerIcon, color: 'from-green-400 to-cyan-400', href: '/liquidity', desc: 'Earn yield easily' },
  { name: 'Borrow', icon: BanknotesIcon, color: 'from-purple-500 to-green-400', href: '/lending', desc: 'Borrow with one tap' },
  { name: 'Insights', icon: ChartBarIcon, color: 'from-cyan-400 to-green-400', href: '/analytics', desc: 'See your stats' },
  { name: 'Triggers', icon: ClockIcon, color: 'from-purple-500 to-cyan-400', href: '/limit-orders', desc: 'Set smart actions' },
];

export default function DashboardPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh]">
      {/* Animated AI Orb */}
      <motion.div
        className="hud-glass neon-border flex items-center justify-center w-40 h-40 mb-8 relative"
        animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 32px #22d3ee', '0 0 64px #a855f7', '0 0 32px #22d3ee'] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <SparklesIcon className="w-20 h-20 neon-text animate-pulse" />
        <div className="absolute bottom-2 w-full text-center text-xs neon-text">Hi! I’m your AI Agent. Ask me anything.</div>
      </motion.div>

      {/* Radial Feature Navigation */}
      <div className="flex flex-wrap justify-center gap-8">
        {features.map(({ name, icon: Icon, color, href, desc }) => (
          <motion.a
            key={name}
            href={href}
            className={`hud-glass neon-border flex flex-col items-center p-6 w-48 h-48 cursor-pointer transition-transform hover:scale-105 bg-gradient-to-br ${color}`}
            whileHover={{ scale: 1.08, boxShadow: '0 0 32px #22d3ee' }}
            whileTap={{ scale: 0.97 }}
          >
            <Icon className="w-12 h-12 neon-text mb-4" />
            <div className="text-xl font-bold neon-text mb-2">{name}</div>
            <div className="text-sm text-white/80">{desc}</div>
          </motion.a>
        ))}
      </div>
    </div>
  );
} 