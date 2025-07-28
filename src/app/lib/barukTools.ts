/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, InterfaceAbi } from 'ethers';
import { BARUK_CONTRACTS, SEI_DEXS } from './types';
import { getProtocolTokens } from './seiProtocols';
import { getTokenBalance } from './mcpTools';
import axios from 'axios';
import ROUTER_ABI_RAW from '../../abi/BarukRouter.json';
import AMM_ABI_RAW from '../../abi/BarukAMM.json';
import YIELD_FARM_ABI_RAW from '../../abi/BarukYieldFarm.json';

const ROUTER_ABI = ROUTER_ABI_RAW.abi as InterfaceAbi;
const AMM_ABI = AMM_ABI_RAW.abi as InterfaceAbi;
const YIELD_FARM_ABI = YIELD_FARM_ABI_RAW.abi as InterfaceAbi;
import LENDING_ABI from '../../abi/BarukLending.json';
import LIMIT_ORDER_ABI from '../../abi/BarukLimitOrder.json';
import FACTORY_AMM from '../../abi/BarukAMMFactory.json';
import ERC20_ABI from '../../abi/ERC20.json';

const SEI_RPC_URL = process.env.SEI_RPC_URL || 'https://evm-rpc.sei-apis.com';
const provider = new ethers.JsonRpcProvider(SEI_RPC_URL);

const COVALENT_API_KEY = process.env.COVALENT_API_KEY;
const SEI_CHAIN_ID = Number(process.env.SEI_CHAIN_ID) || 1328;


const ORACLE_ABI = {
  abi: [
    'function getExchangeRate(string memory denom) external view returns (uint256)',
    'function getExchangeRates() external view returns (string[] memory, uint256[] memory)',
  ]
};

// Helper function to get contract instance
function getContract(address: string, abi: any) {
  const contract = new ethers.Contract(address, abi, provider);
  console.log("prepare contract:::", contract)
  return contract;
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

export async function swapTokens(params: {
  tokenIn: string;
  tokenOut: string;
  amountIn: string; // Can be exact amount or percentage string like "50%"
  minAmountOut: string;
  to: string;
  deadline: number;
  signer: ethers.Signer; // Add signer parameter
  userAddress: string; // Add user address for balance checks
}): Promise<string> {
  try {
    // Parameter validation
    const required = [
      'tokenIn', 'tokenOut', 'amountIn', 'minAmountOut', 'to', 'deadline', 'signer', 'userAddress'
    ] as const;
    for (const key of required) {
      if (!(key in params) || params[key as keyof typeof params] === undefined || params[key as keyof typeof params] === null) {
        throw new Error(`swapTokens: Missing required parameter: ${key}`);
      }
    }

    // Get token contracts with signer
    const tokenInContract = new ethers.Contract(
      params.tokenIn,
      ERC20_ABI.abi || ERC20_ABI,
      params.signer
    );
    const router = new ethers.Contract(
      BARUK_CONTRACTS.Router,
      ROUTER_ABI.abi || ROUTER_ABI,
      params.signer
    );

    // Handle percentage amounts (e.g. "50%")
    let swapAmount: string = params.amountIn;
    if (typeof params.amountIn === 'string' && params.amountIn.includes('%')) {
      const percent = parseFloat(params.amountIn.replace('%', '')) / 100;
      const balance = await tokenInContract.balanceOf(params.userAddress);
      const decimals = await tokenInContract.decimals();
      const amount = percent * Number(ethers.formatUnits(balance, decimals));
      swapAmount = ethers.parseUnits(amount.toString(), decimals).toString();
    }

    // Check and approve token spending if needed
    const allowance = await tokenInContract.allowance(params.userAddress, BARUK_CONTRACTS.Router);
    if (BigInt(allowance.toString()) < BigInt(swapAmount)) {
      const approveTx = await tokenInContract.approve(BARUK_CONTRACTS.Router, ethers.MaxUint256);
      await approveTx.wait();
    }

    // Execute swap using the correct ABI and method signature
    const tx = await router.swap(
      params.tokenIn,
      params.tokenOut,
      swapAmount,
      params.minAmountOut,
      params.deadline,
      params.to
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    throw new Error(`Failed to swap tokens: ${error}`);
  }
}

export async function getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string): Promise<string[]> {
  try {
    // Parameter validation
    if (!tokenIn || !tokenOut || !amountIn) {
      throw new Error('getSwapQuote: tokenIn, tokenOut, and amountIn are required');
    }
    // Use correct ABI array
    const router = getContract(BARUK_CONTRACTS.Router, ROUTER_ABI.abi);
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
    // Parameter validation
    if (!tokenIn || !tokenOut || !amountIn) {
      throw new Error('findBestPrice: tokenIn, tokenOut, and amountIn are required');
    }
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
        // Use correct ABI array
        const router = getContract(dex.router, ROUTER_ABI.abi);
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

// ...existing code...
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
    // ...existing code...
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
    console.log('[Native Balance]', {
      address: walletAddress,
      nativeBalance: ethers.formatEther(nativeBalance),
      rawBalance: nativeBalance
    });

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
    console.log('[Token List]', tokens);
    
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
          console.error(`[Token Balance Error] ${token.symbol}:`, e);
          return null; // Return null on error so we can filter it out
        }
      })
    );
    // Only include valid token objects
    return holdings.concat(
      erc20s.filter(
        (t): t is {
          contract_address: string;
          symbol: string;
          name: string;
          balance: string;
          decimals: number;
          type: string;
        } =>
          t !== null &&
          typeof t === 'object' &&
          'contract_address' in t &&
          'symbol' in t &&
          'name' in t &&
          'balance' in t &&
          'decimals' in t &&
          'type' in t
      )
    );
  } else {
    return [{ error: 'Unsupported SEI_CHAIN_ID. Please set SEI_CHAIN_ID to 1329 (mainnet) or 1328 (testnet).' }];
  }
}

