"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
  ClipboardDocumentListIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Exchange', href: '/swap', icon: ArrowsRightLeftIcon },
    { name: 'Trading Hub', href: '/trading', icon: ChartBarIcon },
    { name: 'AI Trading', href: '/ai-trading', icon: CpuChipIcon },
    { name: 'Liquidity', href: '/liquidity', icon: BeakerIcon },
    { name: 'Pools', href: '/pools', icon: BanknotesIcon },
    { name: 'Lending', href: '/lending', icon: CurrencyDollarIcon },
    { name: 'Limit Orders', href: '/limit-orders', icon: ClipboardDocumentListIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Scryer', href: '/scryer', icon: SparklesIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <aside className="flex md:flex-col w-full md:w-56 bg-gradient-to-b from-[#3a1c4a] via-[#2d193c] to-[#1e2e2e] p-4 md:p-6 space-y-4 shadow-lg">

      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-2xl font-bold tracking-tight bg-gradient-to-r from-green-400 via-purple-400 to-purple-700 bg-clip-text text-transparent">
          Baruk DeFi
        </Link>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="md:hidden text-gray-300 hover:text-white">
          {isCollapsed ? <Bars3Icon className="h-6 w-6" /> : <XMarkIcon className="h-6 w-6" />}
        </button>
      </div>


      <nav className="flex flex-col gap-2">
        {navigation.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'text-white bg-purple-600/50 border border-purple-400/30 shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-purple-600/30'
                  }`}
                >
                  <item.icon className={`h-5 w-5 transition-transform ${
                    isActive ? 'scale-110 text-purple-300' : 'group-hover:scale-110'
                  }`} />
                  {!isCollapsed && (
                    <span className={`font-medium ${isActive ? 'text-purple-100' : ''}`}>
                      {item.name}
                    </span>
                  )}
                  {isActive && !isCollapsed && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-purple-400 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
      </nav>
    </aside>
  );
}