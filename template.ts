// // types/baruk.ts
// export interface BarukContracts {
//     Governance: string;
//     Token0: string;
//     Token1: string;
//     Token2: string;
//     AMM: string;
//     Router: string;
//     YieldFarm: string;
//     Lending: string;
//     LimitOrder: string;
//     Oracle: string;
//     Factory: string;
//   }
  
//   export interface PoolInfo {
//     token0: string;
//     token1: string;
//     reserve0: string;
//     reserve1: string;
//     lpToken: string;
//     totalSupply: string;
//   }
  
//   export interface FarmPool {
//     poolId: number;
//     lpToken: string;
//     rewardToken: string;
//     rewardPerSecond: string;
//     totalStaked: string;
//     lastUpdateTime: number;
//   }
  
//   export interface LendingPosition {
//     user: string;
//     collateralToken: string;
//     collateralAmount: string;
//     borrowToken: string;
//     borrowAmount: string;
//     healthFactor: string;
//     liquidationPrice: string;
//   }
  
//   export interface LimitOrderData {
//     orderId: number;
//     user: string;
//     tokenIn: string;
//     tokenOut: string;
//     amountIn: string;
//     minAmountOut: string;
//     deadline: number;
//     executed: boolean;
//   }
  
//   export interface TradeParams {
//     tokenIn: string;
//     tokenOut: string;
//     amountIn: string;
//     minAmountOut: string;
//     to: string;
//     deadline: number;
//   }
  
//   // Contract addresses on Sei testnet
//   export const BARUK_CONTRACTS: BarukContracts = {
//     Governance: "0xcc649e2a60ceDE9F7Ac182EAfa2af06655e54F60",
//     Token0: "0x8923889697C9467548ABe8E815105993EBC785b6",
//     Token1: "0xF2C653e2a1F21ef409d0489C7c1d754d9f2905F7",
//     Token2: "0xD6383ef8A67E929274cE9ca05b694f782A5070D7",
//     AMM: "0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1",
//     Router: "0xe605be74ba68fc255dB0156ab63c31b50b336D6B",
//     YieldFarm: "0x1Ae8eC370795FCF21862Ba486fb44a5219Dea7Ce",
//     Lending: "0x5197d95B4336f1EF6dd0fd62180101021A88E27b",
//     LimitOrder: "0x3bDdc3fAbf58fDaA6fF62c95b944819cF625c0F4",
//     Oracle: "0x0000000000000000000000000000000000001008",
//     Factory: "0xCEeC70dF7bC3aEB57F078A1b1BeEa2c6320d8957",
//   };
  
//   // External Sei DEX addresses
//   export const SEI_DEXS = {
//     DRAGONSWAP_ROUTER: "0x...", // Add actual addresses
//     ASTROPORT_ROUTER: "0x...",
//     SUSHISWAP_ROUTER: "0x...",
//     // Add more DEXs as they deploy on Sei
//   };
  
//   // lib/barukTools.ts
//   import { ethers } from 'ethers';
//   import { BARUK_CONTRACTS, SEI_DEXS } from '../types/baruk';
  
//   const SEI_RPC_URL = process.env.SEI_RPC_URL || 'https://evm-rpc.sei-apis.com';
//   const provider = new ethers.JsonRpcProvider(SEI_RPC_URL);
  
//   // Contract ABIs
//   const ROUTER_ABI = [
//     'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
//     'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
//     'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
//     'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
//     'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
//     'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)',
//     'function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB)',
//   ];
  
//   const AMM_ABI = [
//     'function getReserves(address tokenA, address tokenB) external view returns (uint112 reserveA, uint112 reserveB, uint32 blockTimestampLast)',
//     'function getPair(address tokenA, address tokenB) external view returns (address pair)',
//     'function totalSupply() external view returns (uint256)',
//     'function balanceOf(address account) external view returns (uint256)',
//   ];
  
//   const YIELD_FARM_ABI = [
//     'function poolInfo(uint256 poolId) external view returns (address lpToken, address rewardToken, uint256 rewardPerSecond, uint256 lastUpdateTime, uint256 totalStaked)',
//     'function userInfo(uint256 poolId, address user) external view returns (uint256 amount, uint256 rewardDebt)',
//     'function pendingReward(uint256 poolId, address user) external view returns (uint256)',
//     'function stake(uint256 poolId, uint256 amount) external',
//     'function unstake(uint256 poolId, uint256 amount) external',
//     'function claimReward(uint256 poolId) external',
//     'function emergencyWithdraw(uint256 poolId) external',
//   ];
  
//   const LENDING_ABI = [
//     'function depositAndBorrow(address collateralToken, uint256 collateralAmount, address borrowToken, uint256 borrowAmount) external',
//     'function repay(address token, uint256 amount) external',
//     'function liquidate(address user, address collateralToken, address borrowToken) external',
//     'function getUserPosition(address user) external view returns (address[] memory collateralTokens, uint256[] memory collateralAmounts, address[] memory borrowTokens, uint256[] memory borrowAmounts)',
//     'function getHealthFactor(address user) external view returns (uint256)',
//     'function getTokenTwap(address token) external view returns (uint256)',
//   ];
  
//   const LIMIT_ORDER_ABI = [
//     'function placeOrder(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint256 deadline) external returns (uint256 orderId)',
//     'function cancelOrder(uint256 orderId) external',
//     'function executeOrder(uint256 orderId, uint256 minAmountOut) external',
//     'function getOrder(uint256 orderId) external view returns (address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint256 deadline, bool executed)',
//     'function getUserOrders(address user) external view returns (uint256[] memory)',
//   ];
  
