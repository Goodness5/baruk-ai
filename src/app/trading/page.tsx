
"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon, 
  SparklesIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  BoltIcon,
  FireIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

// Trading Platform Types
interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface AITradeSuggestion {
  id: string;
  type: 'SPOT' | 'FUTURES' | 'ARBITRAGE' | 'DCA' | 'SWING';
  pair: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  platform: 'BARUK' | 'BINANCE' | 'COINBASE' | 'KRAKEN' | 'BYBIT';
  leverage?: number;
}

interface TradingChart {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const THIRD_PARTY_PLATFORMS = [
  { id: 'binance', name: 'Binance', type: 'CEX', features: ['Spot', 'Futures', 'Options'] },
  { id: 'coinbase', name: 'Coinbase Pro', type: 'CEX', features: ['Spot', 'Advanced Trading'] },
  { id: 'kraken', name: 'Kraken', type: 'CEX', features: ['Spot', 'Futures', 'Margin'] },
  { id: 'bybit', name: 'Bybit', type: 'CEX', features: ['Futures', 'Spot', 'Options'] },
  { id: 'uniswap', name: 'Uniswap', type: 'DEX', features: ['Spot', 'LP'] },
  { id: 'gmx', name: 'GMX', type: 'DEX', features: ['Perpetuals', 'Spot'] },
];

export default function TradingPage() {
  const { address, isConnected } = useAccount();
  const balances = useAppStore(s => s.balances);
  
  // State Management
  const [selectedPair, setSelectedPair] = useState('TOKEN0/TOKEN1');
  const [tradingMode, setTradingMode] = useState<'SPOT' | 'FUTURES' | 'AI_AUTO'>('SPOT');
  const [selectedPlatform, setSelectedPlatform] = useState('BARUK');
  const [aiSuggestions, setAiSuggestions] = useState<AITradeSuggestion[]>([]);
  const [chartData, setChartData] = useState<TradingChart[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [todaysPnL, setTodaysPnL] = useState(0);
  const [activeOrders, setActiveOrders] = useState([]);
  const [marketSentiment, setMarketSentiment] = useState('BULLISH');

  // Mock Trading Pairs
  const tradingPairs: TradingPair[] = useMemo(() => [
    {
      symbol: 'TOKEN0/TOKEN1',
      baseAsset: 'TOKEN0',
      quoteAsset: 'TOKEN1',
      price: 1.543,
      change24h: 5.2,
      volume24h: 1250000,
      high24h: 1.589,
      low24h: 1.432
    },
    {
      symbol: 'SEI/USDT',
      baseAsset: 'SEI',
      quoteAsset: 'USDT',
      price: 0.487,
      change24h: -2.1,
      volume24h: 5430000,
      high24h: 0.501,
      low24h: 0.465
    },
    {
      symbol: 'BTC/USDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      price: 43250.50,
      change24h: 3.7,
      volume24h: 890000000,
      high24h: 44100.00,
      low24h: 41850.00
    },
    {
      symbol: 'ETH/USDT',
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
      price: 2650.25,
      change24h: 1.9,
      volume24h: 450000000,
      high24h: 2698.50,
      low24h: 2580.00
    }
  ], []);

  // Generate Mock Chart Data
  useEffect(() => {
    const generateChartData = () => {
      const data: TradingChart[] = [];
      let price = 1.500;
      
      for (let i = 0; i < 100; i++) {
        const timestamp = Date.now() - (99 - i) * 3600000; // Hourly data
        const open = price;
        const volatility = 0.02;
        const change = (Math.random() - 0.5) * volatility;
        price *= (1 + change);
        const high = Math.max(open, price) * (1 + Math.random() * 0.01);
        const low = Math.min(open, price) * (1 - Math.random() * 0.01);
        const volume = Math.random() * 100000;
        
        data.push({
          timestamp,
          open,
          high,
          low,
          close: price,
          volume
        });
      }
      
      setChartData(data);
    };
    
    generateChartData();
  }, [selectedPair]);

  // Generate AI Suggestions
  const generateAISuggestions = async () => {
    setIsLoadingAI(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const suggestions: AITradeSuggestion[] = [
        {
          id: '1',
          type: 'SPOT',
          pair: 'TOKEN0/TOKEN1',
          action: 'BUY',
          confidence: 87,
          reason: 'Strong bullish momentum detected. RSI shows oversold conditions with positive divergence.',
          entryPrice: 1.543,
          targetPrice: 1.720,
          stopLoss: 1.450,
          timeframe: '4h',
          riskLevel: 'MEDIUM',
          platform: 'BARUK'
        },
        {
          id: '2',
          type: 'FUTURES',
          pair: 'BTC/USDT',
          action: 'BUY',
          confidence: 92,
          reason: 'Bitcoin breaking above key resistance. Institutional buying increasing.',
          entryPrice: 43250,
          targetPrice: 46500,
          stopLoss: 41800,
          timeframe: '1d',
          riskLevel: 'LOW',
          platform: 'BINANCE',
          leverage: 3
        },
        {
          id: '3',
          type: 'ARBITRAGE',
          pair: 'SEI/USDT',
          action: 'BUY',
          confidence: 94,
          reason: 'Price difference detected between Binance (0.487) and Coinbase (0.495). Risk-free profit opportunity.',
          entryPrice: 0.487,
          targetPrice: 0.495,
          stopLoss: 0.485,
          timeframe: '5m',
          riskLevel: 'LOW',
          platform: 'COINBASE'
        },
        {
          id: '4',
          type: 'SWING',
          pair: 'ETH/USDT',
          action: 'SELL',
          confidence: 78,
          reason: 'Ethereum showing signs of exhaustion near resistance. Volume declining.',
          entryPrice: 2650,
          targetPrice: 2480,
          stopLoss: 2720,
          timeframe: '12h',
          riskLevel: 'HIGH',
          platform: 'KRAKEN'
        }
      ];
      
      setAiSuggestions(suggestions);
      toast.success('🤖 AI analysis complete! Found ' + suggestions.length + ' opportunities');
    } catch (error) {
      toast.error('AI analysis failed. Try again!');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Execute Trade Suggestion
  const executeTrade = async (suggestion: AITradeSuggestion) => {
    if (!isConnected) {
      toast.error('Connect wallet to execute trades');
      return;
    }
    
    try {
      toast.loading(`Executing ${suggestion.action} ${suggestion.pair} on ${suggestion.platform}...`);
      
      // Simulate trade execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (suggestion.platform === 'BARUK') {
        // Execute on Baruk protocol
        toast.success(`✅ ${suggestion.action} order executed on Baruk!`);
      } else {
        // Redirect to third-party platform with pre-filled trade
        const platformUrls = {
          'BINANCE': `https://www.binance.com/en/trade/${suggestion.pair.replace('/', '_')}`,
          'COINBASE': `https://pro.coinbase.com/trade/${suggestion.pair}`,
          'KRAKEN': `https://trade.kraken.com/charts/KRAKEN:${suggestion.pair}`,
          'BYBIT': `https://www.bybit.com/trade/usdt/${suggestion.pair.split('/')[0]}USDT`
        };
        
        const url = platformUrls[suggestion.platform as keyof typeof platformUrls];
        window.open(url, '_blank');
        toast.success(`🔗 Redirected to ${suggestion.platform} with trade setup!`);
      }
      
    } catch (error) {
      toast.error('Trade execution failed');
    }
  };

  // AI Chat Handler
  const handleAIChat = async () => {
    if (!aiQuery.trim()) return;
    
    try {
      const response = await fetch('/api/baruk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Trading analysis: ${aiQuery}. Current portfolio: ${JSON.stringify(balances)}`,
          userId: address || 'anonymous',
        }),
      });
      
      if (!response.ok) throw new Error('AI chat failed');
      
      const data = await response.json();
      toast.success('✨ AI provided trading insights!');
      setAiQuery('');
    } catch (error) {
      toast.error('AI chat temporarily unavailable');
    }
  };

