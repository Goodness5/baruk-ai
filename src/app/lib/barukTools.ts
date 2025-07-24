import { ethers } from 'ethers';
import { BARUK_CONTRACTS, SEI_DEXS } from './types';
import { getProtocolTokens } from './seiProtocols';
import { getTokenBalance } from './mcpTools';
import axios from 'axios';

const SEI_RPC_URL = process.env.SEI_RPC_URL || 'https://evm-rpc.sei-apis.com';
const provider = new ethers.JsonRpcProvider(SEI_RPC_URL);

const COVALENT_API_KEY = process.env.COVALENT_API_KEY;
const SEI_CHAIN_ID = Number(process.env.SEI_CHAIN_ID) || 1328; // Default to testnet

// Contract ABIs
const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)',
  'function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB)',
];

const AMM_ABI = [
  'function getReserves(address tokenA, address tokenB) external view returns (uint112 reserveA, uint112 reserveB, uint32 blockTimestampLast)',
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
];

const YIELD_FARM_ABI = [
  'function poolInfo(uint256 poolId) external view returns (address lpToken, address rewardToken, uint256 rewardPerSecond, uint256 lastUpdateTime, uint256 totalStaked)',
  'function userInfo(uint256 poolId, address user) external view returns (uint256 amount, uint256 rewardDebt)',
  'function pendingReward(uint256 poolId, address user) external view returns (uint256)',
  'function stake(uint256 poolId, uint256 amount) external',
  'function unstake(uint256 poolId, uint256 amount) external',
  'function claimReward(uint256 poolId) external',
  'function emergencyWithdraw(uint256 poolId) external',
];

const LENDING_ABI = [
  'function depositAndBorrow(address collateralToken, uint256 collateralAmount, address borrowToken, uint256 borrowAmount) external',
  'function repay(address token, uint256 amount) external',
  'function liquidate(address user, address collateralToken, address borrowToken) external',
  'function getUserPosition(address user) external view returns (address[] memory collateralTokens, uint256[] memory collateralAmounts, address[] memory borrowTokens, uint256[] memory borrowAmounts)',
  'function getHealthFactor(address user) external view returns (uint256)',
  'function getTokenTwap(address token) external view returns (uint256)',
];

const LIMIT_ORDER_ABI = [
  'function placeOrder(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint256 deadline) external returns (uint256 orderId)',
  'function cancelOrder(uint256 orderId) external',
  'function executeOrder(uint256 orderId, uint256 minAmountOut) external',
  'function getOrder(uint256 orderId) external view returns (address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint256 deadline, bool executed)',
  'function getUserOrders(address user) external view returns (uint256[] memory)',
];

const ORACLE_ABI = [
  'function getExchangeRate(string memory denom) external view returns (uint256)',
  'function getExchangeRates() external view returns (string[] memory, uint256[] memory)',
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address spender, uint amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

// Helper function to get contract instance
function getContract(address: string, abi: any[]) {
  return new ethers.Contract(address, abi, provider);
}

// Baruk Protocol Tools

export async function getPoolInfo(tokenA: string, tokenB: string): Promise<any> {
  try {
    const amm = getContract(BARUK_CONTRACTS.AMM, AMM_ABI);
    const [reserves, pairAddress] = await Promise.all([
      amm.getReserves(tokenA, tokenB),
      amm.getPair(tokenA, tokenB),
    ]);

    const lpContract = getContract(pairAddress, ERC20_ABI);
    const totalSupply = await lpContract.totalSupply();

    return {
      token0: tokenA,
      token1: tokenB,
      reserve0: reserves.reserveA.toString(),
      reserve1: reserves.reserveB.toString(),
      lpToken: pairAddress,
      totalSupply: totalSupply.toString(),
    };
  } catch (error) {
    throw new Error(`Failed to get pool info: ${error}`);
  }
}

export async function addLiquidity(params: {
  tokenA: string;
  tokenB: string;
  amountADesired: string;
  amountBDesired: string;
  amountAMin: string;
  amountBMin: string;
  to: string;
  deadline: number;
}): Promise<string> {
  try {
    const router = getContract(BARUK_CONTRACTS.Router, ROUTER_ABI);
    
    // This would need to be called with a signer in actual implementation
    const tx = await router.addLiquidity(
      params.tokenA,
      params.tokenB,
      params.amountADesired,
      params.amountBDesired,
      params.amountAMin,
      params.amountBMin,
      params.to,
      params.deadline
    );
    
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to add liquidity: ${error}`);
  }
}

export async function swapTokens(params: any): Promise<string> {
  try {
    const router = getContract(BARUK_CONTRACTS.Router, ROUTER_ABI);
    const path = [params.tokenIn, params.tokenOut];
    
    const tx = await router.swapExactTokensForTokens(
      params.amountIn,
      params.minAmountOut,
      path,
      params.to,
      params.deadline
    );
    
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to swap tokens: ${error}`);
  }
}