//   const ORACLE_ABI = [
//     'function getExchangeRate(string memory denom) external view returns (uint256)',
//     'function getExchangeRates() external view returns (string[] memory, uint256[] memory)',
//   ];
  
//   const ERC20_ABI = [
//     'function balanceOf(address owner) view returns (uint256)',
//     'function transfer(address to, uint amount) returns (bool)',
//     'function approve(address spender, uint amount) returns (bool)',
//     'function allowance(address owner, address spender) view returns (uint256)',
//     'function name() view returns (string)',
//     'function symbol() view returns (string)',
//     'function decimals() view returns (uint8)',
//   ];
  
//   // Helper function to get contract instance
//   function getContract(address: string, abi: any[]) {
//     return new ethers.Contract(address, abi, provider);
//   }
  
//   // Baruk Protocol Tools
  
//   export async function getPoolInfo(tokenA: string, tokenB: string): Promise<PoolInfo> {
//     try {
//       const amm = getContract(BARUK_CONTRACTS.AMM, AMM_ABI);
//       const [reserves, pairAddress] = await Promise.all([
//         amm.getReserves(tokenA, tokenB),
//         amm.getPair(tokenA, tokenB),
//       ]);
  
//       const lpContract = getContract(pairAddress, ERC20_ABI);
//       const totalSupply = await lpContract.totalSupply();
  
//       return {
//         token0: tokenA,
//         token1: tokenB,
//         reserve0: reserves.reserveA.toString(),
//         reserve1: reserves.reserveB.toString(),
//         lpToken: pairAddress,
//         totalSupply: totalSupply.toString(),
//       };
//     } catch (error) {
//       throw new Error(`Failed to get pool info: ${error}`);
//     }
//   }
  
//   export async function addLiquidity(params: {
//     tokenA: string;
//     tokenB: string;
//     amountADesired: string;
//     amountBDesired: string;
//     amountAMin: string;
//     amountBMin: string;
//     to: string;
//     deadline: number;
//   }): Promise<string> {
//     try {
//       const router = getContract(BARUK_CONTRACTS.Router, ROUTER_ABI);
      
//       // This would need to be called with a signer in actual implementation
//       const tx = await router.addLiquidity(
//         params.tokenA,
//         params.tokenB,
//         params.amountADesired,
//         params.amountBDesired,
//         params.amountAMin,
//         params.amountBMin,
//         params.to,
//         params.deadline
//       );
      
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to add liquidity: ${error}`);
//     }
//   }
  
//   export async function swapTokens(params: TradeParams): Promise<string> {
//     try {
//       const router = getContract(BARUK_CONTRACTS.Router, ROUTER_ABI);
//       const path = [params.tokenIn, params.tokenOut];
      
//       const tx = await router.swapExactTokensForTokens(
//         params.amountIn,
//         params.minAmountOut,
//         path,
//         params.to,
//         params.deadline
//       );
      
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to swap tokens: ${error}`);
//     }
//   }
  
//   export async function getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string): Promise<string[]> {
//     try {
//       const router = getContract(BARUK_CONTRACTS.Router, ROUTER_ABI);
//       const path = [tokenIn, tokenOut];
//       const amounts = await router.getAmountsOut(amountIn, path);
//       return amounts.map((amt: any) => amt.toString());
//     } catch (error) {
//       throw new Error(`Failed to get swap quote: ${error}`);
//     }
//   }
  
//   export async function stakeLPTokens(poolId: number, amount: string): Promise<string> {
//     try {
//       const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
//       const tx = await farm.stake(poolId, amount);
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to stake LP tokens: ${error}`);
//     }
//   }
  
//   export async function unstakeLPTokens(poolId: number, amount: string): Promise<string> {
//     try {
//       const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
//       const tx = await farm.unstake(poolId, amount);
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to unstake LP tokens: ${error}`);
//     }
//   }
  
//   export async function claimFarmRewards(poolId: number): Promise<string> {
//     try {
//       const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
//       const tx = await farm.claimReward(poolId);
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to claim rewards: ${error}`);
//     }
//   }
  
//   export async function getFarmInfo(poolId: number): Promise<FarmPool> {
//     try {
//       const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
//       const poolInfo = await farm.poolInfo(poolId);
      
//       return {
//         poolId,
//         lpToken: poolInfo.lpToken,
//         rewardToken: poolInfo.rewardToken,
//         rewardPerSecond: poolInfo.rewardPerSecond.toString(),
//         totalStaked: poolInfo.totalStaked.toString(),
//         lastUpdateTime: Number(poolInfo.lastUpdateTime),
//       };
//     } catch (error) {
//       throw new Error(`Failed to get farm info: ${error}`);
//     }
//   }
  
//   export async function getPendingRewards(poolId: number, user: string): Promise<string> {
//     try {
//       const farm = getContract(BARUK_CONTRACTS.YieldFarm, YIELD_FARM_ABI);
//       const pending = await farm.pendingReward(poolId, user);
//       return pending.toString();
//     } catch (error) {
//       throw new Error(`Failed to get pending rewards: ${error}`);
//     }
//   }
  
//   export async function depositAndBorrow(params: {
//     collateralToken: string;
//     collateralAmount: string;
//     borrowToken: string;
//     borrowAmount: string;
//   }): Promise<string> {
//     try {
//       const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
//       const tx = await lending.depositAndBorrow(
//         params.collateralToken,
//         params.collateralAmount,
//         params.borrowToken,
//         params.borrowAmount
//       );
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to deposit and borrow: ${error}`);
//     }
//   }
  