// ...existing code...
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

// Price Oracle Tools
export async function getTokenInfo(tokenAddress: string): Promise<{
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUSD?: number;
  totalSupply?: string;
}> {
  try {
    const token = getContract(tokenAddress, ERC20_ABI);
    const [symbol, name, decimals, totalSupply] = await Promise.all([
      token.symbol(),
      token.name(),
      token.decimals(),
      token.totalSupply?.().catch(() => '0') // Optional as not all tokens have totalSupply
    ]);

    let priceUSD;
    try {
      priceUSD = await getTokenPrice(tokenAddress);
    } catch {
      priceUSD = undefined;
    }

    return {
      address: tokenAddress,
      symbol,
      name,
      decimals: Number(decimals),
      priceUSD: priceUSD ? Number(priceUSD) : undefined,
      totalSupply: totalSupply?.toString()
    };
  } catch (error) {
    throw new Error(`Failed to get token info: ${error}`);
  }
}

// Gas Estimation Tools
export async function estimateGasCost(txData: {
  to: string;
  data: string;
  value?: string;
}): Promise<{
  gasEstimate: string;
  gasPrice: string;
  costNative: string;
  costUSD?: string;
}> {
  try {
    const [gasEstimate, gasPrice] = await Promise.all([
      provider.estimateGas(txData),
      // provider.getGasPrice(),
      getTokenPrice(BARUK_CONTRACTS.nativeToken) // Assuming you have a native token address
    ]);

    const costNative = (gasEstimate).toString();
    let costUSD;
    
    // if (nativePrice) {
    //   costUSD = (Number(costNative) * Number(nativePrice) / 1e18).toFixed(2);
    // }

    return {
      gasEstimate: gasEstimate.toString(),
      gasPrice: gasPrice.toString(),
      costNative,
      costUSD
    };
  } catch (error) {
    throw new Error(`Failed to estimate gas cost: ${error}`);
  }
}

// Transaction Simulation Tool
export async function simulateTransaction(params: {
  from: string;
  to: string;
  data: string;
  value?: string;
}): Promise<{
  success: boolean;
  gasUsed: string;
  changes: Array<{
    address: string;
    balanceChange: string;
  }>;
  error?: string;
}> {
  try {
    // This would use Tenderly or another simulation service in production
    // For now, we'll simulate locally
    const result = await provider.call({
      from: params.from,
      to: params.to,
      data: params.data,
      value: params.value || '0'
    });

    // Parse the result - this is simplified
    return {
      success: true,
      gasUsed: '0', // Would need proper simulation to get this
      changes: []   // Would need proper simulation to get this
    };
  } catch (error: any) {
    return {
      success: false,
      gasUsed: '0',
      changes: [],
      error: error.reason || error.message
    };
  }
}

// Position Management Tools
export async function getOptimalRepayAmount(user: string, token: string): Promise<string> {
  try {
    const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
    const position = await lending.getUserPosition(user);
    
    for (let i = 0; i < position.borrowTokens.length; i++) {
      if (position.borrowTokens[i] === token) {
        return position.borrowAmounts[i].toString();
      }
    }
    
    return '0';
  } catch (error) {
    throw new Error(`Failed to get optimal repay amount: ${error}`);
  }
}