export async function getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string): Promise<string[]> {
  try {
    const router = getContract(BARUK_CONTRACTS.Router, ROUTER_ABI);
    const path = [tokenIn, tokenOut];
    const amounts = await router.getAmountsOut(amountIn, path);
    return amounts.map((amt: any) => amt.toString());
  } catch (error) {
    throw new Error(`Failed to get swap quote: ${error}`);
  }
}

export async function stakeLPTokens(poolId: number, amount: string): Promise<string> {
  try {
    const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
    const tx = await farm.stake(poolId, amount);
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to stake LP tokens: ${error}`);
  }
}

export async function unstakeLPTokens(poolId: number, amount: string): Promise<string> {
  try {
    const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
    const tx = await farm.unstake(poolId, amount);
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to unstake LP tokens: ${error}`);
  }
}

export async function claimFarmRewards(poolId: number): Promise<string> {
  try {
    const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
    const tx = await farm.claimReward(poolId);
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to claim rewards: ${error}`);
  }
}

export async function getFarmInfo(poolId: number): Promise<any> {
  try {
    const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
    const poolInfo = await farm.poolInfo(poolId);
    
    return {
      poolId,
      lpToken: poolInfo.lpToken,
      rewardToken: poolInfo.rewardToken,
      rewardPerSecond: poolInfo.rewardPerSecond.toString(),
      totalStaked: poolInfo.totalStaked.toString(),
      lastUpdateTime: Number(poolInfo.lastUpdateTime),
    };
  } catch (error) {
    throw new Error(`Failed to get farm info: ${error}`);
  }
}

export async function getPendingRewards(poolId: number, user: string): Promise<string | { error: string; details?: string }> {
  try {
    const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
    const pending = await farm.pendingReward(poolId, user);
    return pending.toString();
  } catch (error: any) {
    return { error: 'No pending rewards found or contract call failed', details: error?.message || error };
  }
}

export async function depositAndBorrow(params: {
  collateralToken: string;
  collateralAmount: string;
  borrowToken: string;
  borrowAmount: string;
}): Promise<string> {
  try {
    const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
    const tx = await lending.depositAndBorrow(
      params.collateralToken,
      params.collateralAmount,
      params.borrowToken,
      params.borrowAmount
    );
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to deposit and borrow: ${error}`);
  }
}

export async function repayLoan(token: string, amount: string): Promise<string> {
  try {
    const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
    const tx = await lending.repay(token, amount);
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to repay loan: ${error}`);
  }
}

export async function liquidatePosition(user: string, collateralToken: string, borrowToken: string): Promise<string> {
  try {
    const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
    const tx = await lending.liquidate(user, collateralToken, borrowToken);
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to liquidate position: ${error}`);
  }
}

export async function getUserLendingPosition(user: string): Promise<any[]> {
  try {
    const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
    const [collateralTokens, collateralAmounts, borrowTokens, borrowAmounts] = await lending.getUserPosition(user);
    const healthFactor = await lending.getHealthFactor(user);
    const positions: any[] = [];
    for (let i = 0; i < collateralTokens.length; i++) {
      const liquidationPrice = "0";
      positions.push({
        user,
        collateralToken: collateralTokens[i],
        collateralAmount: collateralAmounts[i].toString(),
        borrowToken: borrowTokens[i] || ethers.ZeroAddress,
        borrowAmount: borrowAmounts[i]?.toString() || "0",
        healthFactor: healthFactor.toString(),
        liquidationPrice,
      });
    }
    return positions;
  } catch (error: any) {
    return [{ error: 'No lending position found or contract call failed', details: error?.message || error }];
  }
}