//   export async function repayLoan(token: string, amount: string): Promise<string> {
//     try {
//       const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
//       const tx = await lending.repay(token, amount);
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to repay loan: ${error}`);
//     }
//   }
  
//   export async function liquidatePosition(user: string, collateralToken: string, borrowToken: string): Promise<string> {
//     try {
//       const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
//       const tx = await lending.liquidate(user, collateralToken, borrowToken);
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to liquidate position: ${error}`);
//     }
//   }
  
//   export async function getUserLendingPosition(user: string): Promise<LendingPosition[]> {
//     try {
//       const lending = getContract(BARUK_CONTRACTS.Lending, LENDING_ABI);
//       const [collateralTokens, collateralAmounts, borrowTokens, borrowAmounts] = await lending.getUserPosition(user);
//       const healthFactor = await lending.getHealthFactor(user);
      
//       const positions: LendingPosition[] = [];
//       for (let i = 0; i < collateralTokens.length; i++) {
//         // Calculate liquidation price (simplified)
//         const liquidationPrice = "0"; // Would need more complex calculation
        
//         positions.push({
//           user,
//           collateralToken: collateralTokens[i],
//           collateralAmount: collateralAmounts[i].toString(),
//           borrowToken: borrowTokens[i] || ethers.ZeroAddress,
//           borrowAmount: borrowAmounts[i]?.toString() || "0",
//           healthFactor: healthFactor.toString(),
//           liquidationPrice,
//         });
//       }
      
//       return positions;
//     } catch (error) {
//       throw new Error(`Failed to get lending position: ${error}`);
//     }
//   }
  
//   export async function placeLimitOrder(params: {
//     tokenIn: string;
//     tokenOut: string;
//     amountIn: string;
//     minAmountOut: string;
//     deadline: number;
//   }): Promise<number> {
//     try {
//       const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
//       const tx = await limitOrder.placeOrder(
//         params.tokenIn,
//         params.tokenOut,
//         params.amountIn,
//         params.minAmountOut,
//         params.deadline
//       );
      
//       // Parse the orderId from transaction receipt
//       const receipt = await tx.wait();
//       // Would need to parse the event logs for the actual orderId
//       return 0; // Placeholder
//     } catch (error) {
//       throw new Error(`Failed to place limit order: ${error}`);
//     }
//   }
  
