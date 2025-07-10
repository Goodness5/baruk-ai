"use client";
import { useAppStore } from '../store/useAppStore';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol } from '../lib/seiProtocols';

const pools = [
  {
    name: 'ETH/USDC',
    tokens: ['0x8923889697C9467548ABe8E815105993EBC785b6', '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7'],
    yourStake: '$2,000',
    rewards: '12.3 BAR',
  },
  {
    name: 'ETH/DAI',
    tokens: ['0x8923889697C9467548ABe8E815105993EBC785b6', '0xD6383ef8A67E929274cE9ca05b694f782A5070D7'],
    yourStake: '$1,100',
    rewards: '8.1 BAR',
  },
  {
    name: 'USDC/DAI',
    tokens: ['0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7', '0xD6383ef8A67E929274cE9ca05b694f782A5070D7'],
    yourStake: '$500',
    rewards: '3.7 BAR',
  },
];

const DEFAULT_PROTOCOL_ID = 'baruk';

export default function PoolsPage() {
  const tokens = useAppStore(s => s.tokens);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const tokenPricesError = useAppStore(s => s.tokenPricesError);
  const [protocolId, setProtocolId] = useState<string>(DEFAULT_PROTOCOL_ID);
  const protocol = getSeiProtocolById(protocolId) as SeiProtocol;

  const getSymbol = (address: string) => tokens.find(t => t.address.toLowerCase() === address.toLowerCase())?.symbol || address.slice(0, 6);
  const getPrice = (address: string) => tokenPrices[address.toLowerCase()];

  return (
    <motion.div
      className="max-w-3xl mx-auto mt-10 space-y-8"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* AI Agent Tip */}
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="h-7 w-7 neon-text animate-pulse" />
        <div className="text-lg neon-text font-bold">AI Tip:</div>
        <div className="text-white/80 text-sm">Stake your tokens in a pool to earn magic rewards! I’ll help you find the best pools and keep track of your garden.</div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold neon-text">Pools</h1>
        <div className="ml-auto">
          <select
            className="bg-black/40 border border-neon-cyan text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
            value={protocolId}
            onChange={e => setProtocolId(e.target.value)}
          >
            {SEI_PROTOCOLS.filter(p => p.services.includes('farm')).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="neon-text text-sm mb-2">Selected Magic Engine: <span className="font-bold">{protocol?.name}</span></div>
      <div className="grid md:grid-cols-2 gap-6">
        {pools.map((pool) => (
          <div key={pool.name} className="rounded-2xl p-6 hud-glass neon-border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-semibold neon-text">{pool.name}</div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex gap-2 text-xs neon-text">
                {pool.tokens.map(addr => (
                  <span key={addr} className="flex-1">
                    {getSymbol(addr)}: {tokenPricesLoading ? 'Loading...' : tokenPricesError ? <span className="text-red-400">{tokenPricesError}</span> : getPrice(addr) ? `$${getPrice(addr).toFixed(4)}` : 'No price'}
                  </span>
                ))}
              </div>
              <div className="flex justify-between neon-text">
                <span>Your Stake</span>
                <span className="text-white font-bold">{pool.yourStake}</span>
              </div>
              <div className="flex justify-between neon-text">
                <span>Magic Rewards</span>
                <span className="text-white font-bold">{pool.rewards}</span>
              </div>
            </div>
            <button className="mt-6 w-full py-2 rounded-lg bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple neon-text font-bold shadow-lg hover:opacity-90 transition">Stake / Unstake</button>
          </div>
        ))}
      </div>
    </motion.div>
  );
} 