export async function getHealthFactor(user: string): Promise<string> {
  try {
    const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
    const healthFactor = await lending.getHealthFactor(user);
    return healthFactor.toString();
  } catch (error) {
    throw new Error(`Failed to get health factor: ${error}`);
  }
}

// Yield Optimization Tools
export async function calculateAutoCompound(poolId: number, user: string): Promise<{
  optimalInterval: number; // in seconds
  estimatedAPYBoost: string; // percentage
  gasCost: string;
}> {
  try {
    const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
    const [pendingRewards, userInfo] = await Promise.all([
      farm.pendingReward(poolId, user),
      farm.userInfo(poolId, user)
    ]);

    // Simplified calculation - real implementation would be more complex
    const stakedAmount = Number(userInfo.amount);
    const pendingAmount = Number(pendingRewards);
    
    if (stakedAmount === 0) {
      return {
        optimalInterval: 0,
        estimatedAPYBoost: '0',
        gasCost: '0'
      };
    }

    const rewardRate = pendingAmount / (24 * 3600); // Assume daily rewards
    const optimalInterval = Math.max(3600, Math.min(24 * 3600, (stakedAmount / rewardRate) * 0.5));
    
    return {
      optimalInterval,
      estimatedAPYBoost: (pendingAmount / stakedAmount * 100).toFixed(2),
      gasCost: await estimateGasCost({
        to: BARUK_CONTRACTS.YieldFarm,
        data: farm.interface.encodeFunctionData('claimReward', [poolId])
      }).then(res => res.costNative)
    };
  } catch (error) {
    throw new Error(`Failed to calculate auto-compound: ${error}`);
  }
}

// Risk Management Tools
export async function checkLiquidationRisk(user: string): Promise<{
  atRisk: boolean;
  healthFactor: string;
  mostVulnerablePosition?: {
    collateralToken: string;
    borrowToken: string;
    collateralNeeded: string;
  };
}> {
  try {
    const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
    const healthFactor = await lending.getHealthFactor(user);
    
    if (Number(healthFactor) > 1.5) {
      return {
        atRisk: false,
        healthFactor: healthFactor.toString()
      };
    }

    // Get the most vulnerable position
    const position = await lending.getUserPosition(user);
    let mostVulnerable;
    let minRatio = Infinity;
    
    for (let i = 0; i < position.collateralTokens.length; i++) {
      const ratio = Number(position.collateralAmounts[i]) / Number(position.borrowAmounts[i] || 1);
      if (ratio < minRatio) {
        minRatio = ratio;
        mostVulnerable = {
          collateralToken: position.collateralTokens[i],
          borrowToken: position.borrowTokens[i],
          collateralNeeded: (Number(position.borrowAmounts[i]) * 1.1 - Number(position.collateralAmounts[i])).toString()
        };
      }
    }

    return {
      atRisk: true,
      healthFactor: healthFactor.toString(),
      mostVulnerablePosition: mostVulnerable
    };
  } catch (error) {
    throw new Error(`Failed to check liquidation risk: ${error}`);
  }
}

// Wallet Management Tools
export async function validateWalletAddress(address: string): Promise<{
  isValid: boolean;
  isContract: boolean;
  ensName?: string;
}> {
  try {
    const checksum = ethers.getAddress(address); // Throws if invalid
    const code = await provider.getCode(checksum);
    
    return {
      isValid: true,
      isContract: code !== '0x',
      ensName: undefined // ENS not supported on Sei, but keeping for compatibility
    };
  } catch {
    return {
      isValid: false,
      isContract: false
    };
  }
}

