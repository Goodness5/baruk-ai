"use client"
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol, getProtocolTokens } from '../lib/seiProtocols';
import { useContractInteraction } from '../lib/contracts';
import TokenSelector from '../components/TokenSelector';
import toast from 'react-hot-toast';

const DEFAULT_PROTOCOL_ID = 'baruk';

const orders = [
  { id: 1, pair: 'ETH/USDC', type: 'Buy', price: '1800', amount: '1.2', status: 'Open' },
  { id: 2, pair: 'ETH/DAI', type: 'Sell', price: '1850', amount: '0.5', status: 'Filled' },
];

export default function LimitOrdersPage() {
  const address = useAppStore(s => s.address);
  const balances = useAppStore(s => s.balances);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const [protocolId, setProtocolId] = useState<string>(DEFAULT_PROTOCOL_ID);
  const protocol = getSeiProtocolById(protocolId) as SeiProtocol;
  const protocolTokens = getProtocolTokens(protocolId);
  const [tokenIn, setTokenIn] = useState(protocolTokens[0]?.address || '');
  const [tokenOut, setTokenOut] = useState(protocolTokens[1]?.address || '');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { executeContract, isConnected } = useContractInteraction();

  const balanceIn = balances.find(b => b.token === tokenIn)?.amount || '0';
  const balanceOut = balances.find(b => b.token === tokenOut)?.amount || '0';
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

  const handlePlaceOrder = async () => {
    if (!address || !amount || !price || loading || !isConnected) return;
    setLoading(true);
    toast.loading('Placing limit order...', { id: 'limit-order' });
    try {
      await executeContract(
        protocol.type,
        'limitOrder',
        'placeOrder',
        [tokenIn, tokenOut, BigInt(amount), BigInt(price)],
        { account: address }
      );
      toast.success('Limit order placed!', { id: 'limit-order' });
    } catch (err: any) {
      toast.error('Order failed: ' + (err?.message || err), { id: 'limit-order' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 rounded-2xl bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] shadow-xl space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-white">Limit Orders</h1>
        <div className="ml-auto">
          <select
            className="bg-[#1e2e2e] border border-purple-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
            value={protocolId}
            onChange={e => setProtocolId(e.target.value)}
          >
            {SEI_PROTOCOLS.filter(p => p.services.includes('limitOrder')).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
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
              {formatBalance(balanceIn)}
            </div>
            {priceIn && (
              <div className="text-green-400 text-sm">
                ${getUSDValue(balanceIn, priceIn)}
              </div>
            )}
            <div className="text-purple-400 text-xs mt-1">
              {tokenPricesLoading ? 'Loading price...' : priceIn ? `$${priceIn.toFixed(4)}` : 'No price'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-purple-300 text-sm">Token Out</div>
            <div className="text-white font-bold text-lg">
              {formatBalance(balanceOut)}
            </div>
            {priceOut && (
              <div className="text-green-400 text-sm">
                ${getUSDValue(balanceOut, priceOut)}
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
        <input
          className="w-full bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-green-700 focus:outline-none"
          placeholder="Price"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
        <button
          className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white font-bold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handlePlaceOrder}
          disabled={!address || !amount || !price || loading || !isConnected}
        >
          {loading && <span className="loader border-2 border-t-2 border-purple-400 rounded-full w-5 h-5 animate-spin"></span>}
          {loading ? 'Placing...' : 'Place Order'}
        </button>
      </div>
      <div className="bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 rounded-xl p-6 shadow-lg">
        <div className="text-purple-200 mb-2 font-semibold">Open/Recent Orders</div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-purple-300">
              <th>Pair</th>
              <th>Type</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="text-white border-b border-purple-900/30">
                <td>{order.pair}</td>
                <td>{order.type}</td>
                <td>{order.price}</td>
                <td>{order.amount}</td>
                <td>{order.status}</td>
                <td>{order.status === 'Open' && <button className="text-red-400 hover:underline">Cancel</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] rounded-xl p-6 shadow-lg">
        <div className="text-purple-200 mb-2 font-semibold">Order Book (Mock)</div>
        <div className="h-32 flex items-center justify-center text-purple-400">Order book visualization coming soon...</div>
      </div>
    </div>
  );
} 