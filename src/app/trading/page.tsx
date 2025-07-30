
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
  ShieldCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import TradingChart from '../components/TradingChart';

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

interface CrossChainOpportunity {
  fromChain: string;
  toChain: string;
  token: string;
  priceDifference: number;
  potentialProfit: number;
  bridgeTime: string;
  bridgeFee: number;
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
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [todaysPnL, setTodaysPnL] = useState(0);
  const [activeOrders, setActiveOrders] = useState([]);
  const [marketSentiment, setMarketSentiment] = useState('BULLISH');
  const [crossChainOpportunities, setCrossChainOpportunities] = useState<CrossChainOpportunity[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

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
      symbol: 'TOKEN1/TOKEN2',
      baseAsset: 'TOKEN1',
      quoteAsset: 'TOKEN2',
      price: 2.87,
      change24h: 8.7,
      volume24h: 890000,
      high24h: 3.12,
      low24h: 2.65
    },
    {
      symbol: 'TOKEN0/SEI',
      baseAsset: 'TOKEN0',
      quoteAsset: 'SEI',
      price: 3.16,
      change24h: 3.4,
      volume24h: 650000,
      high24h: 3.28,
      low24h: 3.05
    }
  ], []);

  // Calculate portfolio value from balances
  useEffect(() => {
    const calculatePortfolioValue = () => {
      let totalValue = 0;
      
      balances.forEach(balance => {
        const amount = parseFloat(balance.amount) / Math.pow(10, balance.decimals);
        // Mock price calculation based on symbol
        const mockPrices: Record<string, number> = {
          'SEI': 0.487,
          'TOKEN0': 1.543,
          'TOKEN1': 2.87,
          'TOKEN2': 0.95
        };
        const price = mockPrices[balance.symbol] || 1;
        totalValue += amount * price;
      });
      
      setPortfolioValue(totalValue);
      setTodaysPnL(totalValue * (Math.random() * 0.1 - 0.05)); // Random daily P&L
    };
    
    calculatePortfolioValue();
  }, [balances]);

  // Generate cross-chain opportunities
  useEffect(() => {
    const generateCrossChainOpportunities = () => {
      const opportunities: CrossChainOpportunity[] = [
        {
          fromChain: 'SEI',
          toChain: 'Ethereum',
          token: 'TOKEN0',
          priceDifference: 3.2,
          potentialProfit: 156.50,
          bridgeTime: '15 min',
          bridgeFee: 0.3
        },
        {
          fromChain: 'SEI',
          toChain: 'BSC',
          token: 'TOKEN1',
          priceDifference: 1.8,
          potentialProfit: 89.20,
          bridgeTime: '8 min',
          bridgeFee: 0.15
        },
        {
          fromChain: 'Ethereum',
          toChain: 'SEI',
          token: 'USDT',
          priceDifference: 0.8,
          potentialProfit: 45.30,
          bridgeTime: '12 min',
          bridgeFee: 0.25
        }
      ];
      
      setCrossChainOpportunities(opportunities);
    };
    
    generateCrossChainOpportunities();
    const interval = setInterval(generateCrossChainOpportunities, 30000);
    return () => clearInterval(interval);
  }, []);

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
          reason: 'Strong bullish momentum detected. Large whale accumulation observed with 12% price increase in 24h.',
          entryPrice: 1.543,
          targetPrice: 1.720,
          stopLoss: 1.450,
          timeframe: '4h',
          riskLevel: 'MEDIUM',
          platform: 'BARUK'
        },
        {
          id: '2',
          type: 'ARBITRAGE',
          pair: 'TOKEN1/TOKEN2',
          action: 'BUY',
          confidence: 94,
          reason: 'Cross-chain arbitrage opportunity detected. Price difference of 8.7% between SEI and Ethereum networks.',
          entryPrice: 2.87,
          targetPrice: 3.12,
          stopLoss: 2.75,
          timeframe: '15m',
          riskLevel: 'LOW',
          platform: 'BINANCE'
        },
        {
          id: '3',
          type: 'SWING',
          pair: 'TOKEN0/SEI',
          action: 'SELL',
          confidence: 78,
          reason: 'Technical indicators show overbought conditions. RSI above 70 with declining volume.',
          entryPrice: 3.16,
          targetPrice: 2.95,
          stopLoss: 3.28,
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
          message: `Trading analysis: ${aiQuery}. Current portfolio: ${JSON.stringify(balances)}. Selected pair: ${selectedPair}`,
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

  const handlePriceSelect = (price: number) => {
    setSelectedPrice(price);
    toast.success(`Selected price: $${price.toFixed(4)} for your trade`);
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
            Advanced trading with real-time charts, order books, and cross-chain opportunities 🚀
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

        {/* Trading Mode Selector */}
        <motion.div
          className="flex gap-2 p-1 bg-gray-900/50 rounded-xl border border-gray-600/30 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
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
        </motion.div>

        {/* Pair Selector */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="bg-gray-800/50 border border-gray-600/30 rounded-lg px-4 py-3 text-white text-lg focus:border-purple-400 focus:outline-none"
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
                className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 rounded-lg text-sm text-blue-300 transition-all"
              >
                📊 TradingView
              </button>
              <button
                onClick={() => window.open('https://dexscreener.com', '_blank')}
                className="px-4 py-2 bg-green-600/30 hover:bg-green-600/50 rounded-lg text-sm text-green-300 transition-all"
              >
                📈 DexScreener
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Trading Chart */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TradingChart symbol={selectedPair} onPriceSelect={handlePriceSelect} />
        </motion.div>

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          {/* Platform Selector & Cross-Chain Opportunities */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
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

            {/* Cross-Chain Opportunities */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-400/40">
              <div className="flex items-center gap-2 mb-3">
                <GlobeAltIcon className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-300">Cross-Chain Arbitrage</h3>
              </div>
              
              <div className="space-y-3">
                {crossChainOpportunities.map((opportunity, index) => (
                  <motion.div
                    key={index}
                    className="p-3 rounded-lg bg-white/10 border border-cyan-400/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{opportunity.token}</span>
                        <span className="px-2 py-1 rounded text-xs bg-cyan-600/30 text-cyan-300">
                          {opportunity.fromChain} → {opportunity.toChain}
                        </span>
                      </div>
                      <div className="text-xs text-green-400 font-bold">
                        +{opportunity.priceDifference.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-400">Profit: </span>
                        <span className="text-green-400">${opportunity.potentialProfit}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Time: </span>
                        <span className="text-white">{opportunity.bridgeTime}</span>
                      </div>
                    </div>
                    
                    <button className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-xs font-bold text-white transition-all">
                      Execute Cross-Chain Trade
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* AI Assistant Panel */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
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
              
              {selectedPrice && (
                <div className="mt-3 p-2 rounded-lg bg-green-600/20 border border-green-400/30">
                  <div className="text-xs text-green-300">Selected Price from Chart:</div>
                  <div className="text-sm font-bold text-white">${selectedPrice.toFixed(4)}</div>
                </div>
              )}
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
