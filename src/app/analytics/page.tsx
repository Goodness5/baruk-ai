"use client";

import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const stats = [
  { label: 'Magic Locked', value: '$2,340,000' },
  { label: 'Magic Flow (24h)', value: '$320,000' },
  { label: 'Magic Fees (24h)', value: '$4,200' },
  { label: 'Wizards', value: '1,120' },
];

const tvlData = [
  { date: 'Apr 1', tvl: 2000000 },
  { date: 'Apr 8', tvl: 2100000 },
  { date: 'Apr 15', tvl: 2200000 },
  { date: 'Apr 22', tvl: 2300000 },
  { date: 'Apr 29', tvl: 2340000 },
];

const volumeData = [
  { date: 'Apr 1', volume: 120000 },
  { date: 'Apr 8', volume: 180000 },
  { date: 'Apr 15', volume: 250000 },
  { date: 'Apr 22', volume: 300000 },
  { date: 'Apr 29', volume: 320000 },
];

export default function InsightsPage() {
  return (
    <motion.div
      className="space-y-8 max-w-4xl mx-auto mt-10"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* AI Agent Tip */}
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="h-7 w-7 neon-text animate-pulse" />
        <div className="text-lg neon-text font-bold">AI Tip:</div>
        <div className="text-white/80 text-sm">See your magic grow! Here’s a look at your DeFi journey, simplified and visualized by your AI agent.</div>
      </div>
      <h1 className="text-2xl font-bold neon-text mb-4">Insights</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl p-5 hud-glass neon-border">
            <div className="text-sm neon-text mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="hud-glass neon-border rounded-xl p-6 shadow-lg">
          <div className="text-lg font-semibold mb-4 neon-text">Magic Locked Over Time</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tvlData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#22d3ee"/>
                <YAxis stroke="#a855f7"/>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563"/>
                <Tooltip contentStyle={{ background: '#0a0a0a', border: 'none', color: '#fff' }}/>
                <Area type="monotone" dataKey="tvl" stroke="#22d3ee" fillOpacity={1} fill="url(#colorTvl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="hud-glass neon-border rounded-xl p-6 shadow-lg">
          <div className="text-lg font-semibold mb-4 neon-text">Magic Flow Over Time</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#22d3ee"/>
                <YAxis stroke="#a855f7"/>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563"/>
                <Tooltip contentStyle={{ background: '#0a0a0a', border: 'none', color: '#fff' }}/>
                <Area type="monotone" dataKey="volume" stroke="#22d3ee" fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 