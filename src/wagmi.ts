import { http, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';
import { seiTestnet } from './chains/seiTestnet';
import { injected } from 'wagmi/connectors';
import { metaMask } from '@wagmi/connectors'

export const config = createConfig({
  chains: [seiTestnet, mainnet, polygon, arbitrum, optimism],
  connectors: [
    injected(),
    
    metaMask({
      dappMetadata: {
        name: 'Baruk AI',
        url: 'https://baruk.ai',
        iconUrl: 'https://baruk.ai/favicon.ico',
      },
    }),
  ],
  transports: {
    [seiTestnet.id]: http('https://evm-rpc-testnet.sei-apis.com'),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
  ssr: true,
});