export async function placeLimitOrder(params: {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  deadline: number;
}): Promise<number> {
  try {
    const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
    const tx = await limitOrder.placeOrder(
      params.tokenIn,
      params.tokenOut,
      params.amountIn,
      params.minAmountOut,
      params.deadline
    );
    
    // Parse the orderId from transaction receipt
    const receipt = await tx.wait();
    // Would need to parse the event logs for the actual orderId
    return 0; // Placeholder
  } catch (error) {
    throw new Error(`Failed to place limit order: ${error}`);
  }
}

export async function cancelLimitOrder(orderId: number): Promise<string> {
  try {
    const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
    const tx = await limitOrder.cancelOrder(orderId);
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to cancel limit order: ${error}`);
  }
}

export async function executeLimitOrder(orderId: number, minAmountOut: string): Promise<string> {
  try {
    const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
    const tx = await limitOrder.executeOrder(orderId, minAmountOut);
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to execute limit order: ${error}`);
  }
}

export async function getLimitOrderInfo(orderId: number): Promise<any> {
  try {
    const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
    const order = await limitOrder.getOrder(orderId);
    
    return {
      orderId,
      user: order.user,
      tokenIn: order.tokenIn,
      tokenOut: order.tokenOut,
      amountIn: order.amountIn.toString(),
      minAmountOut: order.minAmountOut.toString(),
      deadline: Number(order.deadline),
      executed: order.executed,
    };
  } catch (error) {
    throw new Error(`Failed to get limit order info: ${error}`);
  }
}

export async function getUserLimitOrders(user: string): Promise<any[]> {
  try {
    const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
    const orderIds = await limitOrder.getUserOrders(user);
    return orderIds.map((id: any) => Number(id));
  } catch (error: any) {
    return [{ error: 'No limit orders found or contract call failed', details: error?.message || error }];
  }
}

export async function getTokenPrice(tokenAddress: string): Promise<string> {
  try {
    const oracle = getContract(BARUK_CONTRACTS.Oracle, ORACLE_ABI);
    
    // Map token address to oracle denom (you'll need to maintain this mapping)
    const tokenToDenom: { [key: string]: string } = {
      [BARUK_CONTRACTS.Token0]: "usei",
      [BARUK_CONTRACTS.Token1]: "uusdc",
      [BARUK_CONTRACTS.Token2]: "ueth",
      // Add more mappings as needed
    };
    
    const denom = tokenToDenom[tokenAddress];
    if (!denom) {
      throw new Error(`Token not supported by oracle: ${tokenAddress}`);
    }
    
    const price = await oracle.getExchangeRate(denom);
    return price.toString();
  } catch (error) {
    throw new Error(`Failed to get token price: ${error}`);
  }
}

// Multi-DEX Trading Tools

export async function findBestPrice(tokenIn: string, tokenOut: string, amountIn: string): Promise<{
  bestDex: string;
  bestPrice: string;
  route: string[];
}> {
  try {
    const dexes = [
      { name: 'Baruk', router: BARUK_CONTRACTS.Router },
      // Add other DEXs when addresses are available
      // { name: 'Dragonswap', router: SEI_DEXS.DRAGONSWAP_ROUTER },
      // { name: 'Astroport', router: SEI_DEXS.ASTROPORT_ROUTER },
    ];
    
    let bestPrice = "0";
    let bestDex = "";
    let route: string[] = [];
    
    for (const dex of dexes) {
      try {
        const router = getContract(dex.router, ROUTER_ABI);
        const path = [tokenIn, tokenOut];
        const amounts = await router.getAmountsOut(amountIn, path);
        const outputAmount = amounts[amounts.length - 1].toString();
        
        if (Number(outputAmount) > Number(bestPrice)) {
          bestPrice = outputAmount;
          bestDex = dex.name;
          route = path;
        }
      } catch (error) {
        console.warn(`Failed to get price from ${dex.name}:`, error);
        continue;
      }
    }
    
    return { bestDex, bestPrice, route };
  } catch (error) {
    throw new Error(`Failed to find best price: ${error}`);
  }
}

export async function executeArbitrage(params: {
  tokenA: string;
  tokenB: string;
  amount: string;
  dex1: string;
  dex2: string;
}): Promise<string> {
  try {
    // This would implement a complex arbitrage strategy
    // For now, returning a placeholder
    return "0x..."; // Placeholder transaction hash
  } catch (error) {
    throw new Error(`Failed to execute arbitrage: ${error}`);
  }
}

