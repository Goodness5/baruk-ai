import { createWalletClient, custom } from 'viem';

export function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No wallet');
  return createWalletClient({
    transport: custom(window.ethereum)
  });
} 