import { http, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';
import { seiTestnet } from './chains/seiTestnet';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [seiTestnet, mainnet, polygon, arbitrum, optimism],
  connectors: [
    injected({ target: 'metaMask' }),
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [seiTestnet.id]: http('https://evm-rpc-testnet.sei-apis.com'),
  },
  ssr: true,
}); 