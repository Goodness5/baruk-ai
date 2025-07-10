"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowsRightLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { useContractInteraction } from '../lib/contracts';

const DEFAULT_PROTOCOL_ID = 'baruk';

export default function TradePage() {
  const balances = useAppStore(s => s.balances);
  const balancesLoading = useAppStore(s => s.balancesLoading);
  const balancesError = useAppStore(s => s.balancesError);
  const address = useAppStore(s => s.address);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const tokenPricesError = useAppStore(s => s.tokenPricesError);
  const [protocolId, setProtocolId] = useState<string>(DEFAULT_PROTOCOL_ID);
  const protocol = getSeiProtocolById(protocolId) as SeiProtocol;
  const protocolTokens = getProtocolTokens(protocolId);
  const [tokenIn, setTokenIn] = useState(protocolTokens[0]?.address || '');
  const [tokenOut, setTokenOut] = useState(protocolTokens[1]?.address || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { executeContract, isConnected } = useContractInteraction();

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
    if (!address || !amount || loading || !isConnected) return;
    setLoading(true);
    toast.loading('Magic in progress...', { id: 'trade' });
    try {
      const minAmountOut = 0n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const recipient = address as `0x${string}`;
      await executeContract(
        protocol.type,
        'router',
        'swap',
        [tokenIn, tokenOut, BigInt(amount), minAmountOut, deadline, recipient],
        { account: recipient }
      );
      toast.success('Trade complete! ✨', { id: 'trade' });
    } catch (err: any) {
      toast.error('Trade failed: ' + (err?.message || err), { id: 'trade' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-lg mx-auto mt-10 p-8 rounded-2xl hud-glass neon-border shadow-xl space-y-8"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* AI Agent Tip */}
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="h-7 w-7 neon-text animate-pulse" />
        <div className="text-lg neon-text font-bold">AI Tip:</div>
        <div className="text-white/80 text-sm">Just pick what you want to swap, enter an amount, and tap <b>Trade</b>. I’ll handle the rest!</div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <ArrowsRightLeftIcon className="h-7 w-7 neon-text" />
        <h1 className="text-2xl font-bold neon-text">Trade</h1>
        <div className="ml-auto">
          <select
            className="bg-black/40 border border-neon-cyan text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
            value={protocolId}
            onChange={e => setProtocolId(e.target.value)}
          >
            {SEI_PROTOCOLS.filter(p => p.services.includes('swap')).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Protocol Info */}
      <div className="bg-black/30 rounded-lg p-3 border border-neon-cyan/30">
        <div className="text-neon-cyan text-sm">
          <span className="font-semibold">Magic Engine:</span> {protocol.name}
        </div>
        <div className="text-neon-cyan text-sm">
          <span className="font-semibold">Tokens:</span> {protocolTokens.map(t => t.symbol).join(', ')}
        </div>
      </div>
      {/* Real-time Balance Display */}
      <div className="bg-black/40 rounded-lg p-4 border border-neon-cyan/20">
        <div className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>💰</span>
          My Magic Vault
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-neon-cyan text-sm">From</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(tokenInBalance)}
            </div>
            {priceIn && (
              <div className="text-neon-green text-sm">
                ${getUSDValue(tokenInBalance, priceIn)}
              </div>
            )}
            <div className="text-neon-cyan text-xs mt-1">
              {tokenPricesLoading ? 'Loading...' : priceIn ? `$${priceIn.toFixed(4)}` : 'No price'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-neon-cyan text-sm">To</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(tokenOutBalance)}
            </div>
            {priceOut && (
              <div className="text-neon-green text-sm">
                ${getUSDValue(tokenOutBalance, priceOut)}
              </div>
            )}
            <div className="text-neon-cyan text-xs mt-1">
              {tokenPricesLoading ? 'Loading...' : priceOut ? `$${priceOut.toFixed(4)}` : 'No price'}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <TokenSelector tokens={protocolTokens} value={tokenIn} onChange={setTokenIn} className="flex-1" />
          <span className="neon-text font-bold">→</span>
          <TokenSelector tokens={protocolTokens} value={tokenOut} onChange={setTokenOut} className="flex-1" />
        </div>
        <input
          className="w-full bg-black/40 text-white rounded-lg px-4 py-2 border border-neon-cyan focus:outline-none"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <button
          className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple neon-text font-bold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleTrade}
          disabled={!address || !amount || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-neon-cyan rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Trading...' : 'Trade'}
        </button>
      </div>
      <style jsx>{`
        .loader {
          border-top-color: #22d3ee;
          border-right-color: #a855f7;
          border-bottom-color: #22d37a;
          border-left-color: transparent;
        }
      `}</style>
    </motion.div>
  );
} 