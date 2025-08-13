import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected } from '@wagmi/connectors';

// Define Sei Network testnet
const seiTestnet = {
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
      http: ['https://evm-rpc-testnet.sei-apis.com']
    },
    public: {
      http: ['https://evm-rpc-testnet.sei-apis.com']
    }
  },
  blockExplorers: {
    default: {
      name: 'Sei Testnet Explorer',
      url: 'https://testnet.sei.io/explorer'
    }
  }
} as const;

export const config = createConfig({
  chains: [seiTestnet, mainnet],
  connectors: [
    // Only keep injected for Privy compatibility
    injected()
  ],
  transports: {
    [seiTestnet.id]: http('https://evm-rpc-testnet.sei-apis.com'),
    [mainnet.id]: http()
  },
  ssr: true,
});