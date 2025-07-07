"use client";
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function ConnectWallet() {
  const address = useAppStore(s => s.address);
  const setAddress = useAppStore(s => s.setAddress);

  useEffect(() => {
    if (!window.ethereum) return;
    // Listen for account changes
    const handler = (accounts: string[]) => {
      setAddress(accounts[0] || null);
    };
    window.ethereum.on('accountsChanged', handler);
    // Set initial address
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      setAddress(accounts[0] || null);
    });
    return () => {
      window.ethereum.removeListener('accountsChanged', handler);
    };
  }, [setAddress]);

  const handleConnect = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0] || null);
    } else {
      alert('No Ethereum wallet found. Please install MetaMask.');
    }
  };

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
    </button>
  );
} 