"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol } from '../lib/seiProtocols';
import { useContractInteraction } from '../lib/contracts';

const DEFAULT_PROTOCOL_ID = 'baruk';

const assets = [
  { symbol: 'TOKEN0', address: '0x8923889697C9467548ABe8E815105993EBC785b6' },
  { symbol: 'TOKEN1', address: '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7' },
  { symbol: 'TOKEN2', address: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7' },
];

export default function BorrowPage() {
  const address = useAppStore(s => s.address);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const tokenPricesError = useAppStore(s => s.tokenPricesError);
  const balances = useAppStore(s => s.balances);
  const balancesLoading = useAppStore(s => s.balancesLoading);
  const balancesError = useAppStore(s => s.balancesError);
  const [selected, setSelected] = useState(assets[0].symbol);
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [protocolId, setProtocolId] = useState<string>(DEFAULT_PROTOCOL_ID);
  const protocol = getSeiProtocolById(protocolId) as SeiProtocol;
  const { executeContract, isConnected } = useContractInteraction();

  const asset = assets.find(a => a.symbol === selected)!;
  const price = tokenPrices[asset.address.toLowerCase()];
  const balance = balances.find(b => b.token === asset.address)?.amount || '0';

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

  const handleSupply = async () => {
    if (!address || !supplyAmount || loading || !isConnected) return;
    setLoading(true);
    toast.loading('Storing your magic...', { id: 'supply' });
    try {
      await executeContract(
        protocol.type,
        'lending',
        'depositAndBorrow',
        [asset.address, BigInt(supplyAmount), address],
        { account: address }
      );
      toast.success('Magic stored! ✨', { id: 'supply' });
    } catch (err: any) {
      toast.error('Could not store: ' + (err?.message || err), { id: 'supply' });
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!address || !borrowAmount || loading || !isConnected) return;
    setLoading(true);
    toast.loading('Borrowing magic...', { id: 'borrow' });
    try {
      await executeContract(
        protocol.type,
        'lending',
        'depositAndBorrow',
        [asset.address, BigInt(borrowAmount), address],
        { account: address }
      );
      toast.success('Magic borrowed! 🪄', { id: 'borrow' });
    } catch (err: any) {
      toast.error('Could not borrow: ' + (err?.message || err), { id: 'borrow' });
    } finally {
      setLoading(false);
    }
  };

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
        <div className="text-white/80 text-sm">Supply tokens to your vault, or borrow more with a tap. I’ll keep your magic safe and simple!</div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold neon-text">Borrow</h1>
        <div className="ml-auto">
          <select
            className="bg-black/40 border border-neon-cyan text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
            value={protocolId}
            onChange={e => setProtocolId(e.target.value)}
          >
            {SEI_PROTOCOLS.filter(p => p.services.includes('lending')).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Real-time Balance Display */}
      <div className="bg-black/40 rounded-lg p-4 border border-neon-cyan/20">
        <div className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>💰</span>
          My Magic Vault ({selected})
        </div>
        <div className="text-center">
          <div className="text-neon-cyan text-sm">Available to Store</div>
          <div className="text-white font-bold text-2xl">
            {formatBalance(balance)}
          </div>
          {price && (
            <div className="text-neon-green text-lg">
              ${getUSDValue(balance, price)}
            </div>
          )}
          <div className="text-neon-cyan text-xs mt-1">
            {tokenPricesLoading ? 'Loading...' : price ? `$${price.toFixed(4)}` : 'No price'}
          </div>
        </div>
      </div>
      <div className="flex gap-4 mb-6">
        {assets.map(a => (
          <button key={a.symbol} onClick={() => setSelected(a.symbol)} className={`px-4 py-2 rounded-lg font-bold ${selected === a.symbol ? 'bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple neon-text' : 'bg-black/40 text-neon-cyan/60'}`}>{a.symbol}</button>
        ))}
      </div>
      <div className="flex gap-4 mt-6">
        <input
          className="flex-1 bg-black/40 text-white rounded-lg px-4 py-2 border border-neon-cyan focus:outline-none"
          placeholder="Store Amount"
          value={supplyAmount}
          onChange={e => setSupplyAmount(e.target.value)}
        />
        <button
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple neon-text font-bold shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleSupply}
          disabled={!address || !supplyAmount || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-neon-cyan rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Storing...' : 'Store'}
        </button>
      </div>
      <div className="flex gap-4 mt-2">
        <input
          className="flex-1 bg-black/40 text-white rounded-lg px-4 py-2 border border-neon-green focus:outline-none"
          placeholder="Borrow Amount"
          value={borrowAmount}
          onChange={e => setBorrowAmount(e.target.value)}
        />
        <button
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple neon-text font-bold shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleBorrow}
          disabled={!address || !borrowAmount || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-neon-green rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Borrowing...' : 'Borrow'}
        </button>
      </div>
      <div className="mt-8">
        <div className="neon-text mb-2 font-semibold">Your Magic Positions</div>
        <div className="rounded-xl p-5 hud-glass neon-border">
          <div className="flex justify-between neon-text mb-1">
            <span>Stored</span>
            <span className="text-white font-bold">{supplyAmount} {selected}</span>
          </div>
          <div className="flex justify-between neon-text">
            <span>Borrowed</span>
            <span className="text-white font-bold">{borrowAmount} {selected}</span>
          </div>
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