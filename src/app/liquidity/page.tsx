
"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  PlusIcon,
  MinusIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  FireIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { usePrivyBarukContract } from '../lib/usePrivyBarukContract';
import { contractAddresses } from '../lib/contractConfig';
import { parseUnits, formatUnits } from 'viem';
import { usePrivy } from '@privy-io/react-auth';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/wagmi';
import { useBarukAMM, useUserAMMData } from '../lib/hooks/useBarukAMM';

const DEFAULT_PROTOCOL_ID = 'baruk';

export default function LiquidityPage() {
  const { user, authenticated } = usePrivy();
  const balances = useAppStore(s => s.balances);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const { callContract: privyCallContract, callTokenContract: privyCallTokenContract } = usePrivyBarukContract('amm');
  
  // Get user's wallet address from Privy
  let address: string | null = null;
  
  if (user?.wallet?.address) {
    // Handle case where address might be an object
    if (typeof user.wallet.address === 'string') {
      address = user.wallet.address;
    } else if (typeof user.wallet.address === 'object' && user.wallet.address !== null) {
      // If it's an object, try to extract the address string
      address = (user.wallet.address as { address?: string }).address || null;
    }
  }
  
  // Pool and earning data
  const { reserves, totalLiquidity, lpFeeBps } = useBarukAMM();
  const { liquidityBalance, lpRewards } = useUserAMMData(address);

  const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'positions'>('add');
  const [tokenA, setTokenA] = useState('TOKEN0');
  const [tokenB, setTokenB] = useState('TOKEN1');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');
  const [removePercentage, setRemovePercentage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');

  // Get protocol and assets
  const protocol = getSeiProtocolById(DEFAULT_PROTOCOL_ID) as SeiProtocol;
  const protocolAssets = getProtocolTokens(DEFAULT_PROTOCOL_ID);
  
  const allAssets = [
    { symbol: 'SEI', address: 'native', name: 'Sei Money' },
    ...protocolAssets.map(asset => ({ ...asset, name: asset.symbol }))
  ];

  // Mock position data - replace with real data
  const userPositions = [
    {
      id: 1,
      tokenA: 'TOKEN0',
      tokenB: 'TOKEN1',
      liquidity: '1250.50',
      value: '$2,890.45',
      apy: '15.2%',
      rewards: '45.2',
      fees24h: '12.80'
    },
    {
      id: 2,
      tokenA: 'SEI',
      tokenB: 'TOKEN2',
      liquidity: '890.25',
      value: '$1,456.78',
      apy: '22.8%',
      rewards: '23.1',
      fees24h: '8.95'
    }
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

  const getUSDValue = (amount: string, price: number) => {
    const num = parseFloat(amount) || 0;
    return (num * price).toFixed(2);
  };

  const formatBalance = (amount: string) => {
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

  const calculateRemoveAmount = () => {
    if (!liquidityBalance) return '0';
    try {
      const balance = Number(formatUnits(liquidityBalance, 18));
      return ((balance * removePercentage) / 100).toFixed(6);
    } catch {
      return '0';
    }
  };

  const handleAddLiquidity = async () => {
    if (!address || !authenticated) {
      toast.error('Please sign in with Privy first! 🔗');
      return;
    }

    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      toast.error('Please enter valid amounts for both assets! 💰');
      return;
    }

    if (tokenA === tokenB) {
      toast.error('Cannot provide liquidity with the same asset! 🔄');
      return;
    }

    setLoading(true);
    try {
      const tokenAData = allAssets.find(t => t.symbol === tokenA);
      const tokenBData = allAssets.find(t => t.symbol === tokenB);

      if (!tokenAData || !tokenBData) {
        throw new Error('Asset not found');
      }

      if (tokenAData.address === 'native' || tokenBData.address === 'native') {
        throw new Error('SEI money liquidity coming soon! ⭐');
      }

      const amountAInWei = parseUnits(amountA, 18);
      const amountBInWei = parseUnits(amountB, 18);

      // Approve tokens
      toast.loading('Setting up your liquidity provision... ⚡', { id: 'liquidity' });
      
      const approvalTxA = await privyCallTokenContract(
        tokenAData.address,
        'approve',
        [contractAddresses.amm as `0x${string}`, amountAInWei]
      );
      await waitForTransactionReceipt(config, { hash: approvalTxA.hash });

      const approvalTxB = await privyCallTokenContract(
        tokenBData.address,
        'approve',
        [contractAddresses.amm as `0x${string}`, amountBInWei]
      );
      await waitForTransactionReceipt(config, { hash: approvalTxB.hash });

      // Add liquidity
      toast.loading('Creating your liquidity position... ✨', { id: 'liquidity' });
      const addLiquidityTx = await privyCallContract(
        'addLiquidity',
        [amountAInWei, amountBInWei, address as `0x${string}`]
      );
      await waitForTransactionReceipt(config, { hash: addLiquidityTx.hash });

      toast.success('🎉 Liquidity added successfully! You\'re now earning fees!', { id: 'liquidity' });
      
      setAmountA('');
      setAmountB('');
      setActiveTab('positions');
    } catch (error) {
      console.error('Add liquidity error:', error);
      const errorMessage = (error as any)?.message || 'Something went wrong';
      toast.error(`Failed to add liquidity: ${errorMessage}`, { id: 'liquidity' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!address || !authenticated) {
      toast.error('Please sign in with Privy first! 🔗');
      return;
    }

    const calculatedAmount = calculateRemoveAmount();
    if (!calculatedAmount || parseFloat(calculatedAmount) <= 0) {
      toast.error('Please select an amount to remove! 💰');
      return;
    }

    setLoading(true);
    try {
      toast.loading('Removing your liquidity... 🔥', { id: 'remove' });
      
      const liquidityInWei = parseUnits(calculatedAmount, 18);
      const removeLiquidityTx = await privyCallContract(
        'removeLiquidity',
        [liquidityInWei]
      );
      await waitForTransactionReceipt(config, { hash: removeLiquidityTx.hash });

      toast.success('✅ Liquidity removed successfully!', { id: 'remove' });
      setRemovePercentage(25);
    } catch (error) {
      console.error('Remove liquidity error:', error);
      const errorMessage = (error as any)?.message || 'Something went wrong';
      toast.error(`Failed to remove liquidity: ${errorMessage}`, { id: 'remove' });
    } finally {
      setLoading(false);
    }
  };

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;
    
    try {
      setAiSuggestion('Analyzing optimal liquidity strategies... 🤖');
      
      const response = await fetch('/api/baruk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Liquidity advice: ${aiQuery}. Current positions: ${JSON.stringify(userPositions)}`,
          userId: address || 'anonymous',
          walletAddress: address,
        }),
      });
      
      if (!response.ok) {
        throw new Error('AI assistant is taking a break');
      }
      
      const data = await response.json();
      setAiSuggestion(data.text || 'Based on current market conditions, consider diversifying your liquidity across multiple pools for optimal returns! 🚀');
      toast.success('✨ AI analysis complete!');
      setAiQuery('');
    } catch (error) {
      console.error('AI query error:', error);
      setAiSuggestion('AI assistant is temporarily unavailable. Try providing liquidity to high-APY pools! 💡');
      toast.error('AI assistant error, but showing general advice!');
    }
  };

  // Get token balances
  const tokenABalance = balances.find(b => {
    if (tokenA === 'SEI' && b.token === 'native') return true;
    const assetData = allAssets.find(c => c.symbol === tokenA);
    return assetData && b.token === assetData.address;
  })?.amount || '0';
  
  const tokenBBalance = balances.find(b => {
    if (tokenB === 'SEI' && b.token === 'native') return true;
    const assetData = allAssets.find(c => c.symbol === tokenB);
    return assetData && b.token === assetData.address;
  })?.amount || '0';

  const tokenAData = allAssets.find(c => c.symbol === tokenA);
  const tokenBData = allAssets.find(c => c.symbol === tokenB);
  const tokenADecimals = tokenAData?.address === 'native' ? 18 : 18;
  const tokenBDecimals = tokenBData?.address === 'native' ? 18 : 18;
  
  const formattedTokenABalance = formatFromDecimals(tokenABalance, tokenADecimals);
  const formattedTokenBBalance = formatFromDecimals(tokenBBalance, tokenBDecimals);
  
  const priceA = tokenAData ? tokenPrices[tokenAData.address.toLowerCase()] || 0 : 0;
  const priceB = tokenBData ? tokenPrices[tokenBData.address.toLowerCase()] || 0 : 0;

  const formatEarningsValue = (value: bigint | undefined) => {
    if (!value) return '0';
    try {
      return formatUnits(value, 18);
    } catch {
      return '0';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Welcome Message for New Users */}
        {!address && (
          <motion.div 
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-900/60 to-blue-900/60 border border-purple-400/40 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-3xl mb-2">💧</div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to Liquidity Pools!</h1>
            <p className="text-gray-300">
              Provide liquidity to earn fees from every trade. Connect your wallet to start earning! 🚀
            </p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          {/* Main Liquidity Interface */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Tab Navigation */}
            <div className="flex space-x-1 p-1 bg-purple-900/40 rounded-xl">
              {[
                { key: 'add', label: 'Add Liquidity', icon: PlusIcon },
                { key: 'remove', label: 'Remove Liquidity', icon: MinusIcon },
                { key: 'positions', label: 'My Positions', icon: ChartBarIcon }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all
                    ${activeTab === tab.key 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
                    }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'add' && (
                <motion.div
                  key="add"
                  className="p-6 rounded-2xl bg-gradient-to-b from-purple-900/50 to-blue-900/50 border border-purple-400/40 backdrop-blur-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      💧 Add Liquidity
                    </h2>
                    <p className="text-gray-300 text-sm">
                      Provide assets to earn fees from trades. You'll receive liquidity tokens representing your share.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Token A Input */}
                    <motion.div 
                      className="p-4 rounded-xl bg-white/10 border border-purple-400/30"
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-300 font-medium">First Asset</span>
                        <span className="text-gray-300">Available: {formatBalance(formattedTokenABalance)}</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <input
                          type="number"
                          value={amountA}
                          onChange={e => setAmountA(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 bg-transparent text-xl font-bold focus:outline-none text-white placeholder-gray-500"
                        />
                        <TokenSelector
                          value={tokenA}
                          onChange={setTokenA}
                          tokens={allAssets}
                          className="min-w-[120px] bg-purple-600/30 hover:bg-purple-600/50"
                        />
                      </div>
                      <div className="mt-1 text-sm text-purple-300">
                        ≈ ${getUSDValue(amountA, priceA)}
                      </div>
                    </motion.div>

                    <div className="flex justify-center">
                      <div className="p-2 rounded-full bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/30">
                        <PlusIcon className="h-4 w-4 text-purple-300" />
                      </div>
                    </div>

                    {/* Token B Input */}
                    <motion.div 
                      className="p-4 rounded-xl bg-white/10 border border-blue-400/30"
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-300 font-medium">Second Asset</span>
                        <span className="text-gray-300">Available: {formatBalance(formattedTokenBBalance)}</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <input
                          type="number"
                          value={amountB}
                          onChange={e => setAmountB(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 bg-transparent text-xl font-bold focus:outline-none text-white placeholder-gray-500"
                        />
                        <TokenSelector
                          value={tokenB}
                          onChange={setTokenB}
                          tokens={allAssets}
                          className="min-w-[120px] bg-blue-600/30 hover:bg-blue-600/50"
                        />
                      </div>
                      <div className="mt-1 text-sm text-blue-300">
                        ≈ ${getUSDValue(amountB, priceB)}
                      </div>
                    </motion.div>

                    <motion.button
                      onClick={handleAddLiquidity}
                      disabled={!authenticated || !amountA || !amountB || loading}
                      className={`w-full py-4 rounded-xl text-lg font-bold transition-all
                        ${!authenticated || !amountA || !amountB || loading
                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl'
                        }`}
                      whileHover={!loading ? { scale: 1.02 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                      {!authenticated
                        ? '🔗 Sign In with Privy'
                        : loading
                        ? '✨ Adding Liquidity...'
                        : '💧 Add Liquidity & Start Earning'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'remove' && (
                <motion.div
                  key="remove"
                  className="p-6 rounded-2xl bg-gradient-to-b from-red-900/50 to-orange-900/50 border border-red-400/40 backdrop-blur-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                      🔥 Remove Liquidity
                    </h2>
                    <p className="text-gray-300 text-sm">
                      Remove your liquidity to get back your underlying assets plus any earned fees.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-white/10 border border-red-400/30">
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-300 font-medium">Amount to Remove</span>
                        <span className="text-gray-300">
                          Your Balance: {formatEarningsValue(liquidityBalance)}
                        </span>
                      </div>
                      
                      {/* Percentage Slider */}
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-red-300">{removePercentage}%</span>
                          <span className="text-red-300">≈ {calculateRemoveAmount()} LP</span>
                        </div>
                        
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={removePercentage}
                          onChange={(e) => setRemovePercentage(Number(e.target.value))}
                          className="w-full h-2 bg-red-900/30 rounded-lg appearance-none cursor-pointer slider"
                        />
                        
                        <div className="grid grid-cols-4 gap-2">
                          {[25, 50, 75, 100].map(percent => (
                            <button
                              key={percent}
                              onClick={() => setRemovePercentage(percent)}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all
                                ${removePercentage === percent 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-red-900/30 text-red-300 hover:bg-red-600/50'
                                }`}
                            >
                              {percent}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleRemoveLiquidity}
                      disabled={!authenticated || !liquidityBalance || loading}
                      className={`w-full py-4 rounded-xl text-lg font-bold transition-all
                        ${!authenticated || !liquidityBalance || loading
                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl'
                        }`}
                      whileHover={!loading ? { scale: 1.02 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                      {!authenticated
                        ? '🔗 Sign In with Privy'
                        : !liquidityBalance
                        ? '💧 No Liquidity to Remove'
                        : loading
                        ? '🔥 Removing Liquidity...'
                        : '🔥 Remove Liquidity'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'positions' && (
                <motion.div
                  key="positions"
                  className="space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {userPositions.length > 0 ? (
                    userPositions.map((position) => (
                      <motion.div
                        key={position.id}
                        className="p-6 rounded-2xl bg-gradient-to-b from-green-900/50 to-emerald-900/50 border border-green-400/40 backdrop-blur-sm"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-lg">{position.tokenA}</span>
                              <span className="text-gray-400">•</span>
                              <span className="font-bold text-lg">{position.tokenB}</span>
                            </div>
                            <span className="px-2 py-1 rounded-full bg-green-600/30 text-green-300 text-xs font-medium">
                              Active
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold text-lg">{position.apy}</div>
                            <div className="text-xs text-gray-400">APY</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Total Value</div>
                            <div className="font-bold text-white">{position.value}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Liquidity</div>
                            <div className="font-bold text-white">{position.liquidity}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Unclaimed Rewards</div>
                            <div className="font-bold text-yellow-400">{position.rewards}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Fees (24h)</div>
                            <div className="font-bold text-green-400">${position.fees24h}</div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                          <button className="flex-1 py-2 px-4 rounded-lg bg-green-600/30 hover:bg-green-600/50 transition-all text-green-300 font-medium">
                            💰 Claim Rewards
                          </button>
                          <button 
                            onClick={() => setActiveTab('remove')}
                            className="flex-1 py-2 px-4 rounded-lg bg-red-600/30 hover:bg-red-600/50 transition-all text-red-300 font-medium"
                          >
                            🔥 Remove
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className="p-8 rounded-2xl bg-gradient-to-b from-purple-900/30 to-blue-900/30 border border-purple-400/30 text-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="text-6xl mb-4">💧</div>
                      <h3 className="text-xl font-bold mb-2">No Liquidity Positions Yet</h3>
                      <p className="text-gray-400 mb-4">
                        Start providing liquidity to earn fees from trades!
                      </p>
                      <button
                        onClick={() => setActiveTab('add')}
                        className="py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold transition-all"
                      >
                        💧 Add Your First Position
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* AI Assistant */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-pink-900/50 to-purple-900/50 border border-pink-400/40">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="h-5 w-5 text-pink-400" />
                <h3 className="text-lg font-bold">AI Assistant</h3>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className="w-full p-3 rounded-lg bg-pink-600/30 hover:bg-pink-600/40 transition-all text-left"
                >
                  <div className="font-bold text-pink-300 text-sm">🤖 Get Liquidity Advice</div>
                  <div className="text-xs text-gray-400">Optimize your positions</div>
                </button>
                
                {showAIAssistant && (
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <textarea
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Ask about optimal pools, impermanent loss, yield strategies..."
                      className="w-full p-3 rounded-lg bg-white/10 border border-pink-400/30 text-white placeholder-gray-500 resize-none text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAIQuery}
                        disabled={!aiQuery.trim()}
                        className="flex-1 py-2 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:bg-pink-900/50 disabled:text-gray-400 transition-all text-sm font-bold"
                      >
                        ✨ Get Advice
                      </button>
                      <button
                        onClick={() => setShowAIAssistant(false)}
                        className="py-2 px-3 rounded-lg bg-gray-600/30 hover:bg-gray-600/40 transition-all text-sm"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {aiSuggestion && (
                  <motion.div 
                    className="p-3 rounded-lg bg-pink-900/30 border border-pink-400/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-sm text-pink-300">{aiSuggestion}</div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Pool Stats */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-purple-900/50 to-blue-900/50 border border-purple-400/40">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-purple-400" />
                Pool Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Value Locked</span>
                  <span className="text-white font-bold">$12.5M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">24h Volume</span>
                  <span className="text-white font-bold">$850K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Average APY</span>
                  <span className="text-green-400 font-bold">18.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Active Positions</span>
                  <span className="text-white font-bold">{userPositions.length}</span>
                </div>
              </div>
            </div>

            {/* Your Earnings */}
            {address && (
              <div className="p-4 rounded-xl bg-gradient-to-b from-green-900/50 to-emerald-900/50 border border-green-400/40">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                  Your Earnings
                </h3>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-white/10 text-center">
                    <div className="text-lg font-bold text-green-400">{formatEarningsValue(lpRewards)}</div>
                    <p className="text-xs text-gray-400">Total Rewards</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-white/5 text-center">
                      <div className="text-sm font-bold text-yellow-400">$68.45</div>
                      <p className="text-xs text-gray-400">Fees (24h)</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 text-center">
                      <div className="text-sm font-bold text-blue-400">2.34%</div>
                      <p className="text-xs text-gray-400">Pool Share</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-indigo-900/50 to-purple-900/50 border border-indigo-400/40">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <BoltIcon className="h-5 w-5 text-indigo-400" />
                Quick Actions
              </h3>
              
              <div className="space-y-2">
                <button 
                  onClick={() => setAiQuery('What are the best pools to provide liquidity right now?')}
                  className="w-full p-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 transition-all text-left"
                >
                  <div className="font-bold text-indigo-300 text-sm">🔥 Best Pools</div>
                  <div className="text-xs text-gray-400">AI recommendations</div>
                </button>
                
                <button className="w-full p-3 rounded-lg bg-green-600/30 hover:bg-green-600/40 transition-all text-left">
                  <div className="font-bold text-green-300 text-sm">📊 Pool Analytics</div>
                  <div className="text-xs text-gray-400">Detailed statistics</div>
                </button>
                
                <button className="w-full p-3 rounded-lg bg-yellow-600/30 hover:bg-yellow-600/40 transition-all text-left">
                  <div className="font-bold text-yellow-300 text-sm">⚡ Rebalance</div>
                  <div className="text-xs text-gray-400">Optimize positions</div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
