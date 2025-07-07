import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const stats = [
  { label: 'TVL', value: '$2,340,000' },
  { label: 'Volume (24h)', value: '$320,000' },
  { label: 'Fees (24h)', value: '$4,200' },
  { label: 'Users', value: '1,120' },
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

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold text-white mb-4">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl p-5 bg-gradient-to-br from-purple-800/80 via-purple-700/60 to-green-700/40 shadow-lg">
            <div className="text-sm text-purple-200 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] rounded-xl p-6 shadow-lg">
          <div className="text-lg font-semibold mb-4 text-purple-200">TVL Over Time</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tvlData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
        <div className="bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] rounded-xl p-6 shadow-lg">
          <div className="text-lg font-semibold mb-4 text-purple-200">Volume Over Time</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#a78bfa"/>
                <YAxis stroke="#a78bfa"/>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563"/>
                <Tooltip contentStyle={{ background: '#2d193c', border: 'none', color: '#fff' }}/>
                <Area type="monotone" dataKey="volume" stroke="#a855f7" fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 