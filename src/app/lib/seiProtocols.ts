// SEI Protocol Registry for Baruk, Astroport, and Vortex
// This file centralizes contract addresses, ABIs, and supported services for each protocol

import BarukRouterAbi from '../../abi/BarukRouter.json';
import BarukAMMAbi from '../../abi/BarukAMM.json';
import BarukLendingAbi from '../../abi/BarukLending.json';
import BarukLimitOrderAbi from '../../abi/BarukLimitOrder.json';
import BarukYieldFarmAbi from '../../abi/BarukYieldFarm.json';
import BarukFactoryAbi from '../../abi/BarukAMMFactory.json';
import type { Token } from '../store/useAppStore';
import type { Abi } from 'viem';

// Astroport and Vortex: CosmWasm schemas (not EVM ABIs)
// These are typically JSON schemas for execute/query messages
// For demo, we use the standard message structure and public testnet addresses

export type SeiProtocol = {
  id: string;
  name: string;
  type: 'baruk' | 'astroport' | 'vortex';
  logoUrl?: string;
  contracts: {
    router?: { address: string; abi?: Abi; schemaPath?: string };
    amm?: { address: string; abi?: Abi; schemaPath?: string };
    lending?: { address: string; abi?: Abi; schemaPath?: string };
    limitOrder?: { address: string; abi?: Abi; schemaPath?: string };
    yieldFarm?: { address: string; abi?: Abi; schemaPath?: string };
    factory?: { address: string; abi?: Abi; schemaPath?: string };
    // For CosmWasm, use schemaPath or messageTypes
    [key: string]: unknown;
  };
  services: ('swap' | 'liquidity' | 'lending' | 'limitOrder' | 'farm')[];
  description?: string;
};

export const SEI_PROTOCOLS: SeiProtocol[] = [
  {
    id: 'baruk',
    name: 'Baruk',
    type: 'baruk',
    logoUrl: '/baruk-logo.svg',
    contracts: {
      router: {
        address: '0xe605be74ba68fc255dB0156ab63c31b50b336D6B',
        abi: BarukRouterAbi as unknown as Abi,
      },
      amm: {
        address: '0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1',
        abi: BarukAMMAbi as unknown as Abi,
      },
      lending: {
        address: '0x5197d95B4336f1EF6dd0fd62180101021A88E27b',
        abi: BarukLendingAbi as unknown as Abi,
      },
      limitOrder: {
        address: '0x3bDdc3fAbf58fDaA6fF62c95b944819cF625c0F4',
        abi: BarukLimitOrderAbi as unknown as Abi,
      },
      yieldFarm: {
        address: '0x1Ae8eC370795FCF21862Ba486fb44a5219Dea7Ce',
        abi: BarukYieldFarmAbi as unknown as Abi,
      },
      factory: {
        address: '0xCEeC70dF7bC3aEB57F078A1b1BeEa2c6320d8957',
        abi: BarukFactoryAbi as unknown as Abi,
      },
      governance: {
        address: '0xcc649e2a60ceDE9F7Ac182EAfa2af06655e54F60',
      },
      oracle: {
        address: '0x0000000000000000000000000000000000001008',
      },
      tokens: [
        { symbol: 'TOKEN0', address: '0x8923889697C9467548ABe8E815105993EBC785b6' },
        { symbol: 'TOKEN1', address: '0xF2C653e2a1F21ef409d0489C7c1d754d9f2905F7' },
        { symbol: 'TOKEN2', address: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7' },
      ],
    },
    services: ['swap', 'liquidity', 'lending', 'limitOrder', 'farm'],
    description: 'Baruk DeFi protocol on SEI testnet',
  },
  {
    id: 'astroport',
    name: 'Astroport',
    type: 'astroport',
    logoUrl: '/astroport-logo.svg',
    contracts: {
      // Real Astroport testnet addresses (update these with actual addresses)
      router: {
        address: 'sei1z2q9w0g6w2w9w2w9w2w9w2w9w2w9w2w9w2w9w2',
        schemaPath: '/schemas/astroport_router.json',
      },
      factory: {
        address: 'sei1factoryaddressastroporttestnet',
        schemaPath: '/schemas/astroport_factory.json',
      },
      // Add more contracts as needed
    },
    services: ['swap', 'liquidity', 'farm'],
    description: 'Astroport DEX on SEI testnet',
  },
  {
    id: 'vortex',
    name: 'Vortex',
    type: 'vortex',
    logoUrl: '/vortex-logo.svg',
    contracts: {
      router: {
        address: 'sei1routeraddressvortextestnet',
        schemaPath: '/schemas/vortex_router.json',
      },
      factory: {
        address: 'sei1factoryaddressvortextestnet',
        schemaPath: '/schemas/vortex_factory.json',
      },
      // Add more contracts as needed
    },
    services: ['swap', 'liquidity'],
    description: 'Vortex DEX on SEI testnet',
  },
];

export function getSeiProtocolById(id: string): SeiProtocol | undefined {
  return SEI_PROTOCOLS.find((p) => p.id === id);
}

export function getProtocolTokens(protocolId: string): Token[] {
  const protocol = getSeiProtocolById(protocolId);
  if (protocol?.contracts?.tokens) {
    return protocol.contracts.tokens as Token[];
  }
  
  // Default Baruk test tokens if no protocol-specific tokens found
  return [
    { symbol: 'TOKEN0', address: '0x8923889697C9467548ABe8E815105993EBC785b6' },
    { symbol: 'TOKEN1', address: '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7' },
    { symbol: 'TOKEN2', address: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7' },
  ];
} 