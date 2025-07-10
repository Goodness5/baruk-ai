import { HomeIcon, ArrowsRightLeftIcon, BeakerIcon, BanknotesIcon, ClipboardDocumentListIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const nav = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Swap', href: '/swap', icon: ArrowsRightLeftIcon },
  { name: 'Liquidity', href: '/liquidity', icon: BeakerIcon },
  { name: 'Pools', href: '/pools', icon: BanknotesIcon },
  { name: 'Lending', href: '/lending', icon: ClipboardDocumentListIcon },
  { name: 'Limit Orders', href: '/limit-orders', icon: ClipboardDocumentListIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 holo-surface p-6 space-y-4 shadow-lg">
      <div className="text-2xl font-bold mb-8 tracking-tight bg-gradient-to-r from-green-400 via-purple-400 to-purple-700 bg-clip-text text-transparent">Baruk DeFi</div>
      <nav className="flex flex-col gap-2">
        {nav.map(({ name, href, icon: Icon }) => (
          <Link key={name} href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-700 hover:to-green-500 transition-colors">
            <Icon className="h-5 w-5" />
            <span className="font-medium">{name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
} 