type Token = { symbol: string; address: string };

type TokenSelectorProps = {
  tokens: Token[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export default function TokenSelector({ tokens, value, onChange, className = '' }: TokenSelectorProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`glass-card text-white px-4 py-2 focus:outline-none ${className}`}
    >
      {tokens.map(t => (
        <option key={t.address} value={t.address}>{t.symbol}</option>
      ))}
    </select>
  );
} 