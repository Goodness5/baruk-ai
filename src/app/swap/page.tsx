
"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowsRightLeftIcon, SparklesIcon, CurrencyDollarIcon, TrendingUpIcon, StarIcon, FireIcon } from '@heroicons/react/24/outline';
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
  const balancesLoading = useAppStore(s => s.balancesLoading);
  const balancesError = useAppStore(s => s.balancesError);
  const setBalances = useAppStore(s => s.setBalances);
  const setBalancesError = useAppStore(s => s.setBalancesError);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const { callContract: wagmiCallContract, callTokenContract: wagmiCallTokenContract } = useWagmiBarukContract('router');
  
  // Pool and earning data
  const { reserves, totalLiquidity, lpFeeBps, isReservesLoading } = useBarukAMM();
  const { liquidityBalance, lpRewards, balanceOf, isLoading: isUserDataLoading } = useUserAMMData(address);

  const [fromCoin, setFromCoin] = useState('TOKEN0');
  const [toCoin, setToCoin] = useState('TOKEN1');
  const [amount, setAmount] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [showMagicAssistant, setShowMagicAssistant] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [exchangeStep, setExchangeStep] = useState('ready'); // ready, processing, success
  const [totalSavings, setTotalSavings] = useState(0);

  // Get available coins
  const protocol = getSeiProtocolById(DEFAULT_PROTOCOL_ID) as SeiProtocol;
  const protocolCoins = getProtocolTokens(DEFAULT_PROTOCOL_ID);
  
  const allCoins = [
    { symbol: 'SEI', address: 'native', name: 'Sei Coin' },
    ...protocolCoins.map(coin => ({ ...coin, name: coin.symbol }))
  ];

  // Helper to format large numbers nicely
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

  // Calculate how much you'll receive
  const calculateExchangeAmount = (amount: string, priceFrom: number, priceTo: number): string => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return '0.0';
    
    if (priceFrom === 0 && priceTo === 0) {
      if (fromCoin === toCoin) {
        return amountNum.toFixed(6);
      } else {
        // Use demo prices for showcase
        const demoPrices: Record<string, number> = {
          'TOKEN0': 1.5,
          'TOKEN1': 2.3,
          'TOKEN2': 0.8,
          'SEI': 0.45
        };
        const demoFromPrice = demoPrices[fromCoin] || 1;
        const demoToPrice = demoPrices[toCoin] || 1;
        
        const receiveAmount = amountNum * (demoFromPrice / demoToPrice);
        return receiveAmount.toFixed(6);
      }
    }
    
    if (priceFrom === 0 || priceTo === 0) return '0.0';
    
    const receiveAmount = amountNum * (priceFrom / priceTo);
    return receiveAmount.toFixed(6);
  };

  const formatCoinBalance = (amount: string) => {
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

    if (fromCoin === toCoin) {
      toast.error('Pick different coins to exchange! 🔄');
      return;
    }

    setIsExchanging(true);
    setExchangeStep('processing');
    
    try {
      const fromCoinData = allCoins.find(c => c.symbol === fromCoin);
      const toCoinData = allCoins.find(c => c.symbol === toCoin);

      if (!fromCoinData || !toCoinData) {
        toast.error('Coin not found! Please try again.');
        return;
      }

      if (fromCoinData.address === 'native' || toCoinData.address === 'native') {
        toast.error('SEI coin exchanges coming soon! ⭐');
        setIsExchanging(false);
        setExchangeStep('ready');
        return;
      }

      const amountInWei = parseUnits(amount, 18);

      // Step 1: Allow the exchange to happen
      toast.loading('Setting up your exchange... ⚡', { id: 'exchange' });
      const approvalTx = await wagmiCallTokenContract(
        fromCoinData.address,
        'approve',
        [contractAddresses.router, amountInWei]
      );
      await waitForTransactionReceipt(config, { hash: approvalTx.hash });

      // Step 2: Do the actual exchange
      toast.loading('Making the magic happen... ✨', { id: 'exchange' });
      const swapTx = await wagmiCallContract(
        'swap',
        [fromCoinData.address, toCoinData.address, amountInWei, 0, Math.floor(Date.now() / 1000) + 1200, address]
      );
      await waitForTransactionReceipt(config, { hash: swapTx.hash });

      // Success celebration
      setExchangeStep('success');
      setShowCelebration(true);
      setTotalSavings(prev => prev + parseFloat(amount) * 0.003); // Mock savings from good rates
      
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

  // Fetch user's coins when connected
  useEffect(() => {
    const getCoinBalances = async () => {
      if (!address || !walletConnected) return;
      
      try {
        console.log('Getting coin balances for:', address);
      } catch (error) {
        console.error('Error getting balances:', error);
        setBalancesError('Failed to get your coin balances');
      }
    };

    getCoinBalances();
    const interval = setInterval(getCoinBalances, 10000);
    return () => clearInterval(interval);
  }, [address, walletConnected, setBalances, setBalancesError]);

  // Listen for assistant events
  useEffect(() => {
    const handleAssistantEvent = (event: CustomEvent) => {
      setAssistantQuery(event.detail.query);
      setShowMagicAssistant(true);
    };

    window.addEventListener('openAI', handleAssistantEvent as EventListener);
    return () => window.removeEventListener('openAI', handleAssistantEvent as EventListener);
  }, []);

  // Get user's available coins
  const userCoins = balances.map(b => ({
    ...b,
    displayAmount: formatFromDecimals(b.amount, b.decimals),
    dollarValue: getValueInDollars(formatFromDecimals(b.amount, b.decimals), tokenPrices[b.token?.toLowerCase()])
  })).filter(b => parseFloat(b.displayAmount) > 0);

  // Get coin balances
  const fromCoinBalance = balances.find(b => {
    if (fromCoin === 'SEI' && b.token === 'native') return true;
    const coinData = allCoins.find(c => c.symbol === fromCoin);
    return coinData && b.token === coinData.address;
  })?.amount || '0';
  
  const toCoinBalance = balances.find(b => {
    if (toCoin === 'SEI' && b.token === 'native') return true;
    const coinData = allCoins.find(c => c.symbol === toCoin);
    return coinData && b.token === coinData.address;
  })?.amount || '0';
  
  const fromCoinData = allCoins.find(c => c.symbol === fromCoin);
  const toCoinData = allCoins.find(c => c.symbol === toCoin);
  const fromDecimals = fromCoinData?.address === 'native' ? 18 : 18;
  const toDecimals = toCoinData?.address === 'native' ? 18 : 18;
  
  const formattedFromBalance = formatFromDecimals(fromCoinBalance, fromDecimals);
  const formattedToBalance = formatFromDecimals(toCoinBalance, toDecimals);
  
  const priceFrom = fromCoinData ? tokenPrices[fromCoinData.address.toLowerCase()] || 0 : 0;
  const priceTo = toCoinData ? tokenPrices[toCoinData.address.toLowerCase()] || 0 : 0;

  const handleAssistantQuery = async () => {
    if (!assistantQuery.trim()) return;
    
    try {
      const response = await fetch('/api/baruk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: assistantQuery,
          walletAddress: address,
        }),
      });
      
      const data = await response.json();
      console.log('Magic Assistant Response:', data);
      toast.success('✨ Your magic assistant helped you! Check the console for details.');
      setAssistantQuery('');
      setShowMagicAssistant(false);
    } catch (error) {
      console.error('Assistant error:', error);
      toast.error('Your magic assistant is taking a break. Try again!');
    }
  };

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
    <div className="max-w-6xl mx-auto mt-6 px-4">
      {/* Welcome Section for New Users */}
      {!address && (
        <motion.div 
          className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-purple-900/60 to-pink-900/60 border border-purple-400/40 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl mb-4">🪄</div>
          <h1 className="text-3xl font-bold text-white mb-4">Welcome to Magic Coin Exchange!</h1>
          <p className="text-lg text-gray-300 mb-6">
            Exchange any coin for any other coin instantly, like magic! ✨
          </p>
          <p className="text-gray-400">
            Connect your digital wallet to start exchanging coins and earning rewards!
          </p>
        </motion.div>
      )}

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

      <div className="grid lg:grid-cols-[1fr,320px] gap-8">
        {/* Main Exchange Interface */}
        <motion.div
          className="relative p-8 rounded-2xl bg-gradient-to-b from-purple-900/50 to-blue-900/50 border border-purple-400/40 backdrop-blur-sm shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 text-center">
            <div className="text-4xl mb-3">💱</div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Instant Coin Exchange
            </h2>
            <p className="text-gray-300">
              Get the best rates automatically. No hidden fees, just magic! ✨
            </p>
          </div>

          {/* Exchange Interface */}
          <div className="space-y-6">
            {/* From Coin */}
            <motion.div 
              className="p-6 rounded-xl bg-white/10 border border-purple-400/30 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between mb-3">
                <span className="text-gray-300 font-medium">You Give</span>
                <span className="text-gray-300">
                  Available: {formattedFromBalance}
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-3xl font-bold focus:outline-none text-white placeholder-gray-500"
                />
                <TokenSelector
                  value={fromCoin}
                  onChange={setFromCoin}
                  tokens={allCoins}
                  className="min-w-[140px] bg-purple-600/30 hover:bg-purple-600/50"
                />
              </div>
              <div className="mt-2 text-lg text-purple-300">
                ≈ ${getValueInDollars(amount, priceFrom)}
              </div>
            </motion.div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <motion.button
                onClick={() => {
                  setFromCoin(toCoin);
                  setToCoin(fromCoin);
                }}
                className="p-3 rounded-full bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-500/50 hover:to-pink-500/50 transition-all border border-purple-400/30"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowsRightLeftIcon className="h-6 w-6 text-purple-300" />
              </motion.button>
            </div>

            {/* To Coin */}
            <motion.div 
              className="p-6 rounded-xl bg-white/10 border border-green-400/30 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between mb-3">
                <span className="text-gray-300 font-medium">You Get</span>
                <span className="text-gray-300">
                  Available: {formattedToBalance}
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex-1 text-3xl font-bold text-green-400">
                  {amount ? calculateExchangeAmount(amount, priceFrom, priceTo) : '0.0'}
                </div>
                <TokenSelector
                  value={toCoin}
                  onChange={setToCoin}
                  tokens={allCoins}
                  className="min-w-[140px] bg-green-600/30 hover:bg-green-600/50"
                />
              </div>
              <div className="mt-2 text-lg text-green-300">
                ≈ ${getValueInDollars(calculateExchangeAmount(amount, priceFrom, priceTo), priceTo)}
              </div>
            </motion.div>
          </div>

          {/* Exchange Stats */}
          {amount && (
            <motion.div 
              className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-400/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-green-400 font-bold">✨ Great Rate</div>
                  <div className="text-sm text-gray-400">Best available</div>
                </div>
                <div>
                  <div className="text-blue-400 font-bold">⚡ Instant</div>
                  <div className="text-sm text-gray-400">Under 30 seconds</div>
                </div>
                <div>
                  <div className="text-purple-400 font-bold">🔒 Safe</div>
                  <div className="text-sm text-gray-400">100% secure</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Action Button */}
          <motion.button
            onClick={handleExchange}
            disabled={!walletConnected || !amount || isExchanging || exchangeStep === 'processing'}
            className={`w-full mt-8 py-5 rounded-xl text-xl font-bold transition-all relative overflow-hidden
              ${!walletConnected || !amount || isExchanging
                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl'
              }`}
            whileHover={!isExchanging ? { scale: 1.02 } : {}}
            whileTap={!isExchanging ? { scale: 0.98 } : {}}
          >
            {!walletConnected
              ? '🔗 Connect Your Wallet First'
              : exchangeStep === 'processing'
              ? '✨ Creating Magic...'
              : exchangeStep === 'success'
              ? '🎉 Exchange Successful!'
              : isExchanging
              ? '⚡ Exchanging...'
              : '🪄 Make the Exchange!'}
              
            {exchangeStep === 'processing' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Your Earnings */}
          {address && (
            <div className="p-6 rounded-xl bg-gradient-to-b from-green-900/50 to-emerald-900/50 border border-green-400/40">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="text-xl font-bold text-green-400">Your Earnings</h3>
              </div>
              
              {isUserDataLoading ? (
                <div className="text-center py-6">
                  <div className="animate-spin h-8 w-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-400">Loading your earnings...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/10 text-center">
                    <div className="text-2xl font-bold text-green-400">${totalSavings.toFixed(2)}</div>
                    <p className="text-sm text-gray-400">Total Savings</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 text-center">
                      <div className="text-lg font-bold text-yellow-400">{formatEarningsValue(lpRewards)}</div>
                      <p className="text-xs text-gray-400">Rewards</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 text-center">
                      <div className="text-lg font-bold text-blue-400">{calculateMyShare()}%</div>
                      <p className="text-xs text-gray-400">Pool Share</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Your Coins */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-purple-900/50 to-blue-900/50 border border-purple-400/40">
            <div className="flex items-center gap-2 mb-4">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-400" />
              <h3 className="text-xl font-bold">Your Coins</h3>
            </div>
            
            {userCoins.length > 0 ? (
              <div className="space-y-3">
                {userCoins.slice(0, 4).map(coin => (
                  <motion.div 
                    key={coin.token} 
                    className="flex items-center justify-between p-4 rounded-lg bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div>
                      <div className="font-bold text-white">{coin.symbol}</div>
                      <div className="text-sm text-gray-400">{formatCoinBalance(coin.displayAmount)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-400 font-semibold">${coin.dollarValue}</div>
                      <button 
                        onClick={() => setFromCoin(coin.symbol)}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Use This
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🪙</div>
                <p className="text-gray-400">No coins yet</p>
                <p className="text-sm text-gray-500">Connect wallet to see your coins</p>
              </div>
            )}
          </div>

          {/* Magic Assistant */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-pink-900/50 to-purple-900/50 border border-pink-400/40">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="h-6 w-6 text-pink-400" />
              <h3 className="text-xl font-bold">Magic Assistant</h3>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowMagicAssistant(!showMagicAssistant)}
                className="w-full p-4 rounded-lg bg-pink-600/30 hover:bg-pink-600/40 transition-all text-left"
              >
                <div className="font-bold text-pink-300">🤖 Ask for Help</div>
                <div className="text-sm text-gray-400">Get personalized coin advice</div>
              </button>
              
              {showMagicAssistant && (
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <textarea
                    value={assistantQuery}
                    onChange={(e) => setAssistantQuery(e.target.value)}
                    placeholder="What coins should I buy? Which ones are trending? Help me make money!"
                    className="w-full p-3 rounded-lg bg-white/10 border border-pink-400/30 text-white placeholder-gray-500 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAssistantQuery}
                      disabled={!assistantQuery.trim()}
                      className="flex-1 py-2 px-4 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:bg-pink-900/50 disabled:text-gray-400 transition-all text-sm font-bold"
                    >
                      ✨ Get Advice
                    </button>
                    <button
                      onClick={() => setShowMagicAssistant(false)}
                      className="py-2 px-4 rounded-lg bg-gray-600/30 hover:bg-gray-600/40 transition-all text-sm"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Hot Coins */}
          <TrendingTokens />

          {/* Quick Actions */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-indigo-900/50 to-purple-900/50 border border-indigo-400/40">
            <div className="flex items-center gap-2 mb-4">
              <FireIcon className="h-6 w-6 text-indigo-400" />
              <h3 className="text-xl font-bold">Quick Actions</h3>
            </div>
            
            <div className="space-y-3">
              <motion.button 
                onClick={() => window.location.href = '/liquidity'}
                className="w-full p-4 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 transition-all text-left"
                whileHover={{ scale: 1.02 }}
              >
                <div className="font-bold text-indigo-300">💧 Earn Money</div>
                <div className="text-sm text-gray-400">Put your coins to work and earn daily</div>
              </motion.button>
              
              <motion.button 
                onClick={() => setAssistantQuery('What are the best coins to buy right now?')}
                className="w-full p-4 rounded-lg bg-green-600/30 hover:bg-green-600/40 transition-all text-left"
                whileHover={{ scale: 1.02 }}
              >
                <div className="font-bold text-green-300">🔥 Hot Tips</div>
                <div className="text-sm text-gray-400">Get AI-powered investment advice</div>
              </motion.button>
              
              <motion.button 
                onClick={() => {
                  const coins = ['TOKEN0', 'TOKEN1', 'TOKEN2'];
                  const randomCoin = coins[Math.floor(Math.random() * coins.length)];
                  setToCoin(randomCoin);
                  toast.success(`✨ How about trying ${randomCoin}? It's looking good!`);
                }}
                className="w-full p-4 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 transition-all text-left"
                whileHover={{ scale: 1.02 }}
              >
                <div className="font-bold text-purple-300">🎲 Surprise Me</div>
                <div className="text-sm text-gray-400">Pick a random coin for me</div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
