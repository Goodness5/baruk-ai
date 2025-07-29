/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowsRightLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { useContractInteraction } from '../lib/contracts';
import { useBarukContract } from '../lib/useBarukContract';
import { contractAddresses } from '../lib/contractConfig';
import { parseUnits } from 'viem';
import { useAccount } from 'wagmi';

const DEFAULT_PROTOCOL_ID = 'baruk';

export default function TradePage() {
  const balances = useAppStore(s => s.balances);
  const setBalances = useAppStore(s => s.setBalances);
  const setBalancesError = useAppStore(s => s.setBalancesError);
  const address = useAppStore(s => s.address);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const [protocolId, setProtocolId] = useState<string>(DEFAULT_PROTOCOL_ID);
  const protocol = getSeiProtocolById(protocolId) as SeiProtocol;
  const protocolTokens = getProtocolTokens(protocolId);
  const [tokenIn, setTokenIn] = useState(protocolTokens[0]?.address || '');
  const [tokenOut, setTokenOut] = useState(protocolTokens[1]?.address || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { callContract, callTokenContract } = useBarukContract('router');
  const { isConnected: wagmiIsConnected, address: wagmiAddress } = useAccount();

  const tokenInBalance = balances.find(b => b.token === tokenIn)?.amount || '0';
  const tokenOutBalance = balances.find(b => b.token === tokenOut)?.amount || '0';
  const priceIn = tokenPrices[tokenIn.toLowerCase()];
  const priceOut = tokenPrices[tokenOut.toLowerCase()];

  const getUSDValue = (amount: string, price: number) => {
    const amountNum = parseFloat(amount) || 0;
    return (price * amountNum).toFixed(2);
  };

  const formatBalance = (amount: string) => {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(4);
  };

  const handleTrade = async () => {
    if (!address || !amount || loading || !wagmiIsConnected) return;
    setLoading(true);
    toast.loading('Magic in progress...', { id: 'trade' });
    try {
      // Convert amount to Wei (1e18)
      const amountInWei = parseUnits(amount, 18);
      const slippage = 0.99; // 1% slippage
      const minOutWei = parseUnits((parseFloat(amount) * slippage).toFixed(18), 18);
      const deadlineTime = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 minutes

      // First approve the router to spend tokens
      await callTokenContract(
        tokenIn,
        'approve',
        [contractAddresses.router, amountInWei]
      );

      // Then perform the swap
      await callContract(
        'swapExactTokensForTokens',
        [amountInWei, minOutWei, [tokenIn, tokenOut], address, deadlineTime],
        { account: address }
      );
      const minAmountOut = 0n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const recipient = address as `0x${string}`;
      await callContract(
        'swap',
        [tokenIn, tokenOut, BigInt(amount), minAmountOut, deadline, recipient],
        { account: recipient }
      );
      toast.success('Trade complete! ✨', { id: 'trade' });
    } catch (err: unknown) {
      let msg = 'Unknown error';
      if (typeof err === 'object' && err !== null && 'message' in err) {
        msg = (err as { message?: string }).message || msg;
      } else if (typeof err === 'string') {
        msg = err;
      }
      toast.error('Trade failed: ' + msg, { id: 'trade' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch balances when wallet is connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !wagmiIsConnected) {
        setBalances([]);
        return;
      }
      try {
        const { getWalletTokenHoldings } = await import('../lib/barukTools');
        const holdings = await getWalletTokenHoldings(address);
        console.log('first', holdings);
        if (Array.isArray(holdings) && holdings[0]?.contract_address) {
          const newBalances = holdings.map(token => ({
            token: token.contract_address,
            symbol: token.symbol,
            amount: token.balance,
            decimals: token.decimals,
            type: token.type,
            name: token.name
          }));
          setBalances(newBalances);
        } else {
          console.error('Invalid holdings format:', holdings);
          setBalancesError('Failed to fetch token balances');
        }
      } catch (err) {
        console.error('Error fetching balances:', err);
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

  // Helper function to format amounts considering decimals
  const formatFromDecimals = (amount: string, decimals: number) => {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const fractionalPart = value % divisor;
    const paddedFractional = fractionalPart.toString().padStart(decimals, '0');
    return `${integerPart}.${paddedFractional.slice(0, 6)}`.replace(/\.?0+$/, '');
  };

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
              Just choose your tokens, enter an amount, and click swap. It's that simple!
            </p>
          </div>

          {/* Token Input */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-purple-500/20">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">You Pay</span>
                <span className="text-sm text-gray-400">
                  Balance: {formatBalance(tokenInBalance)}
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
                  tokens={protocolTokens}
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
                  Balance: {formatBalance(tokenOutBalance)}
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 text-2xl font-medium text-gray-400">
                  {amount ? (parseFloat(amount) * (priceIn / priceOut)).toFixed(6) : '0.0'}
                </div>
                <TokenSelector
                  value={tokenOut}
                  onChange={setTokenOut}
                  tokens={protocolTokens}
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
            disabled={!wagmiIsConnected || !amount || loading}
            className={`w-full mt-6 py-4 rounded-xl text-lg font-semibold transition-all
              ${!wagmiIsConnected || !amount || loading
                ? 'bg-purple-900/50 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
              }`}
          >
            {!wagmiIsConnected
              ? 'Connect Wallet'
              : loading
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
              <div className="text-center text-gray-400 py-4">
                No tokens found in your wallet yet
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-blue-900/40 to-purple-900/40 border border-blue-500/30">
            <h2 className="text-lg font-semibold mb-4">Quick Tips 💡</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                You can swap any token for any other token
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                Make sure to leave some tokens for gas fees
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                The swap price includes a small 0.3% fee
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
      
}