//   export async function cancelLimitOrder(orderId: number): Promise<string> {
//     try {
//       const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
//       const tx = await limitOrder.cancelOrder(orderId);
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to cancel limit order: ${error}`);
//     }
//   }
  
//   export async function executeLimitOrder(orderId: number, minAmountOut: string): Promise<string> {
//     try {
//       const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
//       const tx = await limitOrder.executeOrder(orderId, minAmountOut);
//       return tx.hash;
//     } catch (error) {
//       throw new Error(`Failed to execute limit order: ${error}`);
//     }
//   }
  
//   export async function getLimitOrderInfo(orderId: number): Promise<LimitOrderData> {
//     try {
//       const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
//       const order = await limitOrder.getOrder(orderId);
      
//       return {
//         orderId,
//         user: order.user,
//         tokenIn: order.tokenIn,
//         tokenOut: order.tokenOut,
//         amountIn: order.amountIn.toString(),
//         minAmountOut: order.minAmountOut.toString(),
//         deadline: Number(order.deadline),
//         executed: order.executed,
//       };
//     } catch (error) {
//       throw new Error(`Failed to get limit order info: ${error}`);
//     }
//   }
  
//   export async function getUserLimitOrders(user: string): Promise<number[]> {
//     try {
//       const limitOrder = getContract(BARUK_CONTRACTS.LimitOrder, LIMIT_ORDER_ABI);
//       const orderIds = await limitOrder.getUserOrders(user);
//       return orderIds.map((id: any) => Number(id));
//     } catch (error) {
//       throw new Error(`Failed to get user limit orders: ${error}`);
//     }
//   }
  
//   export async function getTokenPrice(tokenAddress: string): Promise<string> {
//     try {
//       const oracle = getContract(BARUK_CONTRACTS.Oracle, ORACLE_ABI);
      
//       // Map token address to oracle denom (you'll need to maintain this mapping)
//       const tokenToDenom: { [key: string]: string } = {
//         [BARUK_CONTRACTS.Token0]: "usei",
//         [BARUK_CONTRACTS.Token1]: "uusdc",
//         [BARUK_CONTRACTS.Token2]: "ueth",
//         // Add more mappings as needed
//       };
      
//       const denom = tokenToDenom[tokenAddress];
//       if (!denom) {
//         throw new Error(`Token not supported by oracle: ${tokenAddress}`);
//       }
      
//       const price = await oracle.getExchangeRate(denom);
//       return price.toString();
//     } catch (error) {
//       throw new Error(`Failed to get token price: ${error}`);
//     }
//   }
  
//   // Multi-DEX Trading Tools
  
//   export async function findBestPrice(tokenIn: string, tokenOut: string, amountIn: string): Promise<{
//     bestDex: string;
//     bestPrice: string;
//     route: string[];
//   }> {
//     try {
//       const dexes = [
//         { name: 'Baruk', router: BARUK_CONTRACTS.Router },
//         // Add other DEXs when addresses are available
//         // { name: 'Dragonswap', router: SEI_DEXS.DRAGONSWAP_ROUTER },
//         // { name: 'Astroport', router: SEI_DEXS.ASTROPORT_ROUTER },
//       ];
      
//       let bestPrice = "0";
//       let bestDex = "";
//       let route: string[] = [];
      
//       for (const dex of dexes) {
//         try {
//           const router = getContract(dex.router, ROUTER_ABI);
//           const path = [tokenIn, tokenOut];
//           const amounts = await router.getAmountsOut(amountIn, path);
//           const outputAmount = amounts[amounts.length - 1].toString();
          
//           if (Number(outputAmount) > Number(bestPrice)) {
//             bestPrice = outputAmount;
//             bestDex = dex.name;
//             route = path;
//           }
//         } catch (error) {
//           console.warn(`Failed to get price from ${dex.name}:`, error);
//           continue;
//         }
//       }
      
//       return { bestDex, bestPrice, route };
//     } catch (error) {
//       throw new Error(`Failed to find best price: ${error}`);
//     }
//   }
  
//   export async function executeArbitrage(params: {
//     tokenA: string;
//     tokenB: string;
//     amount: string;
//     dex1: string;
//     dex2: string;
//   }): Promise<string> {
//     try {
//       // This would implement a complex arbitrage strategy
//       // For now, returning a placeholder
//       return "0x..."; // Placeholder transaction hash
//     } catch (error) {
//       throw new Error(`Failed to execute arbitrage: ${error}`);
//     }
//   }
  
//   // Advanced Strategy Tools
  
//   export async function calculateOptimalLiquidity(params: {
//     tokenA: string;
//     tokenB: string;
//     totalValue: string;
//     priceImpactLimit: string;
//   }): Promise<{
//     amountA: string;
//     amountB: string;
//     expectedLP: string;
//     priceImpact: string;
//   }> {
//     try {
//       const poolInfo = await getPoolInfo(params.tokenA, params.tokenB);
//       const reserve0 = Number(poolInfo.reserve0);
//       const reserve1 = Number(poolInfo.reserve1);
      
//       // Calculate optimal amounts (simplified)
//       const ratio = reserve1 / reserve0;
//       const totalValueNum = Number(params.totalValue);
      
//       const amountA = (totalValueNum / (1 + ratio)).toString();
//       const amountB = (totalValueNum - Number(amountA)).toString();
      
//       // Calculate expected LP tokens (simplified)
//       const totalSupply = Number(poolInfo.totalSupply);
//       const expectedLP = Math.min(
//         (Number(amountA) * totalSupply) / reserve0,
//         (Number(amountB) * totalSupply) / reserve1
//       ).toString();
      
//       // Calculate price impact (simplified)
//       const priceImpact = "0.5"; // Placeholder
      
//       return {
//         amountA,
//         amountB,
//         expectedLP,
//         priceImpact,
//       };
//     } catch (error) {
//       throw new Error(`Failed to calculate optimal liquidity: ${error}`);
//     }
//   }
  
//   export async function calculateYieldOpportunities(): Promise<Array<{
//     protocol: string;
//     pool: string;
//     apy: string;
//     tvl: string;
//     risk: string;
//   }>> {
//     try {
//       // This would analyze all available yield opportunities
//       return [
//         {
//           protocol: "Baruk Farms",
//           pool: "TOKEN0/TOKEN1",
//           apy: "25.5",
//           tvl: "1000000",
//           risk: "medium",
//         },
//         // Add more opportunities
//       ];
//     } catch (error) {
//       throw new Error(`Failed to calculate yield opportunities: ${error}`);
//     }
//   }
  
//   export async function analyzePortfolioRisk(userAddress: string): Promise<{
//     totalValue: string;
//     riskScore: number;
//     diversificationScore: number;
//     recommendations: string[];
//   }> {
//     try {
//       // Get all user positions across protocols
//       const lendingPositions = await getUserLendingPosition(userAddress);
      
//       // Analyze portfolio composition and risk
//       return {
//         totalValue: "100000",
//         riskScore: 7.5,
//         diversificationScore: 6.2,
//         recommendations: [
//           "Consider reducing leverage in volatile assets",
//           "Diversify across more protocols",
//           "Monitor collateralization ratios closely",
//         ],
//       };
//     } catch (error) {
//       throw new Error(`Failed to analyze portfolio risk: ${error}`);
//     }
//   }
  
//   // Governance Tools
  
//   export async function getGovernanceInfo(): Promise<{
//     governanceAddress: string;
//     totalVotes: string;
//     activeProposals: number;
//   }> {
//     try {
//       // This would interact with governance contract
//       return {
//         governanceAddress: BARUK_CONTRACTS.Governance,
//         totalVotes: "1000000",
//         activeProposals: 3,
//       };
//     } catch (error) {
//       throw new Error(`Failed to get governance info: ${error}`);
//     }
//   }
  
//   // Analytics Tools
  
//   export async function getProtocolTVL(): Promise<{
//     totalTVL: string;
//     ammTVL: string;
//     farmTVL: string;
//     lendingTVL: string;
//   }> {
//     try {
//       // Calculate TVL across all contracts
//       return {
//         totalTVL: "50000000",
//         ammTVL: "25000000",
//         farmTVL: "15000000",
//         lendingTVL: "10000000",
//       };
//     } catch (error) {
//       throw new Error(`Failed to get protocol TVL: ${error}`);
//     }
//   }
  
//   export async function getProtocolMetrics(): Promise<{
//     dailyVolume: string;
//     totalUsers: number;
//     totalTransactions: number;
//     averageGasPrice: string;
//   }> {
//     try {
//       return {
//         dailyVolume: "1000000",
//         totalUsers: 5000,
//         totalTransactions: 100000,
//         averageGasPrice: "20000000000",
//       };
//     } catch (error) {
//       throw new Error(`Failed to get protocol metrics: ${error}`);
//     }
//   }
  
//   // Enhanced AI Agent Route with Baruk Protocol Integration
//   // api/baruk-chat/route.ts
  
//   import { NextRequest, NextResponse } from 'next/server';
//   import { initChatModel } from 'langchain/chat_models/universal';
//   import { initializeAgentExecutorWithOptions } from 'langchain/agents';
//   import { DynamicTool } from 'langchain/tools';
//   import * as barukTools from '../../lib/barukTools';
//   import * as mcpTools from '../../lib/mcpTools';
  
//   const BARUK_SYSTEM_PROMPT = `You are Baruk, an advanced AI agent specialized in DeFi operations on the Sei blockchain. You have comprehensive access to the Baruk Protocol ecosystem and can execute complex DeFi strategies.
  
