"use client";
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import TokenSelector from '../components/TokenSelector';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import routerAbi from '../../abi/BarukRouter.json';
import { custom, createWalletClient, getContract } from 'viem';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { useContractInteraction } from '../lib/contracts';

const DEFAULT_PROTOCOL_ID = 'baruk';

export default function SwapPage() {
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

  const handleSwap = async () => {
    if (!address || !amount || loading || !isConnected) return;
    setLoading(true);
    toast.loading('Submitting swap...', { id: 'swap' });
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
        <div className="ml-auto">
          <select
            className="bg-[#1e2e2e] border border-purple-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
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
      <div className="bg-gradient-to-br from-purple-800/20 via-blue-800/20 to-green-800/20 rounded-lg p-3 border border-purple-700/20">
        <div className="text-purple-300 text-sm">
          <span className="font-semibold">Protocol:</span> {protocol.name} ({protocol.type})
        </div>
        <div className="text-purple-300 text-sm">
          <span className="font-semibold">Available Tokens:</span> {protocolTokens.map(t => t.symbol).join(', ')}
        </div>
      </div>

      {/* Real-time Balance Display */}
      <div className="bg-gradient-to-br from-purple-800/40 via-blue-800/40 to-green-800/40 rounded-lg p-4 border border-purple-700/30">
        <div className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>💰</span>
          Token Balances
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-purple-300 text-sm">Token In</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(tokenInBalance)}
            </div>
            {priceIn && (
              <div className="text-green-400 text-sm">
                ${getUSDValue(tokenInBalance, priceIn)}
              </div>
            )}
            <div className="text-purple-400 text-xs mt-1">
              {tokenPricesLoading ? 'Loading price...' : priceIn ? `$${priceIn.toFixed(4)}` : 'No price'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-purple-300 text-sm">Token Out</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(tokenOutBalance)}
            </div>
            {priceOut && (
              <div className="text-green-400 text-sm">
                ${getUSDValue(tokenOutBalance, priceOut)}
              </div>
            )}
            <div className="text-purple-400 text-xs mt-1">
              {tokenPricesLoading ? 'Loading price...' : priceOut ? `$${priceOut.toFixed(4)}` : 'No price'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <TokenSelector tokens={protocolTokens} value={tokenIn} onChange={setTokenIn} className="flex-1" />
          <span className="text-purple-300 font-bold">→</span>
          <TokenSelector tokens={protocolTokens} value={tokenOut} onChange={setTokenOut} className="flex-1 border-green-700" />
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
          disabled={!address || !amount || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-purple-400 rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Swapping...' : 'Swap'}
        </button>
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