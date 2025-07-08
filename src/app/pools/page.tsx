"use client"
import { useAppStore } from '../store/useAppStore';
import { useState } from 'react';
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
    <div className="max-w-3xl mx-auto mt-10 space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-white">Farming Pools</h1>
        <div className="ml-auto">
          <select
            className="bg-[#1e2e2e] border border-purple-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
            value={protocolId}
            onChange={e => setProtocolId(e.target.value)}
          >
            {SEI_PROTOCOLS.filter(p => p.services.includes('farm')).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="text-purple-300 text-sm mb-2">Selected Protocol: <span className="font-bold">{protocol?.name}</span></div>
      <div className="grid md:grid-cols-2 gap-6">
        {pools.map((pool) => (
          <div key={pool.name} className="rounded-2xl p-6 bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-semibold text-purple-200">{pool.name}</div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex gap-2 text-xs text-purple-200">
                {pool.tokens.map(addr => (
                  <span key={addr} className="flex-1">
                    {getSymbol(addr)}: {tokenPricesLoading ? 'Loading...' : tokenPricesError ? <span className="text-red-400">{tokenPricesError}</span> : getPrice(addr) ? `$${getPrice(addr).toFixed(4)}` : 'No price'}
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-purple-200">
                <span>Your Stake</span>
                <span className="text-white font-bold">{pool.yourStake}</span>
              </div>
              <div className="flex justify-between text-purple-200">
                <span>Rewards</span>
                <span className="text-white font-bold">{pool.rewards}</span>
              </div>
            </div>
            <button className="mt-6 w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white font-bold shadow-lg hover:opacity-90 transition">Stake / Unstake</button>
          </div>
        ))}
      </div>
    </div>
  );
} 