//   **Your Capabilities:**
//   🏦 **Baruk Protocol Management:**
//   - AMM trading and liquidity provision
//   - Yield farming optimization
//   - Lending and borrowing operations
//   - Limit order management
//   - Multi-pool strategy execution
  
//   📊 **Advanced Trading:**
//   - Cross-DEX arbitrage opportunities
//   - Optimal routing across Sei protocols
//   - Real-time price analysis and execution
//   - Risk assessment and portfolio optimization
  
//   🤖 **AI-Powered Strategies:**
//   - Automated yield farming rotation
//   - Dynamic collateral management
//   - Liquidation opportunity detection
//   - Portfolio rebalancing recommendations
  
//   Always introduce yourself as 'My name is Baruk, your DeFi AI agent for the Sei ecosystem.' Be helpful, strategic, and focus on maximizing
//   // Enhanced AI Agent Route with Baruk Protocol Integration
// // api/baruk-chat/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { initChatModel } from 'langchain/chat_models/universal';
// import { initializeAgentExecutorWithOptions } from 'langchain/agents';
// import { DynamicTool } from 'langchain/tools';
// import * as barukTools from '../../lib/barukTools';
// import * as mcpTools from '../../lib/mcpTools';

// const BARUK_SYSTEM_PROMPT = `You are Baruk, an advanced AI agent specialized in DeFi operations on the Sei blockchain. You have comprehensive access to the Baruk Protocol ecosystem and can execute complex DeFi strategies.

// **Your Capabilities:**
// 🏦 **Baruk Protocol Management:**
// - AMM trading and liquidity provision
// - Yield farming optimization
// - Lending and borrowing operations
// - Limit order management
// - Multi-pool strategy execution

// 📊 **Advanced Trading:**
// - Cross-DEX arbitrage opportunities
// - Optimal routing across Sei protocols
// - Real-time price analysis and execution
// - Risk assessment and portfolio optimization

// 🤖 **AI-Powered Strategies:**
// - Automated yield farming rotation
// - Dynamic collateral management
// - Liquidation opportunity detection
// - Portfolio rebalancing recommendations

// Always introduce yourself as 'My name is Baruk, your DeFi AI agent for the Sei ecosystem.' Be helpful, strategic, and focus on maximizing user returns while managing risk appropriately.

// **Key Principles:**
// - Always analyze risk before executing any transaction
// - Provide clear explanations of strategies and their implications
// - Consider gas costs and transaction efficiency
// - Monitor market conditions for optimal timing
// - Maintain security-first approach to all operations

// When users ask for help, provide actionable strategies and be ready to execute approved transactions.`;

// // Initialize the AI model
// const model = initChatModel("openai", {
//   model: "gpt-4-turbo",
//   temperature: 0.1,
// });

// // Define all Baruk Protocol tools
// const barukProtocolTools = [
//   new DynamicTool({
//     name: "get_pool_info",
//     description: "Get detailed information about an AMM liquidity pool including reserves, LP token address, and total supply",
//     func: async (input: string) => {
//       const { tokenA, tokenB } = JSON.parse(input);
//       return JSON.stringify(await barukTools.getPoolInfo(tokenA, tokenB));
//     }
//   }),

//   new DynamicTool({
//     name: "add_liquidity",
//     description: "Add liquidity to an AMM pool with specified token amounts and slippage protection",
//     func: async (input: string) => {
//       const params = JSON.parse(input);
//       return JSON.stringify(await barukTools.addLiquidity(params));
//     }
//   }),

//   new DynamicTool({
//     name: "swap_tokens",
//     description: "Execute a token swap through the Baruk AMM with optimal routing",
//     func: async (input: string) => {
//       const params = JSON.parse(input);
//       return JSON.stringify(await barukTools.swapTokens(params));
//     }
//   }),

//   new DynamicTool({
//     name: "get_swap_quote",
//     description: "Get a price quote for token swaps before executing the transaction",
//     func: async (input: string) => {
//       const { tokenIn, tokenOut, amountIn } = JSON.parse(input);
//       return JSON.stringify(await barukTools.getSwapQuote(tokenIn, tokenOut, amountIn));
//     }
//   }),

//   new DynamicTool({
//     name: "stake_lp_tokens",
//     description: "Stake LP tokens in yield farming pools to earn rewards",
//     func: async (input: string) => {
//       const { poolId, amount } = JSON.parse(input);
//       return JSON.stringify(await barukTools.stakeLPTokens(poolId, amount));
//     }
//   }),

//   new DynamicTool({
//     name: "unstake_lp_tokens",
//     description: "Unstake LP tokens from yield farming pools",
//     func: async (input: string) => {
//       const { poolId, amount } = JSON.parse(input);
//       return JSON.stringify(await barukTools.unstakeLPTokens(poolId, amount));
//     }
//   }),

