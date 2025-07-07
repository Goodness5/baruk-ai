"use client";
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import routerAbi from '../../abi/BarukRouter.json';
import { custom, createWalletClient, getContract } from 'viem';

const routerAddress = '0xe605be74ba68fc255dB0156ab63c31b50b336D6B';

export default function SwapPage() {
  const tokens = useAppStore(s => s.tokens);
  const balances = useAppStore(s => s.balances);
  const balancesLoading = useAppStore(s => s.balancesLoading);
  const balancesError = useAppStore(s => s.balancesError);
  const address = useAppStore(s => s.address);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const tokenPricesError = useAppStore(s => s.tokenPricesError);
  const [tokenIn, setTokenIn] = useState(tokens[0].address);
  const [tokenOut, setTokenOut] = useState(tokens[1].address);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const tokenInBalance = balances.find(b => b.token === tokenIn)?.amount || '0';
  const priceIn = tokenPrices[tokenIn.toLowerCase()];
  const priceOut = tokenPrices[tokenOut.toLowerCase()];

  const handleSwap = async () => {
    if (!address || !window.ethereum || !amount || loading) return;
    setLoading(true);
    toast.loading('Submitting swap...', { id: 'swap' });
    try {
      const walletClient = createWalletClient({
        transport: custom(window.ethereum)
      });
      const contract = getContract({
        address: routerAddress,
        abi: routerAbi,
        client: walletClient
      });
      const minAmountOut = 0n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const recipient = address;
      const tx = await contract.write.swap([
        tokenIn,
        tokenOut,
        BigInt(amount),
        minAmountOut,
        deadline,
        recipient
      ], { account: address });
      toast.success('Swap submitted!', { id: 'swap' });
    } catch (err: any) {
      toast.error('Swap failed: ' + (err?.message || err), { id: 'swap' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 rounded-2xl bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] shadow-xl space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <ArrowsRightLeftIcon className="h-7 w-7 text-purple-400" />
        <h1 className="text-2xl font-bold text-white">Swap</h1>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <TokenSelector tokens={tokens} value={tokenIn} onChange={setTokenIn} className="flex-1" />
          <span className="text-purple-300 font-bold">→</span>
          <TokenSelector tokens={tokens} value={tokenOut} onChange={setTokenOut} className="flex-1 border-green-700" />
        </div>
        <div className="flex items-center justify-between text-purple-200 text-xs mt-1 mb-1">
          <span>Balance: {balancesLoading ? 'Loading...' : balancesError ? <span className="text-red-400">{balancesError}</span> : tokenInBalance}</span>
        </div>
        <div className="flex items-center justify-between text-purple-200 text-xs mb-1">
          <span>
            {tokenPricesLoading ? 'Loading price...' : tokenPricesError ? <span className="text-red-400">{tokenPricesError}</span> : priceIn ? `Price: $${priceIn.toFixed(4)}` : 'No price'}
          </span>
          <span>
            {tokenPricesLoading ? 'Loading price...' : tokenPricesError ? <span className="text-red-400">{tokenPricesError}</span> : priceOut ? `Price: $${priceOut.toFixed(4)}` : 'No price'}
          </span>
        </div>
        <input
          className="w-full bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-purple-700 focus:outline-none"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <button
          className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white font-bold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleSwap}
          disabled={!address || !amount || loading}
        >
          {loading && <span className="loader border-2 border-t-2 border-purple-400 rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Swapping...' : 'Swap'}
        </button>
      </div>
      <div className="mt-8">
        <div className="text-purple-200 mb-2 font-semibold">Price Chart</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#a78bfa"/>
              <YAxis stroke="#a78bfa"/>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563"/>
              <Tooltip contentStyle={{ background: '#2d193c', border: 'none', color: '#fff' }}/>
              <Area type="monotone" dataKey="price" stroke="#a855f7" fillOpacity={1} fill="url(#colorPrice)" />
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