
"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { useWagmiBarukContract } from '../lib/useWagmiBarukContract';
import { contractAddresses } from '../lib/contractConfig';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/wagmi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DEFAULT_PROTOCOL_ID = 'baruk';

export default function LiquidityPage() {
  const { address, isConnected: wagmiIsConnected } = useAccount();
  const balances = useAppStore(s => s.balances);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const { callContract: wagmiCallContract, callTokenContract: wagmiCallTokenContract } = useWagmiBarukContract('amm');
  
  const [protocolId, setProtocolId] = useState<string>(DEFAULT_PROTOCOL_ID);
  const [tokenA, setTokenA] = useState('TOKEN0');
  const [tokenB, setTokenB] = useState('TOKEN1');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Get protocol and tokens
  const protocol = getSeiProtocolById(protocolId) as SeiProtocol;
  const protocolTokens = getProtocolTokens(protocolId);
  
  // Add SEI as a native token option
  const allTokens = [
    { symbol: 'SEI', address: 'native' },
    ...protocolTokens
  ];

  // Helper function to format amounts considering decimals
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
      console.error('Error formatting decimals:', error);
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
      console.error('Error formatting balance:', error);
      return '0';
    }
  };

  const handleAddLiquidity = async () => {
    if (!address || !wagmiIsConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      toast.error('Please enter valid amounts for both tokens');
      return;
    }

    if (tokenA === tokenB) {
      toast.error('Cannot add liquidity with the same token');
      return;
    }

    setLoading(true);
    try {
      // Find token addresses
      const tokenAData = allTokens.find(t => t.symbol === tokenA);
      const tokenBData = allTokens.find(t => t.symbol === tokenB);

      if (!tokenAData || !tokenBData) {
        toast.error('Token not found');
        return;
      }

      // Handle native SEI token
      if (tokenAData.address === 'native' || tokenBData.address === 'native') {
        toast.error('Native SEI liquidity not yet implemented');
        setLoading(false);
        return;
      }

      // Convert amounts to wei (assuming 18 decimals)
      const amountAInWei = parseUnits(amountA, 18);
      const amountBInWei = parseUnits(amountB, 18);

      // First approve both tokens
      const approvalTxA = await wagmiCallTokenContract(
        tokenAData.address,
        'approve',
        [contractAddresses.amm, amountAInWei]
      );
      await waitForTransactionReceipt(config, { hash: approvalTxA.hash });

      const approvalTxB = await wagmiCallTokenContract(
        tokenBData.address,
        'approve',
        [contractAddresses.amm, amountBInWei]
      );
      await waitForTransactionReceipt(config, { hash: approvalTxB.hash });

      // Add liquidity using the AMM contract
      const addLiquidityTx = await wagmiCallContract(
        'addLiquidity',
        [amountAInWei, amountBInWei, address]
      );
      console.log('Add liquidity transaction:', addLiquidityTx);
      await waitForTransactionReceipt(config, { hash: addLiquidityTx.hash });

      toast.success('Liquidity added successfully! ✨');
      
      // Reset form
      setAmountA('');
      setAmountB('');
    } catch (error) {
      console.error('Add liquidity error:', error);
      const errorMessage = (error as any)?.message || 'An unknown error occurred';
      toast.error(`Failed to add liquidity: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!address || !wagmiIsConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!liquidityAmount || parseFloat(liquidityAmount) <= 0) {
      toast.error('Please enter a valid liquidity amount');
      return;
    }

    setLoading(true);
    try {
      // Convert liquidity amount to wei (assuming 18 decimals)
      const liquidityInWei = parseUnits(liquidityAmount, 18);

      // Remove liquidity using the AMM contract
      const removeLiquidityTx = await wagmiCallContract(
        'removeLiquidity',
        [liquidityInWei]
      );
      console.log('Remove liquidity transaction:', removeLiquidityTx);
      await waitForTransactionReceipt(config, { hash: removeLiquidityTx.hash });

      toast.success('Liquidity removed successfully! 🔄');
      
      // Reset form
      setLiquidityAmount('');
    } catch (error) {
      console.error('Remove liquidity error:', error);
      const errorMessage = (error as any)?.message || 'An unknown error occurred';
      toast.error(`Failed to remove liquidity: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Get token balances and prices
  const tokenABalance = balances.find(b => {
    if (tokenA === 'SEI' && b.token === 'native') {
      return true;
    }
    const tokenData = allTokens.find(t => t.symbol === tokenA);
    return tokenData && b.token === tokenData.address;
  })?.amount || '0';
  
  const tokenBBalance = balances.find(b => {
    if (tokenB === 'SEI' && b.token === 'native') {
      return true;
    }
    const tokenData = allTokens.find(t => t.symbol === tokenB);
    return tokenData && b.token === tokenData.address;
  })?.amount || '0';

  // Get the decimals for proper formatting
  const tokenAData = allTokens.find(t => t.symbol === tokenA);
  const tokenBData = allTokens.find(t => t.symbol === tokenB);
  const tokenADecimals = tokenAData?.address === 'native' ? 18 : 18;
  const tokenBDecimals = tokenBData?.address === 'native' ? 18 : 18;
  
  // Format balances properly
  const formattedTokenABalance = formatFromDecimals(tokenABalance, tokenADecimals);
  const formattedTokenBBalance = formatFromDecimals(tokenBBalance, tokenBDecimals);
  
  // Look up prices by token address
  const priceA = tokenAData ? tokenPrices[tokenAData.address.toLowerCase()] || 0 : 0;
  const priceB = tokenBData ? tokenPrices[tokenBData.address.toLowerCase()] || 0 : 0;

  const chartData = [
    { date: '2024-07-01', tvl: 10000 },
    { date: '2024-07-02', tvl: 12000 },
    { date: '2024-07-03', tvl: 15000 },
    { date: '2024-07-04', tvl: 13000 },
    { date: '2024-07-05', tvl: 17000 },
  ];

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      {/* Welcome Message for New Users */}
      {!address && (
        <motion.div 
          className="mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-white mb-3">💰 Welcome to Baruk Liquidity!</h2>
          <p className="text-gray-300">Connect your wallet to start providing liquidity and earning fees from trades! 🚀</p>
        </motion.div>
      )}

      <div className="grid md:grid-cols-[1fr,380px] gap-8">
        {/* Main Liquidity Interface */}
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Add Liquidity Section */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-900/40 to-blue-900/40 border border-purple-500/30 backdrop-blur-sm shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Add Liquidity 💧
              </h2>
              <p className="text-gray-300 text-sm">
                Provide tokens to earn fees from trades in this pool.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="p-4 rounded-xl bg-white/5 border border-purple-500/20">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Token A</span>
                      <span className="text-sm text-gray-400">
                        Balance: {formattedTokenABalance}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <input
                        type="number"
                        value={amountA}
                        onChange={e => setAmountA(e.target.value)}
                        placeholder="0.0"
                        className="flex-1 bg-transparent text-2xl font-medium focus:outline-none"
                      />
                      <TokenSelector
                        value={tokenA}
                        onChange={setTokenA}
                        tokens={allTokens}
                        className="min-w-[120px]"
                      />
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      ≈ ${getUSDValue(amountA, priceA)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="text-purple-400 font-bold text-xl">+</span>
                </div>

                <div className="flex-1">
                  <div className="p-4 rounded-xl bg-white/5 border border-purple-500/20">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Token B</span>
                      <span className="text-sm text-gray-400">
                        Balance: {formattedTokenBBalance}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <input
                        type="number"
                        value={amountB}
                        onChange={e => setAmountB(e.target.value)}
                        placeholder="0.0"
                        className="flex-1 bg-transparent text-2xl font-medium focus:outline-none"
                      />
                      <TokenSelector
                        value={tokenB}
                        onChange={setTokenB}
                        tokens={allTokens}
                        className="min-w-[120px]"
                      />
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      ≈ ${getUSDValue(amountB, priceB)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddLiquidity}
                disabled={!wagmiIsConnected || !amountA || !amountB || loading}
                className={`w-full py-4 rounded-xl text-lg font-semibold transition-all
                  ${!wagmiIsConnected || !amountA || !amountB || loading
                    ? 'bg-purple-900/50 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
                  }`}
              >
                {!wagmiIsConnected
                  ? 'Connect Wallet'
                  : loading
                  ? 'Adding Liquidity... ✨'
                  : 'Add Liquidity 💧'}
              </button>
            </div>
          </div>

          {/* Remove Liquidity Section */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-red-900/40 to-orange-900/40 border border-red-500/30 backdrop-blur-sm shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Remove Liquidity 🔥
              </h2>
              <p className="text-gray-300 text-sm">
                Remove your liquidity tokens to get back your underlying assets.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-red-500/20">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Liquidity Amount</span>
                  <span className="text-sm text-gray-400">
                    Your LP Tokens: {/* TODO: Get actual LP balance */}
                  </span>
                </div>
                <input
                  type="number"
                  value={liquidityAmount}
                  onChange={e => setLiquidityAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-medium focus:outline-none"
                />
              </div>

              <button
                onClick={handleRemoveLiquidity}
                disabled={!wagmiIsConnected || !liquidityAmount || loading}
                className={`w-full py-4 rounded-xl text-lg font-semibold transition-all
                  ${!wagmiIsConnected || !liquidityAmount || loading
                    ? 'bg-red-900/50 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white'
                  }`}
              >
                {!wagmiIsConnected
                  ? 'Connect Wallet'
                  : loading
                  ? 'Removing Liquidity... 🔥'
                  : 'Remove Liquidity 🔥'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Pool Stats */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-purple-900/40 to-blue-900/40 border border-purple-500/30">
            <h3 className="text-lg font-semibold mb-4">Pool Statistics 📊</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Value Locked</span>
                <span className="text-white font-semibold">$12.5M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">24h Volume</span>
                <span className="text-white font-semibold">$850K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">APR</span>
                <span className="text-green-400 font-semibold">15.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your Share</span>
                <span className="text-white font-semibold">0.00%</span>
              </div>
            </div>
          </div>

          {/* TVL Chart */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-blue-900/40 to-purple-900/40 border border-blue-500/30">
            <h3 className="text-lg font-semibold mb-4">TVL Trend 📈</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#22d3ee"/>
                  <YAxis stroke="#a855f7"/>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563"/>
                  <Tooltip contentStyle={{ background: '#0a0a0a', border: 'none', color: '#fff' }}/>
                  <Area type="monotone" dataKey="tvl" stroke="#22d3ee" fillOpacity={1} fill="url(#colorTvl)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-green-900/40 to-emerald-900/40 border border-green-500/30">
            <h3 className="text-lg font-semibold mb-4">Quick Actions ⚡</h3>
            <div className="space-y-3">
              <button className="w-full p-3 rounded-lg bg-green-600/20 hover:bg-green-600/30 transition-colors text-left">
                <div className="font-medium">View Pool Details</div>
                <div className="text-sm text-gray-400">See detailed pool information</div>
              </button>
              <button className="w-full p-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 transition-colors text-left">
                <div className="font-medium">Calculate Returns</div>
                <div className="text-sm text-gray-400">Estimate your potential earnings</div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
