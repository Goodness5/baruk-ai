"use client"
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import lendingAbi from '../../abi/BarukLending.json';
import { custom, createWalletClient, getContract } from 'viem';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol } from '../lib/seiProtocols';
import { useContractInteraction } from '../lib/contracts';

const DEFAULT_PROTOCOL_ID = 'baruk';

const assets = [
  { symbol: 'TOKEN0', address: '0x8923889697C9467548ABe8E815105993EBC785b6' },
  { symbol: 'TOKEN1', address: '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7' },
  { symbol: 'TOKEN2', address: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7' },
];

export default function LendingPage() {
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
    toast.loading('Supplying asset...', { id: 'supply' });
    try {
      await executeContract(
        protocol.type,
        'lending',
        'depositAndBorrow',
        [asset.address, BigInt(supplyAmount), address],
        { account: address }
      );
      toast.success('Supply submitted!', { id: 'supply' });
    } catch (err: any) {
      toast.error('Supply failed: ' + (err?.message || err), { id: 'supply' });
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!address || !borrowAmount || loading || !isConnected) return;
    setLoading(true);
    toast.loading('Borrowing asset...', { id: 'borrow' });
    try {
      await executeContract(
        protocol.type,
        'lending',
        'depositAndBorrow',
        [asset.address, BigInt(borrowAmount), address],
        { account: address }
      );
      toast.success('Borrow submitted!', { id: 'borrow' });
    } catch (err: any) {
      toast.error('Borrow failed: ' + (err?.message || err), { id: 'borrow' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 rounded-2xl bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] shadow-xl space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-white">Lending & Borrowing</h1>
        <div className="ml-auto">
          <select
            className="bg-[#1e2e2e] border border-purple-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
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
      <div className="bg-gradient-to-br from-purple-800/40 via-blue-800/40 to-green-800/40 rounded-lg p-4 border border-purple-700/30">
        <div className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>💰</span>
          {selected} Balance
        </div>
        <div className="text-center">
          <div className="text-purple-300 text-sm">Available to Supply</div>
          <div className="text-white font-bold text-2xl">
            {formatBalance(balance)}
          </div>
          {price && (
            <div className="text-green-400 text-lg">
              ${getUSDValue(balance, price)}
            </div>
          )}
          <div className="text-purple-400 text-xs mt-1">
            {tokenPricesLoading ? 'Loading price...' : price ? `$${price.toFixed(4)}` : 'No price'}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        {assets.map(a => (
          <button key={a.symbol} onClick={() => setSelected(a.symbol)} className={`px-4 py-2 rounded-lg font-bold ${selected === a.symbol ? 'bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white' : 'bg-[#2d193c] text-purple-200'}`}>{a.symbol}</button>
        ))}
      </div>
      <div className="flex gap-4 mt-6">
        <input
          className="flex-1 bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-purple-700 focus:outline-none"
          placeholder="Supply Amount"
          value={supplyAmount}
          onChange={e => setSupplyAmount(e.target.value)}
        />
        <button
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white font-bold shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleSupply}
          disabled={!address || !supplyAmount || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-purple-400 rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Supplying...' : 'Supply'}
        </button>
      </div>
      <div className="flex gap-4 mt-2">
        <input
          className="flex-1 bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-green-700 focus:outline-none"
          placeholder="Borrow Amount"
          value={borrowAmount}
          onChange={e => setBorrowAmount(e.target.value)}
        />
        <button
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 via-purple-600 to-purple-700 text-white font-bold shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleBorrow}
          disabled={!address || !borrowAmount || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-green-400 rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Borrowing...' : 'Borrow'}
        </button>
      </div>
      <div className="mt-8">
        <div className="text-purple-200 mb-2 font-semibold">Your Positions</div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 shadow-lg">
          <div className="flex justify-between text-purple-200 mb-1">
            <span>Supplied</span>
            <span className="text-white font-bold">{supplyAmount} {selected}</span>
          </div>
          <div className="flex justify-between text-purple-200">
            <span>Borrowed</span>
            <span className="text-white font-bold">{borrowAmount} {selected}</span>
          </div>
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