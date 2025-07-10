"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { useContractInteraction } from '../lib/contracts';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DEFAULT_PROTOCOL_ID = 'baruk';

export default function GrowPage() {
  const balances = useAppStore(s => s.balances);
  const address = useAppStore(s => s.address);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const [protocolId, setProtocolId] = useState<string>(DEFAULT_PROTOCOL_ID);
  const protocol = getSeiProtocolById(protocolId) as SeiProtocol;
  const protocolTokens = getProtocolTokens(protocolId);
  const [tokenA, setTokenA] = useState(protocolTokens[0]?.address || '');
  const [tokenB, setTokenB] = useState(protocolTokens[1]?.address || '');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [loading, setLoading] = useState(false);
  const { executeContract, isConnected } = useContractInteraction();

  const balanceA = balances.find(b => b.token === tokenA)?.amount || '0';
  const balanceB = balances.find(b => b.token === tokenB)?.amount || '0';
  const priceA = tokenPrices[tokenA.toLowerCase()];
  const priceB = tokenPrices[tokenB.toLowerCase()];

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

  const handleGrow = async () => {
    if (!address || !amountA || !amountB || loading || !isConnected) return;
    setLoading(true);
    toast.loading('Planting your magic seeds...', { id: 'grow' });
    try {
      const minA = 0n;
      const minB = 0n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const recipient = address as `0x${string}`;
      await executeContract(
        protocol.type,
        'router',
        'addLiquidity',
        [tokenA, tokenB, BigInt(amountA), BigInt(amountB), minA, minB, deadline, recipient],
        { account: recipient }
      );
      toast.success('Your garden is growing! 🌱', { id: 'grow' });
    } catch (err: unknown) {
      let msg = 'Unknown error';
      if (typeof err === 'object' && err !== null && 'message' in err) {
        msg = (err as { message?: string }).message || msg;
      } else if (typeof err === 'string') {
        msg = err;
      }
      toast.error('Could not grow: ' + msg, { id: 'grow' });
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { date: '2024-07-01', tvl: 10000 },
    { date: '2024-07-02', tvl: 12000 },
    { date: '2024-07-03', tvl: 15000 },
    { date: '2024-07-04', tvl: 13000 },
    { date: '2024-07-05', tvl: 17000 },
  ];

  return (
    <motion.div
      className="max-w-2xl mx-auto mt-10 p-8 rounded-2xl hud-glass neon-border shadow-xl space-y-8"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* AI Agent Tip */}
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="h-7 w-7 neon-text animate-pulse" />
        <div className="text-lg neon-text font-bold">AI Tip:</div>
        <div className="text-white/80 text-sm">Pick two tokens, enter amounts, and tap <b>Grow</b>. I’ll plant your magic seeds and help you earn yield!</div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold neon-text">Grow</h1>
        <div className="ml-auto">
          <select
            className="bg-black/40 border border-neon-cyan text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
            value={protocolId}
            onChange={e => setProtocolId(e.target.value)}
          >
            {SEI_PROTOCOLS.filter(p => p.services.includes('liquidity')).map(p => (
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
            <div className="text-neon-cyan text-sm">Seed A</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(balanceA)}
            </div>
            {priceA && (
              <div className="text-neon-green text-sm">
                ${getUSDValue(balanceA, priceA)}
              </div>
            )}
            <div className="text-neon-cyan text-xs mt-1">
              {tokenPricesLoading ? 'Loading...' : priceA ? `$${priceA.toFixed(4)}` : 'No price'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-neon-cyan text-sm">Seed B</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(balanceB)}
            </div>
            {priceB && (
              <div className="text-neon-green text-sm">
                ${getUSDValue(balanceB, priceB)}
              </div>
            )}
            <div className="text-neon-cyan text-xs mt-1">
              {tokenPricesLoading ? 'Loading...' : priceB ? `$${priceB.toFixed(4)}` : 'No price'}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <TokenSelector tokens={protocolTokens} value={tokenA} onChange={setTokenA} className="flex-1" />
          <span className="neon-text font-bold">+</span>
          <TokenSelector tokens={protocolTokens} value={tokenB} onChange={setTokenB} className="flex-1" />
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-black/40 text-white rounded-lg px-4 py-2 border border-neon-cyan focus:outline-none"
            placeholder="Amount A"
            value={amountA}
            onChange={e => setAmountA(e.target.value)}
          />
          <input
            className="flex-1 bg-black/40 text-white rounded-lg px-4 py-2 border border-neon-green focus:outline-none"
            placeholder="Amount B"
            value={amountB}
            onChange={e => setAmountB(e.target.value)}
          />
        </div>
        <button
          className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple neon-text font-bold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleGrow}
          disabled={!address || !amountA || !amountB || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-neon-cyan rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Growing...' : 'Grow'}
        </button>
      </div>
      <div className="mt-8">
        <div className="neon-text mb-2 font-semibold">Garden Growth Over Time</div>
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