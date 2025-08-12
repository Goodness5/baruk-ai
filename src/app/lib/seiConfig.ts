// Sei Network Testnet Configuration
export const SEI_TESTNET_CONFIG = {
  chainId: 713715,
  name: 'Sei Network Testnet',
  network: 'sei-testnet',
  rpcUrl: process.env.SEI_RPC_URL || 'https://evm-rpc-testnet.sei-apis.com',
  blockExplorer: 'https://testnet.sei.io/explorer',
  nativeCurrency: {
    decimals: 18,
    name: 'SEI',
    symbol: 'SEI'
  }
} as const;

// Contract addresses for Sei testnet
export const SEI_TESTNET_CONTRACTS = {
  router: '0xe605be74ba68fc255db0156ab63c31b50b336d6b',
  factory: '0xCEeC70dF7bC3aEB57F078A1b1BeEa2c6320d8957',
  amm: '0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1',
  lending: '0x5197d95B4336f1EF6dd0fd62180101021A88E27b',
  limitOrder: '0x3bDdc3fAbf58fDaA6fF62c95b944819cF625c0F4',
  yieldFarm: '0x1Ae8eC370795FCF21862Ba486fb44a5219Dea7Ce'
} as const;

// Validate environment configuration
export function validateSeiConfig() {
  if (!process.env.SEI_RPC_URL) {
    console.warn('SEI_RPC_URL not set, using default testnet RPC');
  }
  
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    console.error('NEXT_PUBLIC_PRIVY_APP_ID is required for Privy authentication');
  }
  
  return {
    rpcUrl: SEI_TESTNET_CONFIG.rpcUrl,
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID
  };
}
