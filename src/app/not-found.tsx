
"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { HomeIcon, ArrowsRightLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        {/* Animated 404 */}
        <motion.div
          className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            duration: 1.2 
          }}
        >
          404
        </motion.div>

        {/* Meme Content */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {/* Animated Emoji */}
          <motion.div
            className="text-6xl"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            🤷‍♂️
          </motion.div>

          {/* Meme Text */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Oops! This page went to the moon! 🚀
            </h1>
            
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-400/40 backdrop-blur-sm">
              <p className="text-xl text-gray-300 mb-4">
                Looks like this page is having a 
                <span className="text-red-400 font-bold"> rug pull </span>
                moment! 📉
              </p>
              
              <div className="text-lg text-purple-300 space-y-2">
                <p>🔍 <strong>Error:</strong> Page not found in the blockchain</p>
                <p>⛽ <strong>Gas Fee:</strong> Your time (refundable)</p>
                <p>🎯 <strong>Solution:</strong> Navigate to a valid route</p>
              </div>
            </div>

            {/* Meme Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <motion.div
                className="p-4 rounded-xl bg-green-900/30 border border-green-400/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-2xl mb-2">💎</div>
                <p className="text-green-300 text-sm">This page has diamond hands - it's never coming back!</p>
              </motion.div>

              <motion.div
                className="p-4 rounded-xl bg-orange-900/30 border border-orange-400/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-2xl mb-2">📈</div>
                <p className="text-orange-300 text-sm">When 404? Soon™ (but probably never)</p>
              </motion.div>

              <motion.div
                className="p-4 rounded-xl bg-blue-900/30 border border-blue-400/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-2xl mb-2">🦍</div>
                <p className="text-blue-300 text-sm">Even apes know this page doesn't exist!</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link href="/swap">
              <motion.button
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowsRightLeftIcon className="h-5 w-5" />
                Start Trading
              </motion.button>
            </Link>

            <Link href="/dashboard">
              <motion.button
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HomeIcon className="h-5 w-5" />
                Go Home
              </motion.button>
            </Link>

            <Link href="/trading">
              <motion.button
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SparklesIcon className="h-5 w-5" />
                AI Trading
              </motion.button>
            </Link>
          </div>

          {/* Footer Meme */}
          <motion.div
            className="mt-12 p-4 rounded-xl bg-gray-900/50 border border-gray-600/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <p className="text-gray-400 text-sm">
              <strong>Fun Fact:</strong> This 404 page has better tokenomics than most altcoins 🪙
            </p>
            <div className="mt-2 flex justify-center space-x-4 text-2xl">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                🔄
              </motion.span>
              <span>💰</span>
              <motion.span
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🚀
              </motion.span>
              <span>💎</span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🌙
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
