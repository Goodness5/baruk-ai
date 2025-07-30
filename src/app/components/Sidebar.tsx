"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon, 
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BeakerIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, emoji: '🏠' },
    { name: 'Swap', href: '/swap', icon: ArrowsRightLeftIcon, emoji: '🔄' },
    { name: 'Liquidity', href: '/liquidity', icon: BeakerIcon, emoji: '💧' },
    { name: 'Pools', href: '/pools', icon: BanknotesIcon, emoji: '🏦' },
    { name: 'Lending', href: '/lending', icon: CurrencyDollarIcon, emoji: '💰' },
    { name: 'Limit Orders', href: '/limit-orders', icon: ClipboardDocumentListIcon, emoji: '📜' },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, emoji: '📊' },
    { name: 'Scryer', href: '/scryer', icon: SparklesIcon, emoji: '✨' },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, emoji: '⚙️' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 rounded-xl bg-gradient-to-r from-purple-600/90 to-pink-600/90 border border-purple-400/40 backdrop-blur-sm shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMobileOpen ? (
            <XMarkIcon className="h-6 w-6 text-white" />
          ) : (
            <Bars3Icon className="h-6 w-6 text-white" />
          )}
        </motion.button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-purple-900/95 to-blue-900/95 border-r border-purple-400/40 backdrop-blur-sm z-40">
        <div className="flex flex-col h-full w-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-purple-400/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Magic Finance
                </h1>
                <p className="text-sm text-gray-400">AI-Powered Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600/60 to-pink-600/60 border border-purple-400/50 text-white shadow-lg'
                          : 'hover:bg-white/10 text-gray-300 hover:text-white hover:border-purple-400/30 border border-transparent'
                      }`}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.emoji}</span>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                      </div>
                      <span className="font-medium text-sm">{item.name}</span>
                      {isActive && (
                        <motion.div
                          className="ml-auto w-2 h-2 rounded-full bg-purple-400"
                          layoutId="activeIndicator"
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-purple-400/20">
            <div className="text-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-400/30">
                <p className="text-sm font-bold text-green-400">🚀 Ready to Win!</p>
                <p className="text-xs text-gray-400 mt-1">Hackathon Mode</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              className="lg:hidden fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-purple-900/98 to-blue-900/98 border-r border-purple-400/40 backdrop-blur-sm z-50"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="p-6 border-b border-purple-400/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          Magic Finance
                        </h1>
                        <p className="text-xs text-gray-400">AI-Powered</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 p-4">
                  <div className="space-y-3">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.name} href={item.href} onClick={() => setIsMobileOpen(false)}>
                          <motion.div
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-purple-600/60 to-pink-600/60 border border-purple-400/50 text-white shadow-lg'
                                : 'hover:bg-white/10 text-gray-300 hover:text-white border border-transparent hover:border-purple-400/30'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{item.emoji}</span>
                              <item.icon className="h-6 w-6 flex-shrink-0" />
                            </div>
                            <span className="font-medium">{item.name}</span>
                            {isActive && (
                              <motion.div
                                className="ml-auto w-3 h-3 rounded-full bg-purple-400"
                                layoutId="mobileActiveIndicator"
                              />
                            )}
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                {/* Mobile Bottom */}
                <div className="p-4 border-t border-purple-400/20">
                  <div className="text-center">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-400/30">
                      <p className="text-sm font-bold text-green-400">🏆 Hackathon Ready!</p>
                      <p className="text-xs text-gray-400 mt-1">Winning Mode Activated</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}