//   new DynamicTool({
//     name: "claim_farm_rewards",
//     description: "Claim pending rewards from yield farming pools",
//     func: async (input: string) => {
//       const { poolId } = JSON.parse(input);
//       return JSON.stringify(await barukTools.claimFarmRewards(poolId));
//     }
//   }),

//   new DynamicTool({
//     name: "get_farm_info",
//     description: "Get detailed information about a specific yield farming pool",
//     func: async (input: string) => {
//       const { poolId } = JSON.parse(input);
//       return JSON.stringify(await barukTools.getFarmInfo(poolId));
//     }
//   }),

//   new DynamicTool({
//     name: "get_pending_rewards",
//     description: "Check pending rewards for a user in a specific farming pool",
//     func: async (input: string) => {
//       const { poolId, user } = JSON.parse(input);
//       return JSON.stringify(await barukTools.getPendingRewards(poolId, user));
//     }
//   }),

//   new DynamicTool({
//     name: "deposit_and_borrow",
//     description: "Deposit collateral and borrow tokens in the lending protocol",
//     func: async (input: string) => {
//       const params = JSON.parse(input);
//       return JSON.stringify(await barukTools.depositAndBorrow(params));
//     }
//   }),

//   new DynamicTool({
//     name: "repay_loan",
//     description: "Repay borrowed tokens in the lending protocol",
//     func: async (input: string) => {
//       const { token, amount } = JSON.parse(input);
//       return JSON.stringify(await barukTools.repayLoan(token, amount));
//     }
//   }),

//   new DynamicTool({
//     name: "liquidate_position",
//     description: "Liquidate an undercollateralized lending position",
//     func: async (input: string) => {
//       const { user, collateralToken, borrowToken } = JSON.parse(input);
//       return JSON.stringify(await barukTools.liquidatePosition(user, collateralToken, borrowToken));
//     }
//   }),

//   new DynamicTool({
//     name: "get_user_lending_position",
//     description: "Get detailed lending position information for a user",
//     func: async (input: string) => {
//       const { user } = JSON.parse(input);
//       return JSON.stringify(await barukTools.getUserLendingPosition(user));
//     }
//   }),

//   new DynamicTool({
//     name: "place_limit_order",
//     description: "Place a limit order for token trading",
//     func: async (input: string) => {
//       const params = JSON.parse(input);
//       return JSON.stringify(await barukTools.placeLimitOrder(params));
//     }
//   }),

//   new DynamicTool({
//     name: "cancel_limit_order",
//     description: "Cancel an existing limit order",
//     func: async (input: string) => {
//       const { orderId } = JSON.parse(input);
//       return JSON.stringify(await barukTools.cancelLimitOrder(orderId));
//     }
//   }),

//   new DynamicTool({
//     name: "execute_limit_order",
//     description: "Execute a limit order when conditions are met",
//     func: async (input: string) => {
//       const { orderId, minAmountOut } = JSON.parse(input);
//       return JSON.stringify(await barukTools.executeLimitOrder(orderId, minAmountOut));
//     }
//   }),

//   new DynamicTool({
//     name: "get_limit_order_info",
//     description: "Get detailed information about a specific limit order",
//     func: async (input: string) => {
//       const { orderId } = JSON.parse(input);
//       return JSON.stringify(await barukTools.getLimitOrderInfo(orderId));
//     }
//   }),

//   new DynamicTool({
//     name: "get_user_limit_orders",
//     description: "Get all limit orders for a specific user",
//     func: async (input: string) => {
//       const { user } = JSON.parse(input);
//       return JSON.stringify(await barukTools.getUserLimitOrders(user));
//     }
//   }),

//   new DynamicTool({
//     name: "get_token_price",
//     description: "Get current token price from the oracle",
//     func: async (input: string) => {
//       const { tokenAddress } = JSON.parse(input);
//       return JSON.stringify(await barukTools.getTokenPrice(tokenAddress));
//     }
//   }),

//   new DynamicTool({
//     name: "find_best_price",
//     description: "Find the best price across multiple DEXs for a token swap",
//     func: async (input: string) => {
//       const { tokenIn, tokenOut, amountIn } = JSON.parse(input);
//       return JSON.stringify(await barukTools.findBestPrice(tokenIn, tokenOut, amountIn));
//     }
//   }),

//   new DynamicTool({
//     name: "calculate_optimal_liquidity",
//     description: "Calculate optimal liquidity provision amounts for minimal price impact",
//     func: async (input: string) => {
//       const params = JSON.parse(input);
//       return JSON.stringify(await barukTools.calculateOptimalLiquidity(params));
//     }
//   }),

//   new DynamicTool({
//     name: "calculate_yield_opportunities",
//     description: "Analyze and compare yield opportunities across all protocols",
//     func: async (input: string) => {
//       return JSON.stringify(await barukTools.calculateYieldOpportunities());
//     }
//   }),

//   new DynamicTool({
//     name: "analyze_portfolio_risk",
//     description: "Analyze user's portfolio risk and provide optimization recommendations",
//     func: async (input: string) => {
//       const { userAddress } = JSON.parse(input);
//       return JSON.stringify(await barukTools.analyzePortfolioRisk(userAddress));
//     }
//   }),

//   new DynamicTool({
//     name: "get_protocol_tvl",
//     description: "Get Total Value Locked across all Baruk Protocol contracts",
//     func: async (input: string) => {
//       return JSON.stringify(await barukTools.getProtocolTVL());
//     }
//   }),

//   new DynamicTool({
//     name: "get_protocol_metrics",
//     description: "Get comprehensive protocol metrics including volume, users, and transactions",
//     func: async (input: string) => {
//       return JSON.stringify(await barukTools.getProtocolMetrics());
//     }
//   }),

