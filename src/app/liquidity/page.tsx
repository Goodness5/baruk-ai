"use client"
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import routerAbi from '../../abi/BarukRouter.json';
import { custom, createWalletClient, getContract } from 'viem';

const poolStats = {
  tvl: '$1,200,000',
  volume: '$320,000',
  apy: '7.5%',
  yourShare: '0.23%'
};

const chartData = [
  { date: 'Apr 1', tvl: 1000000 },
  { date: 'Apr 8', tvl: 1100000 },
  { date: 'Apr 15', tvl: 1200000 },
  { date: 'Apr 22', tvl: 1150000 },
  { date: 'Apr 29', tvl: 1200000 },
];

const routerAddress = '0xe605be74ba68fc255dB0156ab63c31b50b336D6B';

export default function LiquidityPage() {
  const tokens = useAppStore(s => s.tokens);
  const balances = useAppStore(s => s.balances);
  const balancesLoading = useAppStore(s => s.balancesLoading);
  const balancesError = useAppStore(s => s.balancesError);
  const address = useAppStore(s => s.address);
  const [tokenA, setTokenA] = useState(tokens[0].address);
  const [tokenB, setTokenB] = useState(tokens[1].address);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [loading, setLoading] = useState(false);

  const balanceA = balances.find(b => b.token === tokenA)?.amount || '0';
  const balanceB = balances.find(b => b.token === tokenB)?.amount || '0';

  const handleAddLiquidity = async () => {
    if (!address || !window.ethereum || !amountA || !amountB || loading) return;
    setLoading(true);
    toast.loading('Submitting add liquidity...', { id: 'addliq' });
    try {
      const walletClient = createWalletClient({
        transport: custom(window.ethereum)
      });
      const contract = getContract({
        address: routerAddress,
        abi: routerAbi,
        client: walletClient
      });
      // Example args: [tokenA, tokenB, amountA, amountB, minA, minB, deadline, recipient]
      const minA = 0n;
      const minB = 0n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const recipient = address;
      const tx = await contract.write.addLiquidity([
        tokenA,
        tokenB,
        BigInt(amountA),
        BigInt(amountB),
        minA,
        minB,
        deadline,
        recipient
      ], { account: address });
      toast.success('Add liquidity submitted!', { id: 'addliq' });
    } catch (err: any) {
      toast.error('Add liquidity failed: ' + (err?.message || err), { id: 'addliq' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 rounded-2xl bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] shadow-xl space-y-8">
      <h1 className="text-2xl font-bold text-white mb-4">Add Liquidity</h1>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <TokenSelector tokens={tokens} value={tokenA} onChange={setTokenA} className="flex-1" />
          <span className="text-purple-300 font-bold">+</span>
          <TokenSelector tokens={tokens} value={tokenB} onChange={setTokenB} className="flex-1 border-green-700" />
        </div>
        <div className="flex gap-2 text-xs text-purple-200 mt-1 mb-1">
          <span className="flex-1">Balance: {balancesLoading ? 'Loading...' : balancesError ? <span className="text-red-400">{balancesError}</span> : balanceA}</span>
          <span className="flex-1">Balance: {balancesLoading ? 'Loading...' : balancesError ? <span className="text-red-400">{balancesError}</span> : balanceB}</span>
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
          className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white font-bold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleAddLiquidity}
          disabled={!address || !amountA || !amountB || loading}
        >
          {loading && <span className="loader border-2 border-t-2 border-purple-400 rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Adding...' : 'Add Liquidity'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="rounded-xl p-5 bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 shadow-lg">
          <div className="text-sm text-purple-200 mb-1">TVL</div>
          <div className="text-2xl font-bold text-white">{poolStats.tvl}</div>
        </div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 shadow-lg">
          <div className="text-sm text-purple-200 mb-1">Volume (24h)</div>
          <div className="text-2xl font-bold text-white">{poolStats.volume}</div>
        </div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 shadow-lg">
          <div className="text-sm text-purple-200 mb-1">APY</div>
          <div className="text-2xl font-bold text-white">{poolStats.apy}</div>
        </div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 shadow-lg">
          <div className="text-sm text-purple-200 mb-1">Your Share</div>
          <div className="text-2xl font-bold text-white">{poolStats.yourShare}</div>
        </div>
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