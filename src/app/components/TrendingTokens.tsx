
"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUpIcon, TrendingDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../store/useAppStore';

interface TrendingToken {
  symbol: string;
  address: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export default function TrendingTokens({ className = "" }: { className?: string }) {
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate trending tokens data - in a real app, this would come from an API
    const generateTrendingTokens = () => {
      const mockTrendingData: TrendingToken[] = [
        {
          symbol: 'TOKEN0',
          address: '0x8923889697C9467548ABe8E815105993EBC785b6',
          price: tokenPrices['0x8923889697c9467548abe8e815105993ebc785b6'] || 1.5,
          change24h: 15.32,
          volume24h: 2400000,
          marketCap: 45000000
        },
        {
          symbol: 'TOKEN1',
          address: '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7',
          price: tokenPrices['0xf2c653e2a1f21ef409d0489c7c1d754d9f2905f7'] || 2.3,
          change24h: -8.45,
          volume24h: 1800000,
          marketCap: 32000000
        },
        {
          symbol: 'TOKEN2',
          address: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7',
          price: tokenPrices['0xd6383ef8a67e929274ce9ca05b694f782a5070d7'] || 0.8,
          change24h: 24.67,
          volume24h: 3200000,
          marketCap: 28000000
        },
        {
          symbol: 'SEI',
          address: 'native',
          price: 0.65,
          change24h: 5.23,
          volume24h: 12000000,
          marketCap: 850000000
        }
      ];

      // Sort by volume to show trending
      const sorted = mockTrendingData.sort((a, b) => b.volume24h - a.volume24h);
      setTrendingTokens(sorted);
      setIsLoading(false);
    };

    generateTrendingTokens();
    const interval = setInterval(generateTrendingTokens, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [tokenPrices]);

  const formatPrice = (price: number) => {
    return price < 1 ? price.toFixed(4) : price.toFixed(2);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    }
    return `$${(volume / 1000).toFixed(0)}K`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    }
    return `$${(marketCap / 1000).toFixed(0)}K`;
  };

  if (isLoading) {
    return (
      <div className={`p-6 rounded-xl bg-gradient-to-b from-orange-900/40 to-red-900/40 border border-orange-500/30 ${className}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-orange-400" />
          Trending Tokens 🔥
        </h3>
        <div className="text-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-orange-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading trending tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl bg-gradient-to-b from-orange-900/40 to-red-900/40 border border-orange-500/30 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <SparklesIcon className="h-5 w-5 text-orange-400" />
        Trending Tokens 🔥
      </h3>
      <div className="space-y-3">
        {trendingTokens.map((token, index) => (
          <motion.div
            key={token.address}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-400">#{index + 1}</span>
              </div>
              <div>
                <div className="font-medium text-white">{token.symbol}</div>
                <div className="text-xs text-gray-400">{formatVolume(token.volume24h)} vol</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-white font-semibold">${formatPrice(token.price)}</div>
              <div className={`text-xs flex items-center gap-1 ${
                token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {token.change24h >= 0 ? (
                  <TrendingUpIcon className="h-3 w-3" />
                ) : (
                  <TrendingDownIcon className="h-3 w-3" />
                )}
                {Math.abs(token.change24h).toFixed(2)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-orange-500/20">
        <button 
          onClick={() => {
            const event = new CustomEvent('openAI', { 
              detail: { query: 'What are the best trending tokens to buy right now based on volume and price action?' }
            });
            window.dispatchEvent(event);
          }}
          className="w-full p-2 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 transition-colors text-sm font-medium"
        >
          Ask AI About These Tokens 🤖
        </button>
      </div>
    </div>
  );
}