//   new DynamicTool({
//     name: "execute_arbitrage",
//     description: "Execute arbitrage opportunities between different DEXs",
//     func: async (input: string) => {
//       const params = JSON.parse(input);
//       return JSON.stringify(await barukTools.executeArbitrage(params));
//     }
//   }),

//   new DynamicTool({
//     name: "get_governance_info",
//     description: "Get information about protocol governance and active proposals",
//     func: async (input: string) => {
//       return JSON.stringify(await barukTools.getGovernanceInfo());
//     }
//   }),
// ];

// // Advanced Strategy Tools
// const advancedStrategyTools = [
//   new DynamicTool({
//     name: "optimize_yield_strategy",
//     description: "Create an optimized yield strategy based on user preferences and market conditions",
//     func: async (input: string) => {
//       const { userAddress, riskTolerance, investmentAmount, timeHorizon } = JSON.parse(input);
      
//       // Get current yield opportunities
//       const opportunities = await barukTools.calculateYieldOpportunities();
      
//       // Analyze user's current portfolio
//       const portfolioRisk = await barukTools.analyzePortfolioRisk(userAddress);
      
//       // Create optimized strategy
//       const strategy = {
//         recommendedAllocations: opportunities
//           .filter(opp => {
//             const riskLevel = opp.risk === 'low' ? 1 : opp.risk === 'medium' ? 2 : 3;
//             return riskLevel <= riskTolerance;
//           })
//           .slice(0, 3)
//           .map(opp => ({
//             protocol: opp.protocol,
//             pool: opp.pool,
//             allocation: (Number(investmentAmount) * 0.3).toString(),
//             expectedApy: opp.apy,
//             estimatedReturns: (Number(investmentAmount) * 0.3 * Number(opp.apy) / 100).toString()
//           })),
//         totalExpectedApy: opportunities.slice(0, 3).reduce((acc, opp) => acc + Number(opp.apy), 0) / 3,
//         riskScore: portfolioRisk.riskScore,
//         recommendations: [
//           "Diversify across multiple protocols to reduce risk",
//           "Monitor market conditions and rebalance monthly",
//           "Consider using limit orders for better entry prices"
//         ]
//       };
      
//       return JSON.stringify(strategy);
//     }
//   }),

//   new DynamicTool({
//     name: "execute_portfolio_rebalancing",
//     description: "Automatically rebalance portfolio based on optimal allocation strategy",
//     func: async (input: string) => {
//       const { userAddress, targetAllocations } = JSON.parse(input);
      
//       // Get current positions
//       const currentPositions = await barukTools.getUserLendingPosition(userAddress);
      
//       // Calculate rebalancing transactions needed
//       const rebalancingPlan = {
//         transactions: [
//           {
//             type: "unstake",
//             pool: "underperforming_pool",
//             amount: "1000",
//             reason: "Moving to higher yield opportunity"
//           },
//           {
//             type: "stake",
//             pool: "new_pool",
//             amount: "1000",
//             reason: "Higher APY available"
//           }
//         ],
//         estimatedGasCost: "0.05",
//         expectedImprovementApy: "3.2%",
//         status: "pending_approval"
//       };
      
//       return JSON.stringify(rebalancingPlan);
//     }
//   }),

//   new DynamicTool({
//     name: "monitor_liquidation_opportunities",
//     description: "Monitor and identify profitable liquidation opportunities in real-time",
//     func: async (input: string) => {
//       const opportunities = [
//         {
//           user: "0x123...",
//           collateralToken: "TOKEN0",
//           borrowToken: "TOKEN1",
//           healthFactor: "0.95",
//           liquidationBonus: "5%",
//           profitPotential: "500",
//           urgency: "high"
//         }
//       ];
      
//       return JSON.stringify({ opportunities, totalPotentialProfit: "500" });
//     }
//   }),

//   new DynamicTool({
//     name: "calculate_impermanent_loss",
//     description: "Calculate potential impermanent loss for liquidity provision strategies",
//     func: async (input: string) => {
//       const { tokenA, tokenB, initialPriceA, initialPriceB, currentPriceA, currentPriceB, lpAmount } = JSON.parse(input);
      
//       // Calculate impermanent loss
//       const priceRatio = (currentPriceA / currentPriceB) / (initialPriceA / initialPriceB);
//       const impermanentLoss = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
      
//       const analysis = {
//         impermanentLossPercentage: (impermanentLoss * 100).toFixed(2),
//         absoluteLoss: (Number(lpAmount) * Math.abs(impermanentLoss)).toString(),
//         recommendation: impermanentLoss > -0.05 ? "Consider maintaining position" : "Consider exiting position",
//         priceRatioChange: ((priceRatio - 1) * 100).toFixed(2)
//       };
      
//       return JSON.stringify(analysis);
//     }
//   }),

//   new DynamicTool({
//     name: "create_dca_strategy",
//     description: "Create and execute dollar-cost averaging strategies",
//     func: async (input: string) => {
//       const { token, totalAmount, frequency, duration } = JSON.parse(input);
      
//       const strategy = {
//         token,
//         amountPerInterval: (Number(totalAmount) / (duration / frequency)).toString(),
//         frequency,
//         duration,
//         nextExecutionTime: Date.now() + (frequency * 1000),
//         estimatedCompletionDate: new Date(Date.now() + duration * 1000).toISOString(),
//         status: "active"
//       };
      
//       return JSON.stringify(strategy);
//     }
//   })
// ];

// // Initialize the agent executor
// let agentExecutor: any;

