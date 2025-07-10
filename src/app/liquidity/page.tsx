"use client"
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import routerAbi from '../../abi/BarukRouter.json';
import { custom, createWalletClient, getContract } from 'viem';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { useContractInteraction } from '../lib/contracts';

const routerAddress = '0xe605be74ba68fc255dB0156ab63c31b50b336D6B';
const DEFAULT_PROTOCOL_ID = 'baruk';

export default function LiquidityPage() {
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

  const handleAddLiquidity = async () => {
    if (!address || !amountA || !amountB || loading || !isConnected) return;
    setLoading(true);
    toast.loading('Submitting add liquidity...', { id: 'addliq' });
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
      
      toast.success('Add liquidity submitted!', { id: 'addliq' });
    } catch (err: any) {
      toast.error('Add liquidity failed: ' + (err?.message || err), { id: 'addliq' });
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
    <div className="max-w-2xl mx-auto mt-10 p-8 glass-card rounded-2xl space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold neon-glow">Fill Juice-Pool</h1>
        <div className="ml-auto">
          <select
            className="bg-[#1e2e2e] border border-purple-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
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
      <div className="bg-gradient-to-br from-purple-800/40 via-blue-800/40 to-green-800/40 rounded-lg p-4 border border-purple-700/30">
        <div className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>💰</span>
          Coin Balances
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-purple-300 text-sm">Coin A</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(balanceA)}
            </div>
            {priceA && (
              <div className="text-green-400 text-sm">
                ${getUSDValue(balanceA, priceA)}
              </div>
            )}
            <div className="text-purple-400 text-xs mt-1">
              {tokenPricesLoading ? 'Loading price...' : priceA ? `$${priceA.toFixed(4)}` : 'No price'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-purple-300 text-sm">Coin B</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(balanceB)}
            </div>
            {priceB && (
              <div className="text-green-400 text-sm">
                ${getUSDValue(balanceB, priceB)}
              </div>
            )}
            <div className="text-purple-400 text-xs mt-1">
              {tokenPricesLoading ? 'Loading price...' : priceB ? `$${priceB.toFixed(4)}` : 'No price'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <TokenSelector tokens={protocolTokens} value={tokenA} onChange={setTokenA} className="flex-1" />
          <span className="text-purple-300 font-bold">+</span>
          <TokenSelector tokens={protocolTokens} value={tokenB} onChange={setTokenB} className="flex-1 border-green-700" />
        </div>
        
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-purple-700 focus:outline-none"
            placeholder="Amount A"
            value={amountA}
            onChange={e => setAmountA(e.target.value)}
          />
          <input
            className="flex-1 bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-green-700 focus:outline-none"
            placeholder="Amount B"
            value={amountB}
            onChange={e => setAmountB(e.target.value)}
          />
        </div>
        <button
          className="w-full py-3 mt-2 glass-card neon-glow text-white font-bold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleAddLiquidity}
          disabled={!address || !amountA || !amountB || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-purple-400 rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Filling...' : 'Fill Juice-Pool'}
        </button>
      </div>
      <div className="mt-8">
        <div className="text-purple-200 mb-2 font-semibold">Pool TVL Over Time</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#a78bfa"/>
              <YAxis stroke="#a78bfa"/>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563"/>
              <Tooltip contentStyle={{ background: '#2d193c', border: 'none', color: '#fff' }}/>
              <Area type="monotone" dataKey="tvl" stroke="#a855f7" fillOpacity={1} fill="url(#colorTvl)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <style jsx>{`
        .loader {
          border-top-color: #a855f7;
          border-right-color: #22d3ee;
          border-bottom-color: #a855f7;
          border-left-color: transparent;
        }
      `}</style>
    </div>
  );
} 