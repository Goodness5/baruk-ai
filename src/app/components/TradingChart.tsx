
"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  EyeIcon,
  FireIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';
import { useAppStore } from '../store/useAppStore';
import { CandlestickData, chartDataGenerator, chartRenderer } from '../lib/chartData';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  address: string;
  side: 'buy' | 'sell';
}

interface TokenTransfer {
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  txHash: string;
  price?: number;
}

interface TradingChartProps {
  symbol: string;
  onPriceSelect?: (price: number) => void;
}

export default function TradingChart({ symbol, onPriceSelect }: TradingChartProps) {
  const balances = useAppStore(s => s.balances);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }>({ bids: [], asks: [] });
  const [recentTransfers, setRecentTransfers] = useState<TokenTransfer[]>([]);
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('4h');
  const [chartType, setChartType] = useState<'line' | 'candle' | 'volume'>('line');
  const [holderStats, setHolderStats] = useState({
    totalHolders: 0,
    topHolders: [] as { address: string; balance: number; percentage: number }[],
    distribution: { whales: 0, dolphins: 0, shrimp: 0 }
  });

  // Generate chart data
  useEffect(() => {
    const data = chartDataGenerator.generateCandlestickData(symbol, timeframe, 100);
    setChartData(data);
  }, [symbol, timeframe]);

  // Generate mock order book based on token balances
  useEffect(() => {
    const generateOrderBook = () => {
      const currentPrice = tokenPrices[symbol.toLowerCase().split('/')[0]] || 100;
      const bids: OrderBookEntry[] = [];
      const asks: OrderBookEntry[] = [];
      
      // Generate realistic order book based on holder balances
      for (let i = 0; i < 20; i++) {
        const buyPrice = currentPrice * (1 - (i + 1) * 0.001);
        const sellPrice = currentPrice * (1 + (i + 1) * 0.001);
        const buyAmount = Math.random() * 1000;
        const sellAmount = Math.random() * 1000;
        
        bids.push({
          price: buyPrice,
          amount: buyAmount,
          total: buyPrice * buyAmount,
          address: `0x${Math.random().toString(16).substr(2, 8)}...`,
          side: 'buy'
        });
        
        asks.push({
          price: sellPrice,
          amount: sellAmount,
          total: sellPrice * sellAmount,
          address: `0x${Math.random().toString(16).substr(2, 8)}...`,
          side: 'sell'
        });
      }
      
      bids.sort((a, b) => b.price - a.price);
      asks.sort((a, b) => a.price - b.price);
      
      setOrderBook({ bids: bids.slice(0, 10), asks: asks.slice(0, 10) });
    };
    
    generateOrderBook();
    const interval = setInterval(generateOrderBook, 5000);
    return () => clearInterval(interval);
  }, [symbol, tokenPrices]);

  // Generate recent transfers based on balances
  useEffect(() => {
    const generateTransfers = () => {
      const transfers: TokenTransfer[] = [];
      const currentPrice = tokenPrices[symbol.toLowerCase().split('/')[0]] || 100;
      
      for (let i = 0; i < 15; i++) {
        transfers.push({
          from: `0x${Math.random().toString(16).substr(2, 8)}...`,
          to: `0x${Math.random().toString(16).substr(2, 8)}...`,
          amount: Math.random() * 1000,
          timestamp: Date.now() - i * 60000,
          txHash: `0x${Math.random().toString(16).substr(2, 12)}...`,
          price: currentPrice * (0.98 + Math.random() * 0.04)
        });
      }
      
      setRecentTransfers(transfers);
    };
    
    generateTransfers();
    const interval = setInterval(generateTransfers, 10000);
    return () => clearInterval(interval);
  }, [symbol, tokenPrices]);

  // Calculate holder statistics
  useEffect(() => {
    const calculateHolderStats = () => {
      const tokenBalances = balances.filter(b => b.symbol === symbol.split('/')[0]);
      const totalSupply = tokenBalances.reduce((sum, b) => sum + parseFloat(b.amount), 0);
      
      const topHolders = tokenBalances
        .map(b => ({
          address: `${b.token?.slice(0, 6)}...${b.token?.slice(-4)}`,
          balance: parseFloat(b.amount),
          percentage: (parseFloat(b.amount) / totalSupply) * 100
        }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10);
      
      const whales = topHolders.filter(h => h.percentage > 5).length;
      const dolphins = topHolders.filter(h => h.percentage > 1 && h.percentage <= 5).length;
      const shrimp = topHolders.filter(h => h.percentage <= 1).length;
      
      setHolderStats({
        totalHolders: tokenBalances.length,
        topHolders,
        distribution: { whales, dolphins, shrimp }
      });
    };
    
    calculateHolderStats();
  }, [balances, symbol]);

  // Chart rendering
  const renderChart = () => {
    if (chartData.length === 0) return null;
    
    const maxPrice = Math.max(...chartData.map(d => d.high));
    const minPrice = Math.min(...chartData.map(d => d.low));
    const range = maxPrice - minPrice;
    
    return (
      <div className="h-80 w-full bg-gradient-to-b from-gray-900/50 to-gray-800/50 rounded-lg p-4 relative overflow-hidden">
        <svg className="w-full h-full">
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {chartType === 'line' && (
            <>
              {/* Price Line */}
              <path
                d={chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 100;
                  const y = 100 - ((point.close - minPrice) / range) * 80;
                  return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                }).join(' ')}
                stroke="#8B5CF6"
                strokeWidth="2"
                fill="none"
                className="drop-shadow-sm"
              />
              
              {/* Fill Area */}
              <path
                d={chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 100;
                  const y = 100 - ((point.close - minPrice) / range) * 80;
                  return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                }).join(' ') + ' L 100% 100% L 0% 100% Z'}
                fill="url(#priceGradient)"
              />
            </>
          )}
          
          {chartType === 'candle' && chartData.map((candle, index) => {
            const x = (index / (chartData.length - 1)) * 100;
            const openY = 100 - ((candle.open - minPrice) / range) * 80;
            const closeY = 100 - ((candle.close - minPrice) / range) * 80;
            const highY = 100 - ((candle.high - minPrice) / range) * 80;
            const lowY = 100 - ((candle.low - minPrice) / range) * 80;
            const isGreen = candle.close > candle.open;
            
            return (
              <g key={index}>
                {/* Wick */}
                <line
                  x1={`${x}%`}
                  y1={`${highY}%`}
                  x2={`${x}%`}
                  y2={`${lowY}%`}
                  stroke={isGreen ? "#10B981" : "#EF4444"}
                  strokeWidth="1"
                />
                {/* Body */}
                <rect
                  x={`${x - 0.5}%`}
                  y={`${Math.min(openY, closeY)}%`}
                  width="1%"
                  height={`${Math.abs(closeY - openY)}%`}
                  fill={isGreen ? "#10B981" : "#EF4444"}
                  opacity="0.8"
                />
              </g>
            );
          })}
          
          {chartType === 'volume' && chartData.map((candle, index) => {
            const x = (index / (chartData.length - 1)) * 100;
            const maxVolume = Math.max(...chartData.map(d => d.volume));
            const volumeHeight = (candle.volume / maxVolume) * 30;
            
            return (
              <rect
                key={index}
                x={`${x - 0.5}%`}
                y={`${70}%`}
                width="1%"
                height={`${volumeHeight}%`}
                fill="url(#volumeGradient)"
              />
            );
          })}
        </svg>
        
        {/* Price Labels */}
        <div className="absolute top-2 left-2 text-xs text-purple-300">
          ${maxPrice.toFixed(4)}
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-purple-300">
          ${minPrice.toFixed(4)}
        </div>
        
        {/* Current Price Indicator */}
        <div className="absolute top-2 right-2 bg-purple-600/30 rounded-lg px-2 py-1">
          <div className="text-xs text-purple-300">Current</div>
          <div className="text-sm font-bold text-white">
            ${chartData[chartData.length - 1]?.close.toFixed(4)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid lg:grid-cols-[2fr,1fr] gap-4">
      {/* Main Chart */}
      <div className="space-y-4">
        {/* Chart Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['line', 'candle', 'volume'] as const).map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  chartType === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {(['1h', '4h', '1d', '1w'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* Chart */}
        {renderChart()}
        
        {/* Chart Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-green-900/30 border border-green-400/30">
            <div className="text-xs text-green-300">24h Volume</div>
            <div className="text-sm font-bold text-white">
              ${(chartData.reduce((sum, d) => sum + d.volume, 0) / 1000000).toFixed(2)}M
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-400/30">
            <div className="text-xs text-blue-300">Market Cap</div>
            <div className="text-sm font-bold text-white">
              ${((chartData[chartData.length - 1]?.close || 0) * 1000000 / 1000000).toFixed(2)}M
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-400/30">
            <div className="text-xs text-purple-300">Holders</div>
            <div className="text-sm font-bold text-white">{holderStats.totalHolders}</div>
          </div>
          
          <div className="p-3 rounded-lg bg-orange-900/30 border border-orange-400/30">
            <div className="text-xs text-orange-300">Liquidity</div>
            <div className="text-sm font-bold text-white">
              ${(Math.random() * 5000000 / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar with Order Book and Transfers */}
      <div className="space-y-4">
        {/* Order Book */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-gray-900/80 to-gray-800/80 border border-gray-600/30">
          <div className="flex items-center gap-2 mb-3">
            <ChartBarIcon className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold text-blue-300">Live Order Book</h3>
          </div>
          
          <div className="space-y-2">
            {/* Asks (Sells) */}
            <div className="space-y-1">
              {orderBook.asks.slice(0, 5).map((ask, i) => (
                <motion.div
                  key={i}
                  className="flex justify-between items-center p-1 rounded bg-red-900/20 hover:bg-red-900/30 cursor-pointer"
                  onClick={() => onPriceSelect?.(ask.price)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-xs text-red-400">${ask.price.toFixed(4)}</div>
                  <div className="text-xs text-white">{ask.amount.toFixed(2)}</div>
                </motion.div>
              ))}
            </div>
            
            {/* Spread */}
            <div className="text-center py-1 text-xs text-gray-400 border-y border-gray-600/30">
              Spread: ${(orderBook.asks[0]?.price - orderBook.bids[0]?.price || 0).toFixed(4)}
            </div>
            
            {/* Bids (Buys) */}
            <div className="space-y-1">
              {orderBook.bids.slice(0, 5).map((bid, i) => (
                <motion.div
                  key={i}
                  className="flex justify-between items-center p-1 rounded bg-green-900/20 hover:bg-green-900/30 cursor-pointer"
                  onClick={() => onPriceSelect?.(bid.price)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-xs text-green-400">${bid.price.toFixed(4)}</div>
                  <div className="text-xs text-white">{bid.amount.toFixed(2)}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Transfers */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-purple-900/50 to-pink-900/50 border border-purple-400/40">
          <div className="flex items-center gap-2 mb-3">
            <ArrowTrendingUpIcon className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-purple-300">Recent Transfers</h3>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentTransfers.map((transfer, i) => (
              <motion.div
                key={i}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-all"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-xs text-purple-300">
                    {transfer.from.slice(0, 6)}...→{transfer.to.slice(0, 6)}...
                  </div>
                  <div className="text-xs text-white font-bold">
                    {transfer.amount.toFixed(2)}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-gray-400">
                    {new Date(transfer.timestamp).toLocaleTimeString()}
                  </div>
                  {transfer.price && (
                    <div className="text-xs text-green-400">
                      ${transfer.price.toFixed(4)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Holder Distribution */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-orange-900/50 to-red-900/50 border border-orange-400/40">
          <div className="flex items-center gap-2 mb-3">
            <FireIcon className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-bold text-orange-300">Holder Analysis</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-orange-300">🐋 Whales (&gt;5%)</span>
              <span className="text-xs text-white font-bold">{holderStats.distribution.whales}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-blue-300">🐬 Dolphins (1-5%)</span>
              <span className="text-xs text-white font-bold">{holderStats.distribution.dolphins}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-green-300">🦐 Shrimp (&lt;1%)</span>
              <span className="text-xs text-white font-bold">{holderStats.distribution.shrimp}</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-orange-400/30">
            <div className="text-xs text-orange-300 mb-2">Top Holders</div>
            {holderStats.topHolders.slice(0, 3).map((holder, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-gray-300">{holder.address}</span>
                <span className="text-white font-bold">{holder.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
