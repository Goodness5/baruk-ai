import ConnectWallet from './ConnectWallet';

export default function Topbar() {
  return (
    <header className="w-full flex items-center justify-between px-8 py-4 holo-surface border-b shadow-sm">
      <div className="text-xl font-semibold tracking-tight">Baruk DeFi</div>
      <ConnectWallet />
    </header>
  );
} 