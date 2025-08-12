'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Topbar() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const router = useRouter();
  
  // Get user's wallet address from Privy - handle both string and object cases
  let walletAddress: string | null = null;
  
  if (user?.wallet?.address) {
    // Handle case where address might be an object
    if (typeof user.wallet.address === 'string') {
      walletAddress = user.wallet.address;
    } else if (typeof user.wallet.address === 'object' && user.wallet.address !== null) {
      // If it's an object, try to extract the address string
      walletAddress = (user.wallet.address as { address?: string }).address || null;
    }
  }
  
  // Debug: Log user object to see structure
  console.log('Topbar - Privy user object:', user);
  console.log('Topbar - User email:', user?.email);
  console.log('Topbar - User email type:', typeof user?.email);
  console.log('Topbar - User keys:', user ? Object.keys(user) : 'No user');
  console.log('Topbar - Wallet address:', walletAddress);

  // Redirect to dashboard after successful authentication
  useEffect(() => {
    if (authenticated && ready) {
      // Small delay to ensure wallet is ready
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [authenticated, ready, router]);

  if (!ready) {
    return (
      <header className="w-full flex items-center justify-between px-8 py-4 bg-black/60 border-b-2 border-gradient-to-r from-purple-500 via-green-400 to-purple-700 shadow-sm">
        <div className="text-xl font-semibold tracking-tight">Baruk DeFi</div>
        <div className="text-gray-400">Loading...</div>
      </header>
    );
  }

  return (
    <header className="w-full flex items-center justify-between px-8 py-4 bg-black/60 border-b-2 border-gradient-to-r from-purple-500 via-green-400 to-purple-700 shadow-sm">
      <div className="text-xl font-semibold tracking-tight">Baruk DeFi</div>
      
      {authenticated ? (
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-300">
            {user?.email?.address ? `Howdy, ${user.email.address}` : 'Howdy, User'}
          </div>
          <div className="text-xs text-gray-500">
            {walletAddress ? (
              `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            ) : (
              'Wallet Loading...'
            )}
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={login}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Sign In
        </button>
      )}
    </header>
  );
} 