"use client"
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAppStore } from '../store/useAppStore';

const stats = [
  { label: 'Total Value Locked', value: '$2,340,000' },
  { label: 'Portfolio Value', value: '$12,500' },
  { label: 'APY', value: '8.2%' },
  { label: 'Open Positions', value: '5' },
];

const data = [
  { date: 'Apr 1', value: 11000 },
  { date: 'Apr 8', value: 11500 },
  { date: 'Apr 15', value: 12000 },
  { date: 'Apr 22', value: 12500 },
  { date: 'Apr 29', value: 12400 },
  { date: 'May 6', value: 12700 },
];

export default function DashboardPage() {
  const tokens = useAppStore(s => s.tokens);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const tokenPricesError = useAppStore(s => s.tokenPricesError);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {tokens.map((token) => (
          <div key={token.address} className="rounded-xl p-5 bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 shadow-lg">
            <div className="text-sm text-purple-200 mb-1">{token.symbol} Price</div>
            <div className="text-2xl font-bold text-white">
              {tokenPricesLoading ? 'Loading...' : tokenPricesError ? <span className="text-red-400">{tokenPricesError}</span> : tokenPrices[token.address.toLowerCase()] ? `$${tokenPrices[token.address.toLowerCase()].toFixed(4)}` : 'No price'}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] rounded-xl p-6 shadow-lg">
        <div className="text-lg font-semibold mb-4 text-purple-200">Portfolio Value Over Time</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#a78bfa"/>
              <YAxis stroke="#a78bfa"/>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563"/>
              <Tooltip contentStyle={{ background: '#2d193c', border: 'none', color: '#fff' }}/>
              <Area type="monotone" dataKey="value" stroke="#a855f7" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 