  // Simple Chart Component
  const SimpleChart = ({ data }: { data: TradingChart[] }) => {
    const maxPrice = Math.max(...data.map(d => d.high));
    const minPrice = Math.min(...data.map(d => d.low));
    const range = maxPrice - minPrice;
    
    return (
      <div className="h-64 w-full bg-gradient-to-b from-purple-900/20 to-blue-900/20 rounded-lg p-4 relative overflow-hidden">
        <svg className="w-full h-full">
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Price Line */}
          <path
            d={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.close - minPrice) / range) * 100;
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ')}
            stroke="#8B5CF6"
            strokeWidth="2"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* Fill Area */}
          <path
            d={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.close - minPrice) / range) * 100;
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ') + ' L 100% 100% L 0% 100% Z'}
            fill="url(#priceGradient)"
          />
        </svg>
        
        {/* Price Labels */}
        <div className="absolute top-2 left-2 text-xs text-purple-300">
          ${maxPrice.toFixed(3)}
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-purple-300">
          ${minPrice.toFixed(3)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <RocketLaunchIcon className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI-Powered Trading Hub
            </h1>
          </div>
          <p className="text-gray-300 text-sm">
            Advanced trading with AI assistance across multiple platforms 🚀
          </p>
        </motion.div>

        {/* Portfolio Overview */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-400/40">
            <div className="text-xs text-green-300 mb-1">Portfolio Value</div>
            <div className="text-lg font-bold text-white">${portfolioValue.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-400/40">
            <div className="text-xs text-blue-300 mb-1">Today's P&L</div>
            <div className={`text-lg font-bold ${todaysPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {todaysPnL >= 0 ? '+' : ''}${todaysPnL.toFixed(2)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-400/40">
            <div className="text-xs text-purple-300 mb-1">Active Orders</div>
            <div className="text-lg font-bold text-white">{activeOrders.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-400/40">
            <div className="text-xs text-orange-300 mb-1">Market Sentiment</div>
            <div className="text-lg font-bold text-white flex items-center gap-1">
              {marketSentiment}
              {marketSentiment === 'BULLISH' ? 
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" /> : 
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
              }
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          {/* Main Trading Interface */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Trading Mode Selector */}
            <div className="flex gap-2 p-1 bg-gray-900/50 rounded-xl border border-gray-600/30">
              {(['SPOT', 'FUTURES', 'AI_AUTO'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTradingMode(mode)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    tradingMode === mode
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {mode === 'AI_AUTO' ? '🤖 AI Auto' : mode}
                </button>
              ))}
            </div>

            {/* Chart and Trading Panel */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-gray-900/80 to-gray-800/80 border border-gray-600/30 backdrop-blur-sm">
              {/* Pair Selector */}
              <div className="flex items-center justify-between mb-4">
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="bg-gray-800/50 border border-gray-600/30 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-400 focus:outline-none"
                >
                  {tradingPairs.map(pair => (
                    <option key={pair.symbol} value={pair.symbol}>
                      {pair.symbol} - ${pair.price.toFixed(3)} ({pair.change24h > 0 ? '+' : ''}{pair.change24h}%)
                    </option>
                  ))}
                </select>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open('https://www.tradingview.com', '_blank')}
                    className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 rounded-lg text-xs text-blue-300 transition-all"
                  >
                    📊 TradingView
                  </button>
                  <button
                    onClick={() => window.open('https://dexscreener.com', '_blank')}
                    className="px-3 py-2 bg-green-600/30 hover:bg-green-600/50 rounded-lg text-xs text-green-300 transition-all"
                  >
                    📈 DexScreener
                  </button>
                </div>
              </div>

              {/* Chart */}
              <SimpleChart data={chartData} />

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                {(() => {
                  const pair = tradingPairs.find(p => p.symbol === selectedPair);
                  if (!pair) return null;
                  
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Price</div>
                        <div className="font-bold text-white">${pair.price.toFixed(3)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">24h Change</div>
                        <div className={`font-bold ${pair.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pair.change24h >= 0 ? '+' : ''}{pair.change24h}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">24h High</div>
                        <div className="font-bold text-white">${pair.high24h.toFixed(3)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">24h Low</div>
                        <div className="font-bold text-white">${pair.low24h.toFixed(3)}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Platform Selector */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-400/40">
              <h3 className="text-sm font-bold text-indigo-300 mb-3">Trading Platforms</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {THIRD_PARTY_PLATFORMS.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id.toUpperCase())}
                    className={`p-3 rounded-lg text-left transition-all ${
                      selectedPlatform === platform.id.toUpperCase()
                        ? 'bg-indigo-600/50 border border-indigo-400/50'
                        : 'bg-gray-800/30 hover:bg-gray-700/50 border border-gray-600/30'
                    }`}
                  >
                    <div className="font-bold text-white text-xs">{platform.name}</div>
                    <div className="text-xs text-gray-400">{platform.type}</div>
                    <div className="text-xs text-indigo-300">{platform.features.join(', ')}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* AI Assistant Panel */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* AI Suggestions */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-purple-900/50 to-pink-900/50 border border-purple-400/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-purple-300">AI Trade Suggestions</h3>
                </div>
                <button
                  onClick={generateAISuggestions}
                  disabled={isLoadingAI}
                  className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-xs text-purple-300 transition-all disabled:opacity-50"
                >
                  {isLoadingAI ? '🤖 Analyzing...' : '🔄 Refresh'}
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {aiSuggestions.map(suggestion => (
                  <motion.div
                    key={suggestion.id}
                    className="p-3 rounded-lg bg-white/10 border border-purple-400/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{suggestion.pair}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          suggestion.action === 'BUY' ? 'bg-green-600/30 text-green-300' :
                          suggestion.action === 'SELL' ? 'bg-red-600/30 text-red-300' :
                          'bg-yellow-600/30 text-yellow-300'
                        }`}>
                          {suggestion.action}
                        </span>
                      </div>
                      <div className="text-xs text-purple-300">{suggestion.confidence}%</div>
                    </div>
                    
                    <div className="text-xs text-gray-300 mb-2">{suggestion.reason}</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-gray-400">Entry: </span>
                        <span className="text-white">${suggestion.entryPrice}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Target: </span>
                        <span className="text-green-400">${suggestion.targetPrice}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Platform: </span>
                        <span className="text-purple-300">{suggestion.platform}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Risk: </span>
                        <span className={
                          suggestion.riskLevel === 'LOW' ? 'text-green-400' :
                          suggestion.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                          'text-red-400'
                        }>
                          {suggestion.riskLevel}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => executeTrade(suggestion)}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-xs font-bold text-white transition-all"
                    >
                      Execute Trade
                    </button>
                  </motion.div>
                ))}
                
                {aiSuggestions.length === 0 && !isLoadingAI && (
                  <div className="text-center py-8">
                    <SparklesIcon className="h-12 w-12 text-purple-400/50 mx-auto mb-2" />
                    <div className="text-sm text-gray-400">Click "Refresh" to get AI suggestions</div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Chat */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-blue-900/50 to-cyan-900/50 border border-blue-400/40">
              <div className="flex items-center gap-2 mb-3">
                <LightBulbIcon className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-blue-300">Ask AI Trader</h3>
              </div>
              
              <div className="space-y-3">
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask about trading strategies, market analysis, or risk management..."
                  className="w-full p-3 rounded-lg bg-white/10 border border-blue-400/30 text-white placeholder-gray-400 resize-none text-sm"
                  rows={3}
                />
                <button
                  onClick={handleAIChat}
                  disabled={!aiQuery.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 disabled:text-gray-400 rounded-lg text-sm font-bold text-white transition-all"
                >
                  💬 Get AI Insights
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-gray-900/50 to-gray-800/50 border border-gray-600/30">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.open('https://coingecko.com', '_blank')}
                  className="p-2 bg-orange-600/30 hover:bg-orange-600/50 rounded-lg text-xs text-orange-300 transition-all"
                >
                  📊 Market Data
                </button>
                <button
                  onClick={() => window.open('https://defipulse.com', '_blank')}
                  className="p-2 bg-green-600/30 hover:bg-green-600/50 rounded-lg text-xs text-green-300 transition-all"
                >
                  🏦 DeFi Stats
                </button>
                <button
                  onClick={() => window.open('https://cryptofees.info', '_blank')}
                  className="p-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-xs text-purple-300 transition-all"
                >
                  💸 Fee Tracker
                </button>
                <button
                  onClick={() => setShowAIChat(true)}
                  className="p-2 bg-blue-600/30 hover:bg-blue-600/50 rounded-lg text-xs text-blue-300 transition-all"
                >
                  🤖 AI Assistant
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
