import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import lendingAbi from '../../abi/BarukLending.json';
import { custom, createWalletClient, getContract } from 'viem';

const lendingAddress = '0x5197d95B4336f1EF6dd0fd62180101021A88E27b';

const assets = [
  { symbol: 'ETH', supplyApy: '3.2%', borrowApy: '5.1%', supplied: '1.2', borrowed: '0.0', address: '0x8923889697C9467548ABe8E815105993EBC785b6' },
  { symbol: 'USDC', supplyApy: '2.8%', borrowApy: '4.7%', supplied: '500', borrowed: '100', address: '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7' },
  { symbol: 'DAI', supplyApy: '2.5%', borrowApy: '4.2%', supplied: '0', borrowed: '0', address: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7' },
];

export default function LendingPage() {
  const address = useAppStore(s => s.address);
  const [selected, setSelected] = useState(assets[0].symbol);
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const asset = assets.find(a => a.symbol === selected)!;

  const handleSupply = async () => {
    if (!address || !window.ethereum || !supplyAmount || loading) return;
    setLoading(true);
    toast.loading('Supplying asset...', { id: 'supply' });
    try {
      const walletClient = createWalletClient({
        transport: custom(window.ethereum)
      });
      const contract = getContract({
        address: lendingAddress,
        abi: lendingAbi,
        client: walletClient
      });
      // Example args: [assetAddress, amount, recipient]
      const tx = await contract.write.depositAndBorrow([
        asset.address,
        BigInt(supplyAmount),
        address
      ], { account: address });
      toast.success('Supply submitted!', { id: 'supply' });
    } catch (err: any) {
      toast.error('Supply failed: ' + (err?.message || err), { id: 'supply' });
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!address || !window.ethereum || !borrowAmount || loading) return;
    setLoading(true);
    toast.loading('Borrowing asset...', { id: 'borrow' });
    try {
      const walletClient = createWalletClient({
        transport: custom(window.ethereum)
      });
      const contract = getContract({
        address: lendingAddress,
        abi: lendingAbi,
        client: walletClient
      });
      // Example args: [assetAddress, amount, recipient]
      const tx = await contract.write.depositAndBorrow([
        asset.address,
        BigInt(borrowAmount),
        address
      ], { account: address });
      toast.success('Borrow submitted!', { id: 'borrow' });
    } catch (err: any) {
      toast.error('Borrow failed: ' + (err?.message || err), { id: 'borrow' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 rounded-2xl bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] shadow-xl space-y-8">
      <h1 className="text-2xl font-bold text-white mb-4">Lending & Borrowing</h1>
      <div className="flex gap-4 mb-6">
        {assets.map(a => (
          <button key={a.symbol} onClick={() => setSelected(a.symbol)} className={`px-4 py-2 rounded-lg font-bold ${selected === a.symbol ? 'bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white' : 'bg-[#2d193c] text-purple-200'}`}>{a.symbol}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl p-5 bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 shadow-lg">
          <div className="text-sm text-purple-200 mb-1">Supply APY</div>
          <div className="text-2xl font-bold text-white">{asset.supplyApy}</div>
        </div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 shadow-lg">
          <div className="text-sm text-purple-200 mb-1">Borrow APY</div>
          <div className="text-2xl font-bold text-white">{asset.borrowApy}</div>
        </div>
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
          disabled={!address || !supplyAmount || loading}
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
          disabled={!address || !borrowAmount || loading}
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
            <span className="text-white font-bold">{asset.supplied} {selected}</span>
          </div>
          <div className="flex justify-between text-purple-200">
            <span>Borrowed</span>
            <span className="text-white font-bold">{asset.borrowed} {selected}</span>
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