export async function getTransactionHistory(address: string, limit = 10): Promise<Array<{
  hash: string;
  timestamp: number;
  to: string;
  from: string;
  value: string;
  method?: string;
}>> {
  try {
    if (SEI_CHAIN_ID === 1329 && COVALENT_API_KEY) {
      const url = `https://api.covalenthq.com/v1/${SEI_CHAIN_ID}/address/${address}/transactions_v2/?key=${COVALENT_API_KEY}&page-size=${limit}`;
      const { data } = await covalentGetWithRetry(url);
      
      return data.data.items.map((tx: any) => ({
        hash: tx.tx_hash,
        timestamp: new Date(tx.block_signed_at).getTime() / 1000,
        to: tx.to_address,
        from: tx.from_address,
        value: tx.value,
        method: tx.log_events[0]?.decoded?.name
      }));
    }

    // Fallback for testnet or when Covalent not available
    const blockNumber = await provider.getBlockNumber();
    const txs = [];
    
    // This is very simplified - in production you'd want to index transactions
    for (let i = blockNumber; i > blockNumber - 1000 && txs.length < limit; i--) {
      const block = await provider.getBlock(i, true);
      if (block?.transactions) {
        for (const txHash of block.transactions) {
          const tx = await provider.getTransaction(txHash);
          if (tx?.from === address || tx?.to === address) {
            txs.push({
              hash: tx?.hash,
              timestamp: block.timestamp,
              to: tx?.to || '',
              from: tx?.from,
              value: tx?.value.toString()
            });
          }
        }
      }
    }
    
    return txs.slice(0, limit);
  } catch (error) {
    throw new Error(`Failed to get transaction history: ${error}`);
  }
}

// Cross-Chain Tools (placeholder implementations)
export async function getBridgeOptions(tokenAddress: string): Promise<Array<{
  bridgeName: string;
  estimatedTime: string;
  fee: string;
  supportedChains: number[];
}>> {
  // In a real implementation, this would query various bridge APIs
  return [
    {
      bridgeName: "Baruk Bridge",
      estimatedTime: "5 minutes",
      fee: "0.1%",
      supportedChains: [1, 56, 137, 1329] // ETH, BSC, Polygon, Sei
    },
    {
      bridgeName: "Axelar",
      estimatedTime: "15 minutes",
      fee: "0.3% + gas",
      supportedChains: [1, 56, 137, 42161, 1329]
    }
  ];
}

export async function estimateBridgeGas(
  sourceChain: number,
  destChain: number,
  tokenAddress: string,
  amount: string
): Promise<{
  sourceGas: string;
  destGas: string;
  bridgeFee: string;
  totalCostUSD?: string;
}> {
  // Placeholder implementation
  return {
    sourceGas: "0.01",
    destGas: "0.005",
    bridgeFee: "0.001",
    totalCostUSD: "10.50"
  };
}

// Advanced Analytics Tools
export async function calculateImpermanentLoss(
  tokenA: string,
  tokenB: string,
  entryPriceRatio: string,
  currentPriceRatio: string
): Promise<string> {
  // Implementation of impermanent loss formula
  const entry = Number(entryPriceRatio);
  const current = Number(currentPriceRatio);
  const priceRatio = current / entry;
  const il = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
  return (il * 100).toFixed(2);
}

export async function getHistoricalAPY(poolId: number, days = 30): Promise<Array<{
  date: string;
  apy: string;
  tvl: string;
}>> {
  // Placeholder implementation - would query historical data in production
  const results = [];
  for (let i = 0; i < days; i++) {
    results.push({
      date: new Date(Date.now() - (days - i) * 24 * 3600 * 1000).toISOString().split('T')[0],
      apy: (Math.random() * 20 + 5).toFixed(2),
      tvl: (Math.random() * 1000000 + 500000).toFixed(2)
    });
  }
  return results;
}

// Utility Tools
export async function decodeTransactionData(txData: string): Promise<{
  method: string | undefined;
  params: Record<string, any> | undefined;
}> {
  try {
    // Try all known ABIs
    const abis = [ROUTER_ABI, AMM_ABI, YIELD_FARM_ABI, LENDING_ABI, LIMIT_ORDER_ABI];
    
    for (const abi of abis) {
      try {
        const iface = new ethers.Interface(abi);
        const decoded = iface.parseTransaction({ data: txData });
        return {
          method: decoded?.name,
          params: decoded?.args
        };
      } catch {
        continue;
      }
    }
    
    throw new Error("Could not decode transaction data with known ABIs");
  } catch (error) {
    throw new Error(`Failed to decode transaction data: ${error}`);
  }
}

export async function encodeFunctionCall(params: {
  contractAddress: string;
  functionName: string;
  args: any[];
}): Promise<string> {
  try {
    // Try all known ABIs
    const abis = [ROUTER_ABI, AMM_ABI, YIELD_FARM_ABI, LENDING_ABI, LIMIT_ORDER_ABI];
    
    for (const abi of abis) {
      try {
        const iface = new ethers.Interface(abi);
        return iface.encodeFunctionData(params.functionName, params.args);
      } catch {
        continue;
      }
    }
    
    throw new Error("Could not encode function call with known ABIs");
  } catch (error) {
    throw new Error(`Failed to encode function call: ${error}`);
  }
}