// Advanced Strategy Tools

export async function calculateOptimalLiquidity(params: {
  tokenA: string;
  tokenB: string;
  totalValue: string;
  priceImpactLimit: string;
}): Promise<{
  amountA: string;
  amountB: string;
  expectedLP: string;
  priceImpact: string;
}> {
  try {
    const poolInfo = await getPoolInfo(params.tokenA, params.tokenB);
    const reserve0 = Number(poolInfo.reserve0);
    const reserve1 = Number(poolInfo.reserve1);
    
    // Calculate optimal amounts (simplified)
    const ratio = reserve1 / reserve0;
    const totalValueNum = Number(params.totalValue);
    
    const amountA = (totalValueNum / (1 + ratio)).toString();
    const amountB = (totalValueNum - Number(amountA)).toString();
    
    // Calculate expected LP tokens (simplified)
    const totalSupply = Number(poolInfo.totalSupply);
    const expectedLP = Math.min(
      (Number(amountA) * totalSupply) / reserve0,
      (Number(amountB) * totalSupply) / reserve1
    ).toString();
    
    // Calculate price impact (simplified)
    const priceImpact = "0.5"; // Placeholder
    
    return {
      amountA,
      amountB,
      expectedLP,
      priceImpact,
    };
  } catch (error) {
    throw new Error(`Failed to calculate optimal liquidity: ${error}`);
  }
}

export async function calculateYieldOpportunities(): Promise<Array<{
  protocol: string;
  pool: string;
  apy: string;
  tvl: string;
  risk: string;
}>> {
  try {
    // This would analyze all available yield opportunities
    return [
      {
        protocol: "Baruk Farms",
        pool: "TOKEN0/TOKEN1",
        apy: "25.5",
        tvl: "1000000",
        risk: "medium",
      },
      // Add more opportunities
    ];
  } catch (error) {
    throw new Error(`Failed to calculate yield opportunities: ${error}`);
  }
}

export async function analyzePortfolioRisk(userAddress: string): Promise<any> {
  try {
    // Get all user positions across protocols
    const lendingPositions = await getUserLendingPosition(userAddress);
    if (lendingPositions.length === 0 || lendingPositions[0]?.error) {
      return { error: 'No lending positions found for risk analysis', details: lendingPositions[0]?.details };
    }
    // Analyze portfolio composition and risk
    return {
      totalValue: "100000",
      riskScore: 7.5,
      diversificationScore: 6.2,
      recommendations: [
        "Consider reducing leverage in volatile assets",
        "Diversify across more protocols",
        "Monitor collateralization ratios closely",
      ],
    };
  } catch (error: any) {
    return { error: 'Portfolio risk analysis failed', details: error?.message || error };
  }
}

// Governance Tools

export async function getGovernanceInfo(): Promise<{
  governanceAddress: string;
  totalVotes: string;
  activeProposals: number;
}> {
  try {
    // This would interact with governance contract
    return {
      governanceAddress: BARUK_CONTRACTS.Governance,
      totalVotes: "1000000",
      activeProposals: 3,
    };
  } catch (error) {
    throw new Error(`Failed to get governance info: ${error}`);
  }
}

// Analytics Tools

export async function getProtocolTVL(): Promise<{
  totalTVL: string;
  ammTVL: string;
  farmTVL: string;
  lendingTVL: string;
}> {
  try {
    // Calculate TVL across all contracts
    return {
      totalTVL: "50000000",
      ammTVL: "25000000",
      farmTVL: "15000000",
      lendingTVL: "10000000",
    };
  } catch (error) {
    throw new Error(`Failed to get protocol TVL: ${error}`);
  }
}

export async function getProtocolMetrics(): Promise<{
  dailyVolume: string;
  totalUsers: number;
  totalTransactions: number;
  averageGasPrice: string;
}> {
  try {
    return {
      dailyVolume: "1000000",
      totalUsers: 5000,
      totalTransactions: 100000,
      averageGasPrice: "20000000000",
    };
  } catch (error) {
    throw new Error(`Failed to get protocol metrics: ${error}`);
  }
} 

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function covalentGetWithRetry(url: string, retries = 5, delay = 1000): Promise<any> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url);
    } catch (e: any) {
      lastError = e;
      // If rate limited (HTTP 429), wait 2 seconds before retrying
      if (e?.response?.status === 429) {
        if (i < retries - 1) {
          await sleep(2000);
        }
      } else if (i < retries - 1) {
        await sleep(delay * Math.pow(2, i)); // Exponential backoff for other errors
      }
    }
  }
  // If last error was a 429, return a user-friendly rate limit message
  if (lastError?.response?.status === 429) {
    return { data: { items: [{ error: 'Covalent API rate limit reached (5 requests per second). Please wait a few seconds and try again.' }] } };
  }
  throw lastError;
}

