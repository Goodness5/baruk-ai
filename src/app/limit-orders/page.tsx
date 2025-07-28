/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../store/useAppStore';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { useContractInteraction } from '../lib/contracts';
import { useBarukContract } from '../lib/useBarukContract';
import TokenSelector from '../components/TokenSelector';
import toast from 'react-hot-toast';

const DEFAULT_PROTOCOL_ID = 'baruk';

const orders = [
  { id: 1, pair: 'ETH/USDC', type: 'Buy', price: '1800', amount: '1.2', status: 'Open' },
  { id: 2, pair: 'ETH/DAI', type: 'Sell', price: '1850', amount: '0.5', status: 'Filled' },
];

export default function TriggersPage() {
  const address = useAppStore(s => s.address);
  const balances = useAppStore(s => s.balances);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const [protocolId, setProtocolId] = useState<string>(DEFAULT_PROTOCOL_ID);
  const protocol = getSeiProtocolById(protocolId) as SeiProtocol;
  const protocolTokens = getProtocolTokens(protocolId);
  const [tokenIn, setTokenIn] = useState(protocolTokens[0]?.address || '');
  const [tokenOut, setTokenOut] = useState(protocolTokens[1]?.address || '');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { callContract } = useBarukContract('limitOrder');
  const { executeContract, isConnected } = useContractInteraction();

  const balanceIn = balances.find(b => b.token === tokenIn)?.amount || '0';
  const balanceOut = balances.find(b => b.token === tokenOut)?.amount || '0';
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

  const handlePlaceTrigger = async () => {
    if (!address || !amount || !price || loading || !isConnected) return;
    setLoading(true);
    toast.loading('Setting your trigger...', { id: 'trigger' });
    try {
      await callContract(
        'placeOrder',
        [tokenIn, tokenOut, BigInt(amount), BigInt(price)],
        { account: address }
      );
      toast.success('Trigger set! 🚦', { id: 'trigger' });
    } catch (err: unknown) {
      let msg = 'Failed to fetch limit orders';
      if (typeof err === 'object' && err !== null && 'message' in err) {
        msg = (err as { message?: string }).message || msg;
      } else if (typeof err === 'string') {
        msg = err;
      }
      toast.error('Could not set trigger: ' + msg, { id: 'trigger' });
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
        <div className="text-white/80 text-sm">Set a trigger to buy or sell automatically at your magic price. I’ll watch the market for you!</div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold neon-text">Triggers</h1>
        <div className="ml-auto">
          <select
            className="bg-black/40 border border-neon-cyan text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
            value={protocolId}
            onChange={e => setProtocolId(e.target.value)}
          >
            {SEI_PROTOCOLS.filter(p => p.services.includes('limitOrder')).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
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
              {formatBalance(balanceIn)}
            </div>
            {priceIn && (
              <div className="text-neon-green text-sm">
                ${getUSDValue(balanceIn, priceIn)}
              </div>
            )}
            <div className="text-neon-cyan text-xs mt-1">
              {tokenPricesLoading ? 'Loading...' : priceIn ? `$${priceIn.toFixed(4)}` : 'No price'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-neon-cyan text-sm">To</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(balanceOut)}
            </div>
            {priceOut && (
              <div className="text-neon-green text-sm">
                ${getUSDValue(balanceOut, priceOut)}
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
        <input
          className="w-full bg-black/40 text-white rounded-lg px-4 py-2 border border-neon-green focus:outline-none"
          placeholder="Magic Price"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
        <button
          className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple neon-text font-bold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handlePlaceTrigger}
          disabled={!address || !amount || !price || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-neon-cyan rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Setting...' : 'Set Trigger'}
        </button>
      </div>
      <div className="hud-glass neon-border rounded-xl p-6 shadow-lg">
        <div className="neon-text mb-2 font-semibold">Open/Recent Triggers</div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-neon-cyan">
              <th>Pair</th>
              <th>Type</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="text-white border-b border-neon-cyan/20">
                <td>{order.pair}</td>
                <td>{order.type}</td>
                <td>{order.price}</td>
                <td>{order.amount}</td>
                <td>{order.status}</td>
                <td>{order.status === 'Open' && <button className="text-red-400 hover:underline">Cancel</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 hud-glass neon-border rounded-xl p-6 shadow-lg">
        <div className="neon-text mb-2 font-semibold">Trigger Book (Mock)</div>
        <div className="h-32 flex items-center justify-center text-neon-cyan/80">Trigger book visualization coming soon...</div>
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