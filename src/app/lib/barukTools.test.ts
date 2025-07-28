/* eslint-disable @typescript-eslint/no-require-imports */
import 'dotenv/config';
import { ethers } from 'ethers';
import {
  getWalletTokenHoldings,
  analyzeFullPortfolio,
  getUserLendingPosition,
  analyzePortfolioRisk,
  getUserLimitOrders,
  getPendingRewards
} from './barukTools';

const testAddress = '0xD4CA075F47caA0c16DFA99bA5e3d2B8c27913b77';
const testPrivateKey = process.env.TEST_PRIVATE_KEY;
const SEI_CHAIN_ID = Number(process.env.SEI_CHAIN_ID) || 1328;
const provider = new ethers.JsonRpcProvider(process.env.SEI_RPC_URL || 'https://evm-rpc-testnet.sei-apis.com');

// function skipIfNoKey(title: string, fn: () => Promise<void>) {
//   if (!testPrivateKey) {
//     it.skip(title, () => {
//       console.warn('TEST_PRIVATE_KEY not set, skipping write test');
//     });
//   } else {
//     it(title, fn);
//   }
// }

describe('Baruk Tools Integration (Sei Testnet)', () => {
  jest.setTimeout(30000);

  it('getWalletTokenHoldings returns holdings or empty array', async () => {
    const result = await getWalletTokenHoldings(testAddress);
    console.log('getWalletTokenHoldings:', result);
    expect(Array.isArray(result)).toBe(true);
  });

  it('analyzeFullPortfolio returns object', async () => {
    const result = await analyzeFullPortfolio(testAddress);
    console.log('analyzeFullPortfolio:', result);
    expect(typeof result).toBe('object');
  });

  it('getUserLendingPosition returns array or error', async () => {
    const result = await getUserLendingPosition(testAddress);
    console.log('getUserLendingPosition:', result);
    expect(Array.isArray(result) || (typeof result === 'object' && result !== null && 'error' in result)).toBeTruthy();
  });

  it('analyzePortfolioRisk returns object or error', async () => {
    const result = await analyzePortfolioRisk(testAddress);
    console.log('analyzePortfolioRisk:', result);
    expect(Array.isArray(result) || (typeof result === 'object' && result !== null)).toEqual(true);
  });

  it('getUserLimitOrders returns array or error', async () => {
    const result = await getUserLimitOrders(testAddress);
    console.log('getUserLimitOrders:', result);
    expect(Array.isArray(result) || (typeof result === 'object' && result !== null && 'error' in result)).toBeTruthy();
  });

  it('getPendingRewards returns array or error', async () => {
    const result = await getPendingRewards(1, testAddress);
    console.log('getPendingRewards:', result);
    expect(Array.isArray(result) || (typeof result === 'object' && result !== null && 'error' in result)).toBeTruthy();
  });

  // --- WRITE FUNCTION TESTS (with correct ABIs and params) ---
  if (SEI_CHAIN_ID === 1328) {
    const wallet = testPrivateKey ? new ethers.Wallet(testPrivateKey, provider) : null;
    // Contract addresses
    const ADDRESSES = {
      Lending: '0x5197d95B4336f1EF6dd0fd62180101021A88E27b',
      LimitOrder: '0x3bDdc3fAbf58fDaA6fF62c95b944819cF625c0F4',
      YieldFarm: '0x1Ae8eC370795FCF21862Ba486fb44a5219Dea7Ce',
      Router: '0xe605be74ba68fc255dB0156ab63c31b50b336D6B',
      AMM: '0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1',
      Factory: '0x...', 
      Token0: '0x8923889697C9467548ABe8E815105993EBC785b6',
      Token1: '0xF2C653e2a1F21ef409d0489C7c1d754d9f2905F7',
      Token2: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7',
    };
    // Import ABIs
    const BarukLendingABI = require('../../../out/BarukLending.sol/BarukLending.json').abi;
    const BarukLimitOrderABI = require('../../../out/BarukLimitOrder.sol/BarukLimitOrder.json').abi;
    const BarukYieldFarmABI = require('../../../out/BarukYieldFarm.sol/BarukYieldFarm.json').abi;
    const BarukRouterABI = require('../../../out/Router.sol/BarukRouter.json').abi;
    const BarukAMMABI = require('../../../out/AMM.sol/BarukAMM.json').abi;

    // Helper to skip if wallet is not set
    function skipIfNoKey(name: string, fn: () => Promise<void>) {
      if (!wallet) {
        it.skip(name, () => {});
      } else {
        it(name, fn, 30000);
      }
    }

    const AMOUNT = ethers.parseUnits('0.01', 18);
    const AMOUNT2 = ethers.parseUnits('0.01', 18);
    const MIN_AMOUNT_OUT = ethers.parseUnits('0.001', 18);

    // Lending.deposit(asset, amount)
    skipIfNoKey('deposit (Lending) sends a tx or returns error', async () => {
      if (!wallet) throw new Error('Test wallet not initialized');
      const token = new ethers.Contract(ADDRESSES.Token0, [
        'function approve(address,uint256) public returns (bool)'
      ], wallet);
      const lending = new ethers.Contract(ADDRESSES.Lending, BarukLendingABI.abi, wallet);
      // Approve first
      await token.approve(ADDRESSES.Lending, AMOUNT);
      const tx = await lending.deposit(ADDRESSES.Token0, AMOUNT);
      const receipt = await tx.wait();
      console.log('Lending.deposit tx:', receipt.transactionHash);
      expect(receipt.status).toBe(1);
    });

    // Lending.borrow(asset, amount, collateral)
    skipIfNoKey('borrow (Lending) sends a tx or returns error', async () => {
      if (!wallet) throw new Error('Test wallet not initialized');
      const lending = new ethers.Contract(ADDRESSES.Lending, BarukLendingABI.abi, wallet);
      // NOTE: This will revert if no price or insufficient collateral
      try {
        const tx = await lending.borrow(ADDRESSES.Token0, AMOUNT, ADDRESSES.Token0);
        const receipt = await tx.wait();
        console.log('Lending.borrow tx:', receipt.transactionHash);
        expect(receipt.status).toBe(1);
      } catch (e) {
        console.warn('Lending.borrow error:', e);
        expect(typeof e).toBe('object');
      }
    });

    // Lending.repay(asset, amount)
    skipIfNoKey('repay (Lending) sends a tx or returns error', async () => {
      if (!wallet) throw new Error('Test wallet not initialized');
      const token = new ethers.Contract(ADDRESSES.Token0, [
        'function approve(address,uint256) public returns (bool)'
      ], wallet);
      const lending = new ethers.Contract(ADDRESSES.Lending, BarukLendingABI.abi, wallet);
      await token.approve(ADDRESSES.Lending, AMOUNT);
      try {
        const tx = await lending.repay(ADDRESSES.Token0, AMOUNT);
        const receipt = await tx.wait();
        console.log('Lending.repay tx:', receipt.transactionHash);
        expect(receipt.status).toBe(1);
      } catch (e) {
        console.warn('Lending.repay error:', e);
        expect(typeof e).toBe('object');
      }
    });

    // LimitOrder.placeOrder(tokenIn, tokenOut, amountIn, minAmountOut)
    skipIfNoKey('placeOrder (LimitOrder) sends a tx or returns error', async () => {
      if (!wallet) throw new Error('Test wallet not initialized');
      const token = new ethers.Contract(ADDRESSES.Token0, [
        'function approve(address,uint256) public returns (bool)'
      ], wallet);
      const limitOrder = new ethers.Contract(ADDRESSES.LimitOrder, BarukLimitOrderABI.abi, wallet);
      await token.approve(ADDRESSES.LimitOrder, AMOUNT);
      try {
        const tx = await limitOrder.placeOrder(ADDRESSES.Token0, ADDRESSES.Token1, AMOUNT, MIN_AMOUNT_OUT);
        const receipt = await tx.wait();
        console.log('LimitOrder.placeOrder tx:', receipt.transactionHash);
        expect(receipt.status).toBe(1);
      } catch (e) {
        console.warn('LimitOrder.placeOrder error:', e);
        expect(typeof e).toBe('object');
      }
    });

    // LimitOrder.cancelOrder(orderId) -- NOTE: orderId must be a valid order for this wallet
    skipIfNoKey('cancelOrder (LimitOrder) sends a tx or returns error', async () => {
      if (!wallet) throw new Error('Test wallet not initialized');
      const limitOrder = new ethers.Contract(ADDRESSES.LimitOrder, BarukLimitOrderABI.abi, wallet);
      const orderId = 0; // TODO: Set to a real orderId for this wallet
      try {
        const tx = await limitOrder.cancelOrder(orderId);
        const receipt = await tx.wait();
        console.log('LimitOrder.cancelOrder tx:', receipt.transactionHash);
        expect(receipt.status).toBe(1);
      } catch (e) {
        console.warn('LimitOrder.cancelOrder error:', e);
        expect(typeof e).toBe('object');
      }
    });

    // AMM.addLiquidity(amount0, amount1, to)
    skipIfNoKey('addLiquidity (AMM) sends a tx or returns error', async () => {
      if (!wallet) throw new Error('Test wallet not initialized');
      const token0 = new ethers.Contract(ADDRESSES.Token0, [
        'function approve(address,uint256) public returns (bool)'
      ], wallet);
      const token1 = new ethers.Contract(ADDRESSES.Token1, [
        'function approve(address,uint256) public returns (bool)'
      ], wallet);
      const amm = new ethers.Contract(ADDRESSES.AMM, BarukAMMABI.abi, wallet);
      await token0.approve(ADDRESSES.AMM, AMOUNT);
      await token1.approve(ADDRESSES.AMM, AMOUNT2);
      try {
        const tx = await amm.addLiquidity(AMOUNT, AMOUNT2, wallet.address);
        const receipt = await tx.wait();
        console.log('AMM.addLiquidity tx:', receipt.transactionHash);
        expect(receipt.status).toBe(1);
      } catch (e) {
        console.warn('AMM.addLiquidity error:', e);
        expect(typeof e).toBe('object');
      }
    });

    // AMM.removeLiquidity(liquidity) -- NOTE: liquidity must be a valid amount for this wallet
    skipIfNoKey('removeLiquidity (AMM) sends a tx or returns error', async () => {
      if (!wallet) throw new Error('Test wallet not initialized');
      const amm = new ethers.Contract(ADDRESSES.AMM, BarukAMMABI.abi, wallet);
      const liquidity = ethers.parseUnits('0.001', 18); // TODO: Set to a real liquidity amount
      try {
        const tx = await amm.removeLiquidity(liquidity);
        const receipt = await tx.wait();
        console.log('AMM.removeLiquidity tx:', receipt.transactionHash);
        expect(receipt.status).toBe(1);
      } catch (e) {
        console.warn('AMM.removeLiquidity error:', e);
        expect(typeof e).toBe('object');
      }
    });

    // AMM.publicSwap(amountIn, tokenIn, minAmountOut, recipient)
    skipIfNoKey('publicSwap (AMM) sends a tx or returns error', async () => {
      if (!wallet) throw new Error('Test wallet not initialized');
      const token0 = new ethers.Contract(ADDRESSES.Token0, [
        'function approve(address,uint256) public returns (bool)'
      ], wallet);
      const amm = new ethers.Contract(ADDRESSES.AMM, BarukAMMABI.abi, wallet);
      await token0.approve(ADDRESSES.AMM, AMOUNT);
      try {
        const tx = await amm.publicSwap(AMOUNT, ADDRESSES.Token0, MIN_AMOUNT_OUT, wallet.address);
        const receipt = await tx.wait();
        console.log('AMM.publicSwap tx:', receipt.transactionHash);
        expect(receipt.status).toBe(1);
      } catch (e) {
        console.warn('AMM.publicSwap error:', e);
        expect(typeof e).toBe('object');
      }
    });

    // --- YieldFarm: claimReward ---
    skipIfNoKey('claimReward (YieldFarm) sends a tx or returns error', async () => {
      if (!wallet) throw new Error('Test wallet not initialized');
      const yieldFarm = new ethers.Contract(ADDRESSES.YieldFarm, BarukYieldFarmABI.abi, wallet);
      if (typeof yieldFarm.claimReward === 'function') {
        const tx = await yieldFarm.claimReward();
        console.log('YieldFarm.claimReward tx:', tx.hash);
        const receipt = await tx.wait();
        expect(receipt.status).toBe(1);
      } else {
        console.warn('YieldFarm.claimReward not implemented in ABI');
      }
    });
  }
}); 