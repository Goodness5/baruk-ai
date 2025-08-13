'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';
import { defineChain } from 'viem';

interface PrivyProviderProps {
  children: ReactNode;
}

// Define Sei Network testnet chain configuration
const seiTestnet = defineChain({
  id: 1328, // Correct Sei testnet EVM chain ID
  name: 'Sei Network Testnet',
  network: 'sei-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'SEI',
    symbol: 'SEI'
  },
  rpcUrls: {
    default: {
      http: ['https://evm-rpc-testnet.sei-apis.com'],
      webSocket: ['wss://evm-rpc-testnet.sei-apis.com']
    },
    public: {
      http: ['https://evm-rpc-testnet.sei-apis.com'],
      webSocket: ['wss://evm-rpc-testnet.sei-apis.com']
    }
  },
  blockExplorers: {
    default: {
      name: 'Sei Testnet Explorer',
      url: 'https://testnet.sei.io/explorer'
    }
  }
});

export default function PrivyProviderWrapper({ children }: PrivyProviderProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id'}
      config={{
        // Set Sei Network testnet as default and only supported chain
        defaultChain: seiTestnet,
        supportedChains: [seiTestnet],
        
        // Configure embedded wallets to be the primary option
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets'
          }
        },
        
        // Appearance configuration to make embedded wallets more prominent
        appearance: {
          theme: 'dark',
          accentColor: '#8b5cf6',
          showWalletLoginFirst: false // This will show email login first instead of wallet
        },
        
        // Login methods - prioritize email over external wallets
        loginMethods: ['email', 'wallet']
      }}
    >
      {children}
    </PrivyProvider>
  );
}
