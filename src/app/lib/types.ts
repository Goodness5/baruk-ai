/* eslint-disable @typescript-eslint/no-explicit-any */
export interface WalletBalance {
  address: string;
  balance: string;
  formatted: string;
}

export interface TokenBalance {
  tokenAddress: string;
  walletAddress: string;
  balance: string;
  decimals: number;
  symbol: string;
  name: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  price?: string;
}

export interface TokenHolding {
  contract_address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  type: 'native' | 'erc20';
  logo_url?: string;
  quote?: number;
}

export interface TokenError {
  error: string;
  details?: string;
}

export interface NFTInfo {
  address: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  owner: string;
  metadata: Record<string, any>;
}

export interface TransactionInfo {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  blockNumber: number;
  timestamp: number;
  status: 'success' | 'failed';
}

export interface BlockInfo {
  number: number;
  hash: string;
  timestamp: number;
  transactions: string[];
  gasUsed: string;
  gasLimit: string;
}

export interface ChainInfo {
  chainId: number;
  name: string;
  blockNumber: number;
  gasPrice: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface FlowAnalysis {
  address: string;
  inflows: Array<{
    from: string;
    amount: string;
    timestamp: number;
    txHash: string;
  }>;
  outflows: Array<{
    to: string;
    amount: string;
    timestamp: number;
    txHash: string;
  }>;
  totalInflow: string;
  totalOutflow: string;
  netFlow: string;
}

// Baruk Protocol Types
export interface BarukContracts {
  Governance: string;
  Token0: string;
  Token1: string;
  Token2: string;
  AMM: string;
  Router: string;
  YieldFarm: string;
  Lending: string;
  LimitOrder: string;
  Oracle: string;
  nativeToken: string;
  Factory: string;
}

export interface PoolInfo {
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  lpToken: string;
  totalSupply: string;
}

export interface FarmPool {
  poolId: number;
  lpToken: string;
  rewardToken: string;
  rewardPerSecond: string;
  totalStaked: string;
  lastUpdateTime: number;
}

export interface LendingPosition {
  user: string;
  collateralToken: string;
  collateralAmount: string;
  borrowToken: string;
  borrowAmount: string;
  healthFactor: string;
  liquidationPrice: string;
}

export interface LimitOrderData {
  orderId: number;
  user: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  deadline: number;
  executed: boolean;
}

export interface TradeParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  to: string;
  deadline: number;
}

// Contract addresses on Sei testnet
export const BARUK_CONTRACTS: BarukContracts = {
  Governance: "0xcc649e2a60ceDE9F7Ac182EAfa2af06655e54F60",
  Token0: "0x8923889697C9467548ABe8E815105993EBC785b6",
  Token1: "0xF2C653e2a1F21ef409d0489C7c1d754d9f2905F7",
  Token2: "0xD6383ef8A67E929274cE9ca05b694f782A5070D7",
  AMM: "0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1",
  Router: "0xe605be74ba68fc255dB0156ab63c31b50b336D6B",
  YieldFarm: "0x1Ae8eC370795FCF21862Ba486fb44a5219Dea7Ce",
  Lending: "0x5197d95B4336f1EF6dd0fd62180101021A88E27b",
  LimitOrder: "0x3bDdc3fAbf58fDaA6fF62c95b944819cF625c0F4",
  Oracle: "0x0000000000000000000000000000000000001008",
  nativeToken: "0x000000000000000000000000000000000000000000",
  Factory: "0xCEeC70dF7bC3aEB57F078A1b1BeEa2c6320d8957",
};

// External Sei DEX addresses
export const SEI_DEXS = {
  DRAGONSWAP_ROUTER: "0x...", // Add actual addresses
  ASTROPORT_ROUTER: "0x...",
  SUSHISWAP_ROUTER: "0x...",
  // Add more DEXs as they deploy on Sei
}; 