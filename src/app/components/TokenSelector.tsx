
"use client";

type Asset = { 
  symbol: string; 
  address: string; 
  name?: string;
};

type AssetSelectorProps = {
  tokens: Asset[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export default function AssetSelector({ tokens, value, onChange, className = '' }: AssetSelectorProps) {
  const assetEmojis: Record<string, string> = {
    'SEI': '🌟',
    'TOKEN0': '🏆',
    'TOKEN1': '💎',
    'TOKEN2': '⚡',
  };

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-white rounded-xl px-4 py-3 border border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold transition-all hover:from-purple-500/50 hover:to-blue-500/50 ${className}`}
    >
      {tokens.map(asset => (
        <option key={asset.address} value={asset.symbol} className="bg-gray-800 text-white">
          {assetEmojis[asset.symbol] || '💰'} {asset.name || asset.symbol}
        </option>
      ))}
    </select>
  );
}
