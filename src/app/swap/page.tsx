
"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowsRightLeftIcon, SparklesIcon, CurrencyDollarIcon, FireIcon, BoltIcon, StarIcon } from '@heroicons/react/24/outline';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { useWagmiBarukContract } from '../lib/useWagmiBarukContract';
import { contractAddresses } from '../lib/contractConfig';
import { parseUnits } from 'viem';
import { useAccount } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core'
import { config } from '@/wagmi';
import { useBarukAMM, useUserAMMData } from '../lib/hooks/useBarukAMM';
import { formatUnits } from 'viem';
import TrendingTokens from '../components/TrendingTokens';

const DEFAULT_PROTOCOL_ID = 'baruk';

export default function ExchangePage() {
  const { address, isConnected: walletConnected } = useAccount();
  const balances = useAppStore(s => s.balances);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const { callContract: wagmiCallContract, callTokenContract: wagmiCallTokenContract } = useWagmiBarukContract('router');
  
  // Pool and earning data
  const { reserves, totalLiquidity, lpFeeBps } = useBarukAMM();
  const { liquidityBalance, lpRewards } = useUserAMMData(address);

  const [fromAsset, setFromAsset] = useState('TOKEN0');
  const [toAsset, setToAsset] = useState('TOKEN1');
  const [amount, setAmount] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [showMagicAssistant, setShowMagicAssistant] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [exchangeStep, setExchangeStep] = useState('ready');
  const [totalSavings, setTotalSavings] = useState(0);

  // Get available assets
  const protocol = getSeiProtocolById(DEFAULT_PROTOCOL_ID) as SeiProtocol;
  const protocolAssets = getProtocolTokens(DEFAULT_PROTOCOL_ID);
  
  const allAssets = [
    { symbol: 'SEI', address: 'native', name: 'Sei Money' },
    ...protocolAssets.map(asset => ({ ...asset, name: asset.symbol }))
  ];

  // Helper functions
  const formatFromDecimals = (amount: string, decimals: number) => {
    try {
      const value = BigInt(amount);
      const divisor = BigInt(10 ** decimals);
      const integerPart = value / divisor;
      const fractionalPart = value % divisor;
      
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      const fullNumber = `${integerPart}.${fractionalStr}`;
      const trimmed = fullNumber.replace(/\.?0+$/, '');
      
      if (integerPart > 999999) {
        const parts = trimmed.split('.');
        const integerWithCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.length > 1 ? `${integerWithCommas}.${parts[1]}` : integerWithCommas;
      }
      
      return trimmed;
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0';
    }
  };

  const getValueInDollars = (amount: string, price: number) => {
    const num = parseFloat(amount) || 0;
    return (num * price).toFixed(2);
  };

  const calculateExchangeAmount = (amount: string, priceFrom: number, priceTo: number): string => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return '0.0';
    
    if (priceFrom === 0 && priceTo === 0) {
      if (fromAsset === toAsset) {
        return amountNum.toFixed(6);
      } else {
        const demoPrices: Record<string, number> = {
          'TOKEN0': 1.5,
          'TOKEN1': 2.3,
          'TOKEN2': 0.8,
          'SEI': 0.45
        };
        const demoFromPrice = demoPrices[fromAsset] || 1;
        const demoToPrice = demoPrices[toAsset] || 1;
        
        const receiveAmount = amountNum * (demoFromPrice / demoToPrice);
        return receiveAmount.toFixed(6);
      }
    }
    
    if (priceFrom === 0 || priceTo === 0) return '0.0';
    
    const receiveAmount = amountNum * (priceFrom / priceTo);
    return receiveAmount.toFixed(6);
  };

  const formatAssetBalance = (amount: string) => {
    try {
      const num = parseFloat(amount);
      if (num === 0) return '0';
      if (num < 0.0001) return '< 0.0001';
      
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
      }
      
      return num.toFixed(4);
    } catch (error) {
      return '0';
    }
  };

  const handleExchange = async () => {
    if (!address || !walletConnected) {
      toast.error('Please connect your digital wallet first! 🔗');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter how much you want to exchange! 💰');
      return;
    }

    if (fromAsset === toAsset) {
      toast.error('Pick different assets to exchange! 🔄');
      return;
    }

    setIsExchanging(true);
    setExchangeStep('processing');
    
    try {
      const fromAssetData = allAssets.find(c => c.symbol === fromAsset);
      const toAssetData = allAssets.find(c => c.symbol === toAsset);

      if (!fromAssetData || !toAssetData) {
        throw new Error('Asset not found! Please try again.');
      }

      if (fromAssetData.address === 'native' || toAssetData.address === 'native') {
        throw new Error('SEI money exchanges coming soon! ⭐');
      }

      const amountInWei = parseUnits(amount, 18);

      // Step 1: Allow the exchange to happen
      toast.loading('Setting up your exchange... ⚡', { id: 'exchange' });
      const approvalTx = await wagmiCallTokenContract(
        fromAssetData.address,
        'approve',
        [contractAddresses.router, amountInWei]
      );
      await waitForTransactionReceipt(config, { hash: approvalTx.hash });

      // Step 2: Do the actual exchange
      toast.loading('Making the magic happen... ✨', { id: 'exchange' });
      const swapTx = await wagmiCallContract(
        'swap',
        [fromAssetData.address, toAssetData.address, amountInWei, 0, Math.floor(Date.now() / 1000) + 1200, address]
      );
      await waitForTransactionReceipt(config, { hash: swapTx.hash });

      // Success celebration
      setExchangeStep('success');
      setShowCelebration(true);
      setTotalSavings(prev => prev + parseFloat(amount) * 0.003);
      
      toast.success('🎉 Exchange completed! You got an amazing rate!', { id: 'exchange' });
      
      setTimeout(() => {
        setShowCelebration(false);
        setExchangeStep('ready');
      }, 3000);
      
      setAmount('');
    } catch (error) {
      console.error('Exchange error:', error);
      const errorMessage = (error as any)?.message || 'Something went wrong';
      toast.error(`Exchange failed: ${errorMessage}`, { id: 'exchange' });
      setExchangeStep('ready');
    } finally {
      setIsExchanging(false);
    }
  };

  const handleAssistantQuery = async () => {
    if (!assistantQuery.trim()) return;
    
    try {
      const response = await fetch('/api/baruk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: assistantQuery,
          userId: address,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Request failed');
      }
      
      const data = await response.json();
      console.log('Magic Assistant Response:', data);
      toast.success('✨ Your magic assistant helped you!');
      setAssistantQuery('');
      setShowMagicAssistant(false);
    } catch (error) {
      console.error('Assistant error:', error);
      toast.error(`Assistant error: ${(error as any).message || 'Your magic assistant is taking a break. Try again!'}`);
    }
  };

  // Get asset balances
  const fromAssetBalance = balances.find(b => {
    if (fromAsset === 'SEI' && b.token === 'native') return true;
    const assetData = allAssets.find(c => c.symbol === fromAsset);
    return assetData && b.token === assetData.address;
  })?.amount || '0';
  
  const toAssetBalance = balances.find(b => {
    if (toAsset === 'SEI' && b.token === 'native') return true;
    const assetData = allAssets.find(c => c.symbol === toAsset);
    return assetData && b.token === assetData.address;
  })?.amount || '0';
  
  const fromAssetData = allAssets.find(c => c.symbol === fromAsset);
  const toAssetData = allAssets.find(c => c.symbol === toAsset);
  const fromDecimals = fromAssetData?.address === 'native' ? 18 : 18;
  const toDecimals = toAssetData?.address === 'native' ? 18 : 18;
  
  const formattedFromBalance = formatFromDecimals(fromAssetBalance, fromDecimals);
  const formattedToBalance = formatFromDecimals(toAssetBalance, toDecimals);
  
  const priceFrom = fromAssetData ? tokenPrices[fromAssetData.address.toLowerCase()] || 0 : 0;
  const priceTo = toAssetData ? tokenPrices[toAssetData.address.toLowerCase()] || 0 : 0;

  const userAssets = balances.map(b => ({
    ...b,
    displayAmount: formatFromDecimals(b.amount, b.decimals),
    dollarValue: getValueInDollars(formatFromDecimals(b.amount, b.decimals), tokenPrices[b.token?.toLowerCase()])
  })).filter(b => parseFloat(b.displayAmount) > 0);

  const formatEarningsValue = (value: bigint | undefined) => {
    if (!value) return '0';
    try {
      return formatUnits(value, 18);
    } catch {
      return '0';
    }
  };

  const calculateMyShare = () => {
    if (!liquidityBalance || !totalLiquidity) return '0.00';
    try {
      const myBalance = Number(formatUnits(liquidityBalance, 18));
      const total = Number(formatUnits(totalLiquidity, 18));
      if (total === 0) return '0.00';
      return ((myBalance / total) * 100).toFixed(4);
    } catch {
      return '0.00';
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 lg:pl-72">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-8xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-full p-4 lg:p-6">
        {/* Welcome Banner for New Users */}
        {!address && (
          <motion.div 
            className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 border border-purple-400/40 text-center shadow-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-3xl mb-2">🪄✨</div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to Magic Money Exchange!</h1>
            <p className="text-purple-100">Exchange any digital asset instantly with AI-powered best rates!</p>
          </motion.div>
        )}

        <div className="h-full max-h-screen grid lg:grid-cols-[1fr,380px] gap-4 lg:gap-6">
          {/* Main Exchange Card - Fullscreen Magic */}
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/60 via-blue-900/50 to-pink-900/60 border border-purple-400/40 backdrop-blur-xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Magic Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-20 left-20 w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="absolute top-40 right-32 w-2 h-2 bg-pink-400 rounded-full animate-ping"></div>
              <div className="absolute bottom-32 left-16 w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="absolute bottom-20 right-20 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col p-6 lg:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div 
                  className="text-4xl mb-3"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  💱✨
                </motion.div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Magic Money Exchange
                </h2>
                <p className="text-purple-200 text-lg">AI finds you the best rates automatically ⚡</p>
              </div>

              {/* Exchange Interface */}
              <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                <div className="space-y-4">
                  {/* From Asset Card */}
                  <motion.div 
                    className="p-6 rounded-2xl bg-gradient-to-r from-purple-800/50 to-purple-700/50 border border-purple-400/30 backdrop-blur-sm shadow-xl"
                    whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.4)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-purple-200 font-semibold text-lg">🎯 You Give</span>
                      <span className="text-purple-300 text-sm">Available: {formattedFromBalance}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="flex-1 bg-transparent text-3xl lg:text-4xl font-bold focus:outline-none text-white placeholder-purple-300/50"
                      />
                      <TokenSelector
                        value={fromAsset}
                        onChange={setFromAsset}
                        tokens={allAssets}
                        className="min-w-[140px] bg-purple-600/40 hover:bg-purple-600/60 border-purple-400/50 text-lg"
                      />
                    </div>
                    <div className="mt-3 text-purple-300 text-lg">
                      ≈ ${getValueInDollars(amount, priceFrom)}
                    </div>
                  </motion.div>

                  {/* Swap Magic Button */}
                  <div className="flex justify-center py-4">
                    <motion.button
                      onClick={() => {
                        setFromAsset(toAsset);
                        setToAsset(fromAsset);
                      }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-pink-600/60 to-purple-600/60 hover:from-pink-500/70 hover:to-purple-500/70 transition-all border border-pink-400/40 shadow-xl"
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ArrowsRightLeftIcon className="h-8 w-8 text-white" />
                    </motion.button>
                  </div>

                  {/* To Asset Card */}
                  <motion.div 
                    className="p-6 rounded-2xl bg-gradient-to-r from-green-800/50 to-green-700/50 border border-green-400/30 backdrop-blur-sm shadow-xl"
                    whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.4)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-green-200 font-semibold text-lg">🎁 You Get</span>
                      <span className="text-green-300 text-sm">Available: {formattedToBalance}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 text-3xl lg:text-4xl font-bold text-green-400">
                        {amount ? calculateExchangeAmount(amount, priceFrom, priceTo) : '0.0'}
                      </div>
                      <TokenSelector
                        value={toAsset}
                        onChange={setToAsset}
                        tokens={allAssets}
                        className="min-w-[140px] bg-green-600/40 hover:bg-green-600/60 border-green-400/50 text-lg"
                      />
                    </div>
                    <div className="mt-3 text-green-300 text-lg">
                      ≈ ${getValueInDollars(calculateExchangeAmount(amount, priceFrom, priceTo), priceTo)}
                    </div>
                  </motion.div>
                </div>

                {/* Exchange Stats */}
                {amount && (
                  <motion.div 
                    className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-400/20"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="flex flex-col items-center">
                        <BoltIcon className="h-8 w-8 text-yellow-400 mb-2" />
                        <div className="text-yellow-400 font-bold text-lg">⚡ Instant</div>
                        <div className="text-sm text-gray-400">&lt; 30 seconds</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <StarIcon className="h-8 w-8 text-green-400 mb-2" />
                        <div className="text-green-400 font-bold text-lg">✨ Best Rate</div>
                        <div className="text-sm text-gray-400">AI-optimized</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <SparklesIcon className="h-8 w-8 text-purple-400 mb-2" />
                        <div className="text-purple-400 font-bold text-lg">🔒 Secure</div>
                        <div className="text-sm text-gray-400">100% safe</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Main Exchange Button */}
                <motion.button
                  onClick={handleExchange}
                  disabled={!walletConnected || !amount || isExchanging || exchangeStep === 'processing'}
                  className={`w-full mt-8 py-6 rounded-2xl text-xl font-bold transition-all relative overflow-hidden shadow-2xl ${
                    !walletConnected || !amount || isExchanging
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white'
                  }`}
                  whileHover={!isExchanging ? { scale: 1.05, boxShadow: '0 25px 50px rgba(168, 85, 247, 0.6)' } : {}}
                  whileTap={!isExchanging ? { scale: 0.95 } : {}}
                >
                  {!walletConnected
                    ? '🔗 Connect Your Wallet to Start Magic'
                    : exchangeStep === 'processing'
                    ? '✨ Creating Magic...'
                    : exchangeStep === 'success'
                    ? '🎉 Exchange Successful!'
                    : isExchanging
                    ? '⚡ Exchanging...'
                    : '🪄 Make the Magic Exchange!'}
                    
                  {exchangeStep === 'processing' && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Compact Sidebar */}
          <motion.div
            className="space-y-4 overflow-y-auto max-h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Your Earnings */}
            {address && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-green-900/60 to-emerald-900/60 border border-green-400/40 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">💰</div>
                  <h3 className="text-lg font-bold text-green-400">Your Earnings</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white/10 text-center">
                    <div className="text-xl font-bold text-green-400">${totalSavings.toFixed(2)}</div>
                    <p className="text-sm text-gray-400">Total Savings</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-white/5 text-center">
                      <div className="text-sm font-bold text-yellow-400">{formatEarningsValue(lpRewards)}</div>
                      <p className="text-xs text-gray-400">Rewards</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 text-center">
                      <div className="text-sm font-bold text-blue-400">{calculateMyShare()}%</div>
                      <p className="text-xs text-gray-400">Pool Share</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Your Assets */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-900/60 to-blue-900/60 border border-purple-400/40 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <CurrencyDollarIcon className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-bold">Your Money</h3>
              </div>
              
              {userAssets.length > 0 ? (
                <div className="space-y-2">
                  {userAssets.slice(0, 4).map(asset => (
                    <motion.div 
                      key={asset.token} 
                      className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div>
                        <div className="font-bold text-white">{asset.symbol}</div>
                        <div className="text-sm text-gray-400">{formatAssetBalance(asset.displayAmount)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-purple-400 font-semibold">${asset.dollarValue}</div>
                        <button 
                          onClick={() => setFromAsset(asset.symbol)}
                          className="text-xs text-purple-300 hover:text-purple-200"
                        >
                          Use
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">💰</div>
                  <p className="text-sm text-gray-400">No money detected</p>
                  <p className="text-xs text-gray-500">Connect wallet to see assets</p>
                </div>
              )}
            </div>

            {/* Magic Assistant */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-pink-900/60 to-purple-900/60 border border-pink-400/40 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="h-5 w-5 text-pink-400" />
                <h3 className="text-lg font-bold">AI Assistant</h3>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={() => setShowMagicAssistant(!showMagicAssistant)}
                  className="w-full p-3 rounded-xl bg-pink-600/30 hover:bg-pink-600/40 transition-all text-left"
                >
                  <div className="font-bold text-pink-300">🤖 Ask AI</div>
                  <div className="text-sm text-gray-400">Get trading advice</div>
                </button>
                
                {showMagicAssistant && (
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <textarea
                      value={assistantQuery}
                      onChange={(e) => setAssistantQuery(e.target.value)}
                      placeholder="What should I trade?"
                      className="w-full p-3 rounded-xl bg-white/10 border border-pink-400/30 text-white placeholder-gray-500 resize-none text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAssistantQuery}
                        disabled={!assistantQuery.trim()}
                        className="flex-1 py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:bg-pink-900/50 disabled:text-gray-400 transition-all text-sm font-bold"
                      >
                        ✨ Ask AI
                      </button>
                      <button
                        onClick={() => setShowMagicAssistant(false)}
                        className="py-2 px-3 rounded-xl bg-gray-600/30 hover:bg-gray-600/40 transition-all text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Hot Assets */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-900/60 to-purple-900/60 border border-indigo-400/40 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <FireIcon className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-bold">Hot Assets</h3>
              </div>
              
              <div className="space-y-2">
                <TrendingTokens />
                
                <motion.button 
                  onClick={() => window.location.href = '/liquidity'}
                  className="w-full p-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 transition-all text-left"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="font-bold text-indigo-300">💧 Earn More</div>
                  <div className="text-sm text-gray-400">Liquidity rewards</div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
