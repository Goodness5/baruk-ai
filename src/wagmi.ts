import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';
import { seiTestnet } from './chains/seiTestnet';

export const config = getDefaultConfig({
  appName: 'Baruk DeFi',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, polygon, arbitrum, optimism, seiTestnet],
  ssr: true,
}); 