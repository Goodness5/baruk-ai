/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowsRightLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
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

const DEFAULT_PROTOCOL_ID = 'baruk';

export default function TradePage() {
  const { address, isConnected: wagmiIsConnected } = useAccount();
  const balances = useAppStore(s => s.balances);
  const balancesLoading = useAppStore(s => s.balancesLoading);
  const balancesError = useAppStore(s => s.balancesError);
  const setBalances = useAppStore(s => s.setBalances);
  const setBalancesError = useAppStore(s => s.setBalancesError);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const { callContract: wagmiCallContract, callTokenContract: wagmiCallTokenContract } = useWagmiBarukContract('router');

  const [tokenIn, setTokenIn] = useState('TOKEN0');
  const [tokenOut, setTokenOut] = useState('TOKEN1');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get protocol and tokens
  const protocol = getSeiProtocolById(DEFAULT_PROTOCOL_ID) as SeiProtocol;
  const protocolTokens = getProtocolTokens(DEFAULT_PROTOCOL_ID);
  
  // Add SEI as a native token option
  const allTokens = [
    { symbol: 'SEI', address: 'native' }, // Native SEI token
    ...protocolTokens
  ];
  
  // console.log('Available tokens:', allTokens);
  // console.log('Current balances:', balances);
  // console.log('Selected tokens:', { tokenIn, tokenOut });
  // console.log('Wallet connection state:', { 
  //   wagmiIsConnected, 
  //   address
  // });



  // Helper function to format amounts considering decimals
  const formatFromDecimals = (amount: string, decimals: number) => {
    try {
      const value = BigInt(amount);
      const divisor = BigInt(10 ** decimals);
      const integerPart = value / divisor;
      const fractionalPart = value % divisor;
      
      // Convert fractional part to string and pad with zeros
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      
      // Combine integer and fractional parts
      const fullNumber = `${integerPart}.${fractionalStr}`;
      
      // Remove trailing zeros after decimal point
      const trimmed = fullNumber.replace(/\.?0+$/, '');
      
      // If the number is very large, format it with commas
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

  // Helper function to calculate receive amount
  const calculateReceiveAmount = (amount: string, priceIn: number, priceOut: number): string => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return '0.0';
    
    // If both prices are 0, we can't calculate a ratio
    if (priceIn === 0 && priceOut === 0) {
      // For now, assume 1:1 ratio for same token or show placeholder
      if (tokenIn === tokenOut) {
        return amountNum.toFixed(6);
      } else {
        // Try to use mock prices for test tokens
        const mockPrices: Record<string, number> = {
          'TOKEN0': 1.5,
          'TOKEN1': 2.3,
          'TOKEN2': 0.8,
        };
        const mockPriceIn = mockPrices[tokenIn] || 0;
        const mockPriceOut = mockPrices[tokenOut] || 0;
        
        if (mockPriceIn > 0 && mockPriceOut > 0) {
          const receiveAmount = amountNum * (mockPriceIn / mockPriceOut);
          return receiveAmount.toFixed(6);
        }
        
        return '0.0'; // No price data available
      }
    }
    
    // If one price is 0, we can't calculate
    if (priceIn === 0 || priceOut === 0) {
      return '0.0'; // No price data available
    }
    
    // Calculate the receive amount based on price ratio
    const receiveAmount = amountNum * (priceIn / priceOut);
    return receiveAmount.toFixed(6);
  };

  const formatBalance = (amount: string) => {
    console.log('formatBalance called with:', { amount, type: typeof amount });
    try {
      const num = parseFloat(amount);
      console.log('parseFloat result:', num);
      if (num === 0) return '0';
      if (num < 0.0001) return '< 0.0001';
      
      // For very large numbers, use a more readable format
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

  const handleTrade = async () => {
    if (!address || !wagmiIsConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if wagmi wallet is connected
    if (!wagmiIsConnected || !address) {
      toast.error('Please connect your MetaMask wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (tokenIn === tokenOut) {
      toast.error('Cannot swap the same token');
      return;
    }

    setIsLoading(true);
    try {
      // Find token addresses
      const tokenInData = allTokens.find(t => t.symbol === tokenIn);
      const tokenOutData = allTokens.find(t => t.symbol === tokenOut);

      if (!tokenInData || !tokenOutData) {
        toast.error('Token not found');
        return;
      }

      // Handle native SEI token
      if (tokenInData.address === 'native') {
        toast.error('Native SEI swaps not yet implemented');
        setIsLoading(false);
        return;
      }

      if (tokenOutData.address === 'native') {
        toast.error('Native SEI swaps not yet implemented');
        setIsLoading(false);
        return;
      }

      // Convert amount to wei (assuming 18 decimals for simplicity)
      const amountInWei = parseUnits(amount, 18);
      console.log('Approval arguments:', { 
        tokenInDataAddress: tokenInData.address, 
        routerAddress: contractAddresses.router, 
        amountInWei: amountInWei.toString(),
        amountInWeiType: typeof amountInWei
      });

      // First approve the router to spend tokens
      const approvalTx = await wagmiCallTokenContract(
        tokenInData.address,
        'approve',
        [contractAddresses.router, amountInWei]
      );
      await waitForTransactionReceipt( config, { hash: approvalTx.hash });

      // Then perform the swap
      const swapTx = await wagmiCallContract(
        'swap',
        [tokenInData.address, tokenOutData.address, amountInWei, 0, Math.floor(Date.now() / 1000) + 1200, address]
      );
      console.log('Swap transaction:', swapTx);
      await waitForTransactionReceipt(config, { hash: swapTx.hash });

      toast.success('Swap completed successfully!');
      
      // Reset form
      setAmount('');
    } catch (error) {
      console.error('Swap error:', error);
      const errorMessage = (error as any)?.message || 'An unknown error occurred';
      toast.error(`Swap failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };



  // Fetch balances when wallet connects
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !wagmiIsConnected) return;
      
      try {
        // This would typically call an API or contract to get balances
        // For now, we'll use the balances from the store
        console.log('Fetching balances for address:', address);
      } catch (error) {
        console.error('Error fetching balances:', error);
        setBalancesError('Failed to fetch balances');
      }
    };

    fetchBalances();
    // Set up polling every 10 seconds
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [address, wagmiIsConnected, setBalances, setBalancesError]);

  // Get user's available tokens and format amounts properly
  const userTokens = balances.map(b => ({
    ...b,
    displayAmount: formatFromDecimals(b.amount, b.decimals),
    usdValue: getUSDValue(formatFromDecimals(b.amount, b.decimals), tokenPrices[b.token?.toLowerCase()])
  })).filter(b => parseFloat(b.displayAmount) > 0);

  // Get token balances and prices
  const tokenInBalance = balances.find(b => {
    // For native SEI token
    if (tokenIn === 'SEI' && b.token === 'native') {
      return true;
    }
    // For other tokens, match by address
    const tokenData = allTokens.find(t => t.symbol === tokenIn);
    return tokenData && b.token === tokenData.address;
  })?.amount || '0';
  
  const tokenOutBalance = balances.find(b => {
    // For native SEI token
    if (tokenOut === 'SEI' && b.token === 'native') {
      return true;
    }
    // For other tokens, match by address
    const tokenData = allTokens.find(t => t.symbol === tokenOut);
    return tokenData && b.token === tokenData.address;
  })?.amount || '0';
  
  // Get the decimals for proper formatting
  const tokenInData = allTokens.find(t => t.symbol === tokenIn);
  const tokenOutData = allTokens.find(t => t.symbol === tokenOut);
  const tokenInDecimals = tokenInData?.address === 'native' ? 18 : 18; // Default to 18 for ERC20
  const tokenOutDecimals = tokenOutData?.address === 'native' ? 18 : 18; // Default to 18 for ERC20
  
  // Format balances properly
  const formattedTokenInBalance = formatFromDecimals(tokenInBalance, tokenInDecimals);
  const formattedTokenOutBalance = formatFromDecimals(tokenOutBalance, tokenOutDecimals);
  
  // Look up prices by token address
  const priceIn = tokenInData ? tokenPrices[tokenInData.address.toLowerCase()] || 0 : 0;
  const priceOut = tokenOutData ? tokenPrices[tokenOutData.address.toLowerCase()] || 0 : 0;

  // console.log('Token balances:', { tokenInBalance, tokenOutBalance });
  // console.log('Formatted balances:', { formattedTokenInBalance, formattedTokenOutBalance });
  // console.log('Token prices:', { 
  //   tokenIn, 
  //   tokenOut, 
  //   priceIn, 
  //   priceOut,
  //   tokenPrices,
  //   tokenInData: tokenInData?.address,
  //   tokenOutData: tokenOutData?.address,
  //   tokenInLower: tokenInData?.address?.toLowerCase(),
  //   tokenOutLower: tokenOutData?.address?.toLowerCase()
  // });
  // console.log('Raw balance values:', { 
  //   tokenInBalance, 
  //   tokenOutBalance, 
  //   tokenInBalanceType: typeof tokenInBalance,
  //   tokenOutBalanceType: typeof tokenOutBalance 
  // });

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      {/* Welcome Message for New Users */}
      {!address && (
        <motion.div 
          className="mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-white mb-3">👋 Welcome to Baruk Swap!</h2>
          <p className="text-gray-300">Connect your wallet to start swapping tokens with just a few clicks. No complicated forms, just magic! ✨</p>
        </motion.div>
      )}



      <div className="grid md:grid-cols-[1fr,380px] gap-8">
        {/* Main Swap Interface */}
        <motion.div
          className="relative p-8 rounded-2xl bg-gradient-to-b from-purple-900/40 to-blue-900/40 border border-purple-500/30 backdrop-blur-sm shadow-xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Beginner-friendly instructions */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Swap Tokens Magically ✨
            </h1>
            <p className="text-gray-300 text-sm">
              Just choose your tokens, enter an amount, and click swap. It&apos;s that simple!
            </p>
          </div>

          {/* Token Input */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-purple-500/20">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">You Pay</span>
                <span className="text-sm text-gray-400">
                  Balance: {formattedTokenInBalance}
                </span>
              </div>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-2xl font-medium focus:outline-none"
                />
                <TokenSelector
                  value={tokenIn}
                  onChange={setTokenIn}
                  tokens={allTokens}
                  className="min-w-[120px]"
                />
              </div>
              <div className="mt-1 text-sm text-gray-500">
                ≈ ${getUSDValue(amount, priceIn)}
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setTokenIn(tokenOut);
                  setTokenOut(tokenIn);
                }}
                className="p-2 rounded-full bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
              >
                <ArrowsRightLeftIcon className="h-6 w-6 text-purple-400" />
              </button>
            </div>

            {/* Token Output */}
            <div className="p-4 rounded-xl bg-white/5 border border-purple-500/20">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">You Receive</span>
                <span className="text-sm text-gray-400">
                  Balance: {formattedTokenOutBalance}
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 text-2xl font-medium text-gray-400">
                  {amount ? calculateReceiveAmount(amount, priceIn, priceOut) : '0.0'}
                </div>
                <TokenSelector
                  value={tokenOut}
                  onChange={setTokenOut}
                  tokens={allTokens}
                  className="min-w-[120px]"
                />
              </div>
              <div className="mt-1 text-sm text-gray-500">
                ≈ ${getUSDValue(amount, priceOut)}
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleTrade}
            disabled={!wagmiIsConnected || !amount || isLoading}
            className={`w-full mt-6 py-4 rounded-xl text-lg font-semibold transition-all
              ${!wagmiIsConnected || !amount || isLoading
                ? 'bg-purple-900/50 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
              }`}
          >
            {!wagmiIsConnected
              ? 'Connect Wallet'
              : isLoading
              ? 'Swapping... ✨'
              : 'Swap Now 🪄'}
          </button>
        </motion.div>

        {/* Sidebar: Your Tokens & Suggestions */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Your Tokens Section */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-purple-900/40 to-blue-900/40 border border-purple-500/30">
            <h2 className="text-lg font-semibold mb-4">Your Magic Tokens ✨</h2>
            {userTokens.length > 0 ? (
              <div className="space-y-3">
                {userTokens.map(token => (
                  <div key={token.token} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-gray-400">{token.displayAmount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        ${token.usdValue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SparklesIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <p className="text-gray-400">No tokens found</p>
                <p className="text-sm text-gray-500 mt-2">Connect your wallet to see your tokens</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-blue-900/40 to-purple-900/40 border border-blue-500/30">
            <h2 className="text-lg font-semibold mb-4">Quick Actions ⚡</h2>
            <div className="space-y-3">
              <button className="w-full p-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 transition-colors text-left">
                <div className="font-medium">Add Liquidity</div>
                <div className="text-sm text-gray-400">Earn fees by providing liquidity</div>
              </button>
              <button className="w-full p-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 transition-colors text-left">
                <div className="font-medium">Stake Tokens</div>
                <div className="text-sm text-gray-400">Earn rewards by staking</div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}