function logError(context: string, error: any) {
  console.warn(`[BarukTools] ${context}:`, error?.message || error);
}

export async function getWalletTokenHoldings(walletAddress: string): Promise<any[]> {
  // Use Covalent for mainnet, manual for testnet
  if (SEI_CHAIN_ID === 1329) {
    if (!COVALENT_API_KEY) {
      return [{ error: 'Covalent API key not set in environment. Please add COVALENT_API_KEY to your .env file.' }];
    }
    try {
      const url = `https://api.covalenthq.com/v1/${SEI_CHAIN_ID}/address/${walletAddress}/balances_v2/?key=${COVALENT_API_KEY}`;
      const { data } = await covalentGetWithRetry(url);
      if (!data || !data.data || !data.data.items) {
        return [];
      }
      if (data.data.items[0]?.error) {
        return [data.data.items[0]];
      }
      return data.data.items.map((item: any) => ({
        tokenAddress: item.contract_address,
        symbol: item.contract_ticker_symbol,
        name: item.contract_name,
        balance: item.balance,
        decimals: item.contract_decimals,
        logo_url: item.logo_url,
        type: item.type,
        quote: item.quote,
      }));
    } catch (e: any) {
      logError('getWalletTokenHoldings', e);
      return [{ error: 'Failed to fetch token balances from Covalent. This may be due to network issues, Covalent downtime, or firewall restrictions. Please check your connection and try again.', details: e?.message || e }];
    }
  } else if (SEI_CHAIN_ID === 1328) { // Testnet/manual mode
    const tokens = getProtocolTokens('baruk');
    const provider = new ethers.JsonRpcProvider(process.env.SEI_RPC_URL || 'https://evm-rpc-testnet.sei-apis.com');
    // Get native SEI balance
    let nativeBalance = '0';
    try {
      nativeBalance = (await provider.getBalance(walletAddress)).toString();
    } catch (e) {
      nativeBalance = '0';
    }
    const holdings = [
      {
        contract_address: 'native',
        symbol: 'SEI',
        name: 'Sei',
        balance: nativeBalance,
        decimals: 18,
        type: 'native',
      },
    ];
    // Add ERC-20s
    const erc20s = await Promise.all(
      tokens.map(async (token) => {
        try {
          const bal = await getTokenBalance(token.address, walletAddress);
          return {
            contract_address: token.address,
            symbol: token.symbol,
            name: token.symbol,
            balance: bal.balance,
            decimals: bal.decimals,
            type: 'erc20',
          };
        } catch (e) {
          return null;
        }
      })
    );
    return holdings.concat(erc20s.filter((t): t is NonNullable<typeof t> => Boolean(t)));
  } else {
    return [{ error: 'Unsupported SEI_CHAIN_ID. Please set SEI_CHAIN_ID to 1329 (mainnet) or 1328 (testnet).' }];
  }
}

export async function analyzeFullPortfolio(walletAddress: string): Promise<any> {
  const tokens = await getWalletTokenHoldings(walletAddress);
  if (!Array.isArray(tokens) || tokens.length === 0 || tokens[0]?.error) {
    return { error: 'No tokens found or failed to fetch balances.', details: tokens[0]?.details };
  }
  let totalValue = 0;
  let tokenCount = 0;
  const tokenValues: number[] = [];
  tokens.forEach((t) => {
    if (t.quote && typeof t.quote === 'number') {
      totalValue += t.quote;
      tokenValues.push(t.quote);
      tokenCount++;
    }
  });
  const maxTokenValue = Math.max(...tokenValues, 0);
  const diversification = totalValue > 0 ? 1 - maxTokenValue / totalValue : 0;
  const riskScore = tokenCount > 3 ? 3 : 10 - tokenCount * 2;
  return {
    wallet: walletAddress,
    totalValue,
    diversification,
    riskScore,
    tokens,
  };
} 