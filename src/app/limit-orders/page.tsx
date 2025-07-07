import { useState } from 'react';

const orders = [
  { id: 1, pair: 'ETH/USDC', type: 'Buy', price: '1800', amount: '1.2', status: 'Open' },
  { id: 2, pair: 'ETH/DAI', type: 'Sell', price: '1850', amount: '0.5', status: 'Filled' },
];

export default function LimitOrdersPage() {
  const [pair, setPair] = useState('ETH/USDC');
  const [type, setType] = useState('Buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 rounded-2xl bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] shadow-xl space-y-8">
      <h1 className="text-2xl font-bold text-white mb-4">Limit Orders</h1>
      <form className="flex gap-4 mb-6">
        <select value={pair} onChange={e => setPair(e.target.value)} className="flex-1 bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-purple-700 focus:outline-none">
          <option>ETH/USDC</option>
          <option>ETH/DAI</option>
          <option>USDC/DAI</option>
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className="flex-1 bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-green-700 focus:outline-none">
          <option>Buy</option>
          <option>Sell</option>
        </select>
        <input
          className="flex-1 bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-purple-700 focus:outline-none"
          placeholder="Price"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
        <input
          className="flex-1 bg-[#2d193c] text-white rounded-lg px-4 py-2 border border-green-700 focus:outline-none"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <button type="submit" className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white font-bold shadow-lg hover:opacity-90 transition">Place Order</button>
      </form>
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