
"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, SparklesIcon, FireIcon, StarIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../store/useAppStore';

interface HotCoin {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  isHot: boolean;
  emoji: string;
  description: string;
}

export default function HotCoins() {
  const [hotCoins, setHotCoins] = useState<HotCoin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<HotCoin | null>(null);
  const tokenPrices = useAppStore(s => s.tokenPrices);

  useEffect(() => {
    // Create demo hot coins with engaging descriptions
    const demoCoins: HotCoin[] = [
      {
        symbol: 'TOKEN0',
        name: 'Magic Gold',
        price: 1.50,
        change24h: 12.5,
        volume: 150000,
        isHot: true,
        emoji: '🏆',
        description: 'The golden standard! Up 12% today!'
      },
      {
        symbol: 'TOKEN1',
        name: 'Power Crystal',
        price: 2.30,
        change24h: -3.2,
        volume: 89000,
        isHot: false,
        emoji: '💎',
        description: 'Temporary dip - perfect buying opportunity!'
      },
      {
        symbol: 'TOKEN2',
        name: 'Lightning Bolt',
        price: 0.80,
        change24h: 8.7,
        volume: 220000,
        isHot: true,
        emoji: '⚡',
        description: 'Fast rising! High volume today!'
      },
      {
        symbol: 'SEI',
        name: 'Sei Coin',
        price: 0.45,
        change24h: 5.4,
        volume: 300000,
        isHot: true,
        emoji: '🌟',
        description: 'Network native coin showing strength!'
      }
    ];

    setHotCoins(demoCoins);
  }, [tokenPrices]);

  const handleCoinSelect = (coin: HotCoin) => {
    setSelectedCoin(coin);
    
    // Trigger AI assistant with coin info
    const event = new CustomEvent('openAI', {
      detail: {
        query: `Tell me about ${coin.name} (${coin.symbol}). ${coin.description} Should I buy it now? What's your analysis?`
      }
    });
    window.dispatchEvent(event);
  };

  const handleQuickBuy = (coin: HotCoin) => {
    // Trigger AI assistant for quick buy
    const event = new CustomEvent('openAI', {
      detail: {
        query: `I want to buy ${coin.name} (${coin.symbol}). It's ${coin.change24h > 0 ? 'up' : 'down'} ${Math.abs(coin.change24h)}% today. How much should I buy and what's the best strategy?`
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="p-6 rounded-xl bg-gradient-to-b from-orange-900/50 to-red-900/50 border border-orange-400/40">
      <div className="flex items-center gap-2 mb-4">
        <FireIcon className="h-6 w-6 text-orange-400" />
        <h3 className="text-xl font-bold text-orange-300">🔥 Hot Coins</h3>
      </div>
      
      <div className="space-y-3">
        {hotCoins.map((coin, index) => (
          <motion.div
            key={coin.symbol}
            className={`p-4 rounded-lg transition-all cursor-pointer border ${
              coin.isHot 
                ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-400/30 hover:from-orange-600/30 hover:to-red-600/30' 
                : 'bg-white/10 border-gray-500/30 hover:bg-white/15'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleCoinSelect(coin)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{coin.emoji}</span>
                <div>
                  <div className="font-bold text-white flex items-center gap-1">
                    {coin.name}
                    {coin.isHot && <FireIcon className="h-4 w-4 text-orange-400" />}
                  </div>
                  <div className="text-sm text-gray-400">{coin.symbol}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-white">${coin.price.toFixed(2)}</div>
                <div className={`flex items-center gap-1 text-sm ${
                  coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {coin.change24h >= 0 ? (
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                  )}
                  {Math.abs(coin.change24h).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-400 mb-3">
              {coin.description}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickBuy(coin);
                }}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                  coin.isHot
                    ? 'bg-orange-600/40 hover:bg-orange-600/60 text-orange-200'
                    : 'bg-purple-600/40 hover:bg-purple-600/60 text-purple-200'
                }`}
              >
                🛒 Quick Buy
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCoinSelect(coin);
                }}
                className="flex-1 py-2 px-3 rounded-md text-xs font-bold bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 transition-all"
              >
                📊 Analyze
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/30 text-center"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-center gap-2 text-purple-300 font-bold">
          <SparklesIcon className="h-4 w-4" />
          <span>AI-Powered Insights</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Click any coin for personalized advice from your magic assistant!
        </p>
      </motion.div>
    </div>
  );
}
