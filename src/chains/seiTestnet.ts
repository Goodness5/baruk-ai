import { Chain } from 'wagmi/chains';

export const seiTestnet: Chain = {
  id: 1328,
  name: 'Sei Testnet',
  nativeCurrency: {
    name: 'Sei',
    symbol: 'SEI',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://evm-rpc-testnet.sei-apis.com'],
      webSocket: [],
    },
    public: {
      http: ['https://evm-rpc-testnet.sei-apis.com'],
      webSocket: [],
    },
  },
  blockExplorers: {
    default: { name: 'Sei Explorer', url: 'https://atlantic2-explorer.sei.io' },
    etherscan: { name: 'Sei Explorer', url: 'https://atlantic2-explorer.sei.io' },
    internal: { name: 'Sei Explorer', url: 'https://atlantic2-explorer.sei.io' },
  },
  testnet: true,
}; 