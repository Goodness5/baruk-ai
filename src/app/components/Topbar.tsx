import ConnectWallet from './ConnectWallet';

export default function Topbar() {
  return (
    <header className="w-full flex items-center justify-between px-8 py-4 bg-black/60 border-b-2 border-gradient-to-r from-purple-500 via-green-400 to-purple-700 shadow-sm">
      <div className="text-xl font-semibold tracking-tight">Baruk DeFi</div>
      <ConnectWallet />
    </header>
  );
} 