// async function initializeAgent() {
//   if (!agentExecutor) {
//     agentExecutor = await initializeAgentExecutorWithOptions(
//       [...barukProtocolTools, ...advancedStrategyTools],
//       model,
//       {
//         agentType: "openai-functions",
//         verbose: true,
//         systemMessage: BARUK_SYSTEM_PROMPT,
//         maxIterations: 10,
//         earlyStoppingMethod: "generate",
//       }
//     );
//   }
//   return agentExecutor;
// }

// // Enhanced context management
// class BarukContextManager {
//   private userSessions: Map<string, any> = new Map();
  
//   getUserSession(userId: string) {
//     if (!this.userSessions.has(userId)) {
//       this.userSessions.set(userId, {
//         walletAddress: null,
//         riskTolerance: 5,
//         investmentGoals: [],
//         activeStrategies: [],
//         portfolioHistory: [],
//         preferences: {
//           autoCompound: true,
//           maxSlippage: "1.0",
//           gasOptimization: true
//         }
//       });
//     }
//     return this.userSessions.get(userId);
//   }
  
//   updateUserSession(userId: string, updates: any) {
//     const session = this.getUserSession(userId);
//     Object.assign(session, updates);
//     this.userSessions.set(userId, session);
//   }
// }

// const contextManager = new BarukContextManager();

// // Main API handler
// export async function POST(request: NextRequest) {
//   try {
//     const { message, userId, walletAddress, sessionId } = await request.json();
    
//     // Initialize agent if not already done
//     const agent = await initializeAgent();
    
//     // Get user context
//     const userSession = contextManager.getUserSession(userId || 'anonymous');
//     if (walletAddress) {
//       userSession.walletAddress = walletAddress;
//     }
    
//     // Enhanced message with context
//     const contextualMessage = `
// User Context:
// - Wallet Address: ${userSession.walletAddress || 'Not connected'}
// - Risk Tolerance: ${userSession.riskTolerance}/10
// - Active Strategies: ${userSession.activeStrategies.length}
// - Preferences: ${JSON.stringify(userSession.preferences)}

// User Message: ${message}

// Please provide comprehensive DeFi analysis and actionable recommendations. If executing transactions, always explain the strategy and expected outcomes.
//     `;
    
//     // Execute the agent
//     const response = await agent.invoke({
//       input: contextualMessage,
//       chat_history: [],
//     });
    
//     // Update user session with any relevant information from the response
//     if (response.output.includes('strategy') || response.output.includes('recommendation')) {
//       userSession.portfolioHistory.push({
//         timestamp: Date.now(),
//         action: 'ai_recommendation',
//         details: response.output.substring(0, 200) + '...'
//       });
//     }
    
//     return NextResponse.json({
//       success: true,
//       message: response.output,
//       sessionId,
//       userContext: {
//         strategies: userSession.activeStrategies.length,
//         riskTolerance: userSession.riskTolerance,
//         walletConnected: !!userSession.walletAddress
//       },
//       metadata: {
//         model: "Baruk AI Agent v2.0",
//         timestamp: new Date().toISOString(),
//         toolsUsed: response.intermediateSteps?.map((step: any) => step.action?.tool) || [],
//         executionTime: response.executionTime || "N/A"
//       }
//     });
    
//   } catch (error) {
//     console.error('Baruk AI Agent Error:', error);
    
//     return NextResponse.json({
//       success: false,
//       error: 'Failed to process request',
//       message: `Hello! My name is Baruk, your DeFi AI agent for the Sei ecosystem. I'm currently experiencing some technical difficulties, but I'm here to help you with:

// 🏦 **DeFi Operations:**
// - AMM trading and liquidity provision
// - Yield farming optimization
// - Lending and borrowing strategies

// 📊 **Advanced Analytics:**
// - Portfolio risk assessment
// - Cross-protocol yield comparisons
// - Arbitrage opportunity detection

// 🤖 **Automated Strategies:**
// - Smart rebalancing
// - Dollar-cost averaging
// - Liquidation monitoring

// Please try your request again, and I'll help you maximize your DeFi returns on Sei!`,
//       details: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 });
//   }
// }

// // GET endpoint for agent capabilities and status
// export async function GET() {
//   return NextResponse.json({
//     name: "Baruk DeFi AI Agent",
//     version: "2.0",
//     status: "operational",
//     capabilities: {
//       protocols: [
//         "Baruk AMM",
//         "Yield Farming",
//         "Lending Protocol",
//         "Limit Orders",
//         "Cross-DEX Arbitrage"
//       ],
//       strategies: [
//         "Yield Optimization",
//         "Portfolio Rebalancing",
//         "Risk Management",
//         "Liquidation Monitoring",
//         "DCA Strategies"
//       ],
//       analytics: [
//         "TVL Tracking",
//         "APY Analysis",
//         "Impermanent Loss Calculation",
//         "Risk Assessment",
//         "Market Analysis"
//       ]
//     },
//     contracts: {
//       network: "Sei Testnet",
//       governance: "0xcc649e2a60ceDE9F7Ac182EAfa2af06655e54F60",
//       router: "0xe605be74ba68fc255dB0156ab63c31b50b336D6B",
//       amm: "0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1",
//       yieldFarm: "0x1Ae8eC370795FCF21862Ba486fb44a5219Dea7Ce",
//       lending: "0x5197d95B4336f1EF6dd0fd62180101021A88E27b",
//       limitOrder: "0x3bDdc3fAbf58fDaA6fF62c95b944819cF625c0F4"
//     },
//     documentation: "https://baruk-protocol.gitbook.io/",
//     support: "hello@baruk.fi"
//   });
// }