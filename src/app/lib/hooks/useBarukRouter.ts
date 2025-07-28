/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, type Address, type Hash } from 'viem';
import { contractABIs, contractAddresses } from '../contractConfig';

// Types for better TypeScript support
interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amount: string;
  slippage: number; // Percentage (e.g., 0.5 for 0.5%)
  recipient: Address;
  decimalsIn?: number;
  decimalsOut?: number;
  deadline?: number; // Optional, defaults to 20 minutes
}

interface SwapExactOutParams {
  tokenIn: Address;
  tokenOut: Address;
  amountOut: string;
  maxAmountIn: string;
  recipient: Address;
  decimalsIn?: number;
  decimalsOut?: number;
  deadline?: number;
}

interface AddLiquidityParams {
  tokenA: Address;
  tokenB: Address;
  amountA: string;
  amountB: string;
  slippage: number; // Percentage
  recipient: Address;
  decimalsA?: number;
  decimalsB?: number;
  deadline?: number;
}

interface RemoveLiquidityParams {
  tokenA: Address;
  tokenB: Address;
  liquidity: string;
  slippage: number;
  recipient: Address;
  decimalsA?: number;
  decimalsB?: number;
  deadline?: number;
}

interface GetAmountsParams {
  amount: string;
  path: Address[];
  decimals?: number;
}

interface UseBarukRouterReturn {
  // Write contract functions
  swapExactTokensForTokens: ReturnType<typeof useWriteContract>['writeContract'];
  swapExactTokensForTokensAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  swapTokensForExactTokens: ReturnType<typeof useWriteContract>['writeContract'];
  swapTokensForExactTokensAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  addLiquidity: ReturnType<typeof useWriteContract>['writeContract'];
  addLiquidityAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  removeLiquidity: ReturnType<typeof useWriteContract>['writeContract'];
  removeLiquidityAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  
  // Write transaction states
  isSwapExactPending: boolean;
  isSwapForExactPending: boolean;
  isAddLiquidityPending: boolean;
  isRemoveLiquidityPending: boolean;
  
  // Write transaction errors
  swapExactError: Error | null;
  swapForExactError: Error | null;
  addLiquidityError: Error | null;
  removeLiquidityError: Error | null;
  
  // Helper functions
  swapExactIn: (params: SwapParams) => Promise<Hash>;
  swapExactOut: (params: SwapExactOutParams) => Promise<Hash>;
  addLiquidityHelper: (params: AddLiquidityParams) => Promise<Hash>;
  removeLiquidityHelper: (params: RemoveLiquidityParams) => Promise<Hash>;
  
  // Quote functions (utility)
  getAmountsOut: (params: GetAmountsParams) => Promise<readonly bigint[] | undefined>;
  getAmountsIn: (params: GetAmountsParams) => Promise<readonly bigint[] | undefined>;
  
  // Price calculation utilities
  calculateMinAmountOut: (amountIn: string, slippage: number, decimals?: number) => bigint;
  calculateMaxAmountIn: (amountOut: string, slippage: number, decimals?: number) => bigint;
  calculateDeadline: (minutes?: number) => bigint;
}

export function useBarukRouter(): UseBarukRouterReturn {
  // Write contract hooks for swaps
  const {
    writeContract: swapExactTokensForTokens,
    writeContractAsync: swapExactTokensForTokensAsync,
    isPending: isSwapExactPending,
    error: swapExactError
  } = useWriteContract();
  
  const {
    writeContract: swapTokensForExactTokens,
    writeContractAsync: swapTokensForExactTokensAsync,
    isPending: isSwapForExactPending,
    error: swapForExactError
  } = useWriteContract();
  
  // Write contract hooks for liquidity
  const {
    writeContract: addLiquidity,
    writeContractAsync: addLiquidityAsync,
    isPending: isAddLiquidityPending,
    error: addLiquidityError
  } = useWriteContract();
  
  const {
    writeContract: removeLiquidity,
    writeContractAsync: removeLiquidityAsync,
    isPending: isRemoveLiquidityPending,
    error: removeLiquidityError
  } = useWriteContract();

  // Utility functions
  const calculateMinAmountOut = useCallback((
    amountIn: string, 
    slippage: number, 
    decimals = 18
  ): bigint => {
    if (!amountIn || isNaN(Number(amountIn)) || slippage < 0 || slippage > 100) {
      throw new Error('Invalid parameters for min amount calculation');
    }
    
    const parsedAmountIn = parseUnits(amountIn, decimals);
    const slippageMultiplier = 1 - (slippage / 100);
    return (parsedAmountIn * BigInt(Math.floor(slippageMultiplier * 1e18))) / BigInt(1e18);
  }, []);

  const calculateMaxAmountIn = useCallback((
    amountOut: string, 
    slippage: number, 
    decimals = 18
  ): bigint => {
    if (!amountOut || isNaN(Number(amountOut)) || slippage < 0 || slippage > 100) {
      throw new Error('Invalid parameters for max amount calculation');
    }
    
    const parsedAmountOut = parseUnits(amountOut, decimals);
    const slippageMultiplier = 1 + (slippage / 100);
    return (parsedAmountOut * BigInt(Math.floor(slippageMultiplier * 1e18))) / BigInt(1e18);
  }, []);

  const calculateDeadline = useCallback((minutes = 20): bigint => {
    return BigInt(Math.floor(Date.now() / 1000) + (minutes * 60));
  }, []);

  // Quote functions using direct contract calls
  const getAmountsOut = useCallback(async (params: GetAmountsParams): Promise<readonly bigint[] | undefined> => {
    const { amount, path, decimals = 18 } = params;
    
    if (!amount || !path || path.length < 2) {
      throw new Error('Invalid parameters for getAmountsOut');
    }
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      
      // This would need to be implemented using wagmi's readContract action
      // For now, we'll return undefined and suggest using a separate read hook
      console.warn('getAmountsOut should be implemented using a separate useReadContract hook');
      return undefined;
    } catch (error) {
      console.error('Failed to get amounts out:', error);
      return undefined;
    }
  }, []);

  const getAmountsIn = useCallback(async (params: GetAmountsParams): Promise<readonly bigint[] | undefined> => {
    const { amount, path, decimals = 18 } = params;
    
    if (!amount || !path || path.length < 2) {
      throw new Error('Invalid parameters for getAmountsIn');
    }
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      
      // This would need to be implemented using wagmi's readContract action
      console.warn('getAmountsIn should be implemented using a separate useReadContract hook');
      return undefined;
    } catch (error) {
      console.error('Failed to get amounts in:', error);
      return undefined;
    }
  }, []);

  // Helper functions with proper error handling and validation
  const swapExactIn = useCallback(async (params: SwapParams): Promise<Hash> => {
    const { 
      tokenIn, 
      tokenOut, 
      amount, 
      slippage, 
      recipient, 
      decimalsIn = 18,
      deadline
    } = params;
    
    // Validation
    if (!amount || isNaN(Number(amount))) {
      throw new Error('Invalid amount provided');
    }
    
    if (slippage < 0 || slippage > 100) {
      throw new Error('Slippage must be between 0 and 100');
    }
    
    if (!tokenIn || !tokenOut || !recipient) {
      throw new Error('Missing required addresses');
    }
    
    try {
      const parsedAmountIn = parseUnits(amount, decimalsIn);
      const minAmountOut = calculateMinAmountOut(amount, slippage, decimalsIn);
      const transactionDeadline = calculateDeadline(deadline);
      
      return await swapExactTokensForTokensAsync({
        address: contractAddresses.router,
        abi: contractABIs.router.abi,
        functionName: 'swapExactTokensForTokens',
        args: [
          parsedAmountIn,
          minAmountOut,
          [tokenIn, tokenOut],
          recipient,
          transactionDeadline
        ],
      });
    } catch (error) {
      console.error('Swap exact in transaction failed:', error);
      throw error;
    }
  }, [swapExactTokensForTokensAsync, calculateMinAmountOut, calculateDeadline]);

  const swapExactOut = useCallback(async (params: SwapExactOutParams): Promise<Hash> => {
    const { 
      tokenIn, 
      tokenOut, 
      amountOut, 
      maxAmountIn, 
      recipient, 
      decimalsIn = 18,
      decimalsOut = 18,
      deadline
    } = params;
    
    // Validation
    if (!amountOut || !maxAmountIn || isNaN(Number(amountOut)) || isNaN(Number(maxAmountIn))) {
      throw new Error('Invalid amounts provided');
    }
    
    if (!tokenIn || !tokenOut || !recipient) {
      throw new Error('Missing required addresses');
    }
    
    try {
      const parsedAmountOut = parseUnits(amountOut, decimalsOut);
      const parsedMaxAmountIn = parseUnits(maxAmountIn, decimalsIn);
      const transactionDeadline = calculateDeadline(deadline);
      
      return await swapTokensForExactTokensAsync({
        address: contractAddresses.router,
        abi: contractABIs.router.abi,
        functionName: 'swapTokensForExactTokens',
        args: [
          parsedAmountOut,
          parsedMaxAmountIn,
          [tokenIn, tokenOut],
          recipient,
          transactionDeadline
        ],
      });
    } catch (error) {
      console.error('Swap exact out transaction failed:', error);
      throw error;
    }
  }, [swapTokensForExactTokensAsync, calculateDeadline]);

  const addLiquidityHelper = useCallback(async (params: AddLiquidityParams): Promise<Hash> => {
    const { 
      tokenA, 
      tokenB, 
      amountA, 
      amountB, 
      slippage, 
      recipient,
      decimalsA = 18,
      decimalsB = 18,
      deadline
    } = params;
    
    // Validation
    if (!amountA || !amountB || isNaN(Number(amountA)) || isNaN(Number(amountB))) {
      throw new Error('Invalid amounts provided');
    }
    
    if (slippage < 0 || slippage > 100) {
      throw new Error('Slippage must be between 0 and 100');
    }
    
    if (!tokenA || !tokenB || !recipient) {
      throw new Error('Missing required addresses');
    }
    
    try {
      const amountADesired = parseUnits(amountA, decimalsA);
      const amountBDesired = parseUnits(amountB, decimalsB);
      const amountAMin = calculateMinAmountOut(amountA, slippage, decimalsA);
      const amountBMin = calculateMinAmountOut(amountB, slippage, decimalsB);
      const transactionDeadline = calculateDeadline(deadline);
      
      return await addLiquidityAsync({
        address: contractAddresses.router,
        abi: contractABIs.router.abi,
        functionName: 'addLiquidity',
        args: [
          tokenA,
          tokenB,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          recipient,
          transactionDeadline,
        ],
      });
    } catch (error) {
      console.error('Add liquidity transaction failed:', error);
      throw error;
    }
  }, [addLiquidityAsync, calculateMinAmountOut, calculateDeadline]);

  const removeLiquidityHelper = useCallback(async (params: RemoveLiquidityParams): Promise<Hash> => {
    const { 
      tokenA, 
      tokenB, 
      liquidity, 
      slippage, 
      recipient,
      decimalsA = 18,
      decimalsB = 18,
      deadline
    } = params;
    
    // Validation
    if (!liquidity || isNaN(Number(liquidity))) {
      throw new Error('Invalid liquidity amount provided');
    }
    
    if (slippage < 0 || slippage > 100) {
      throw new Error('Slippage must be between 0 and 100');
    }
    
    if (!tokenA || !tokenB || !recipient) {
      throw new Error('Missing required addresses');
    }
    
    try {
      const parsedLiquidity = parseUnits(liquidity, 18); // LP tokens typically have 18 decimals
      
      // For remove liquidity, we need to calculate expected amounts first
      // This would typically require a quote from the contract
      // For now, we'll use 0 as minimum amounts and let slippage be handled by the user
      const amountAMin = BigInt(0); // Should be calculated based on current pool state
      const amountBMin = BigInt(0); // Should be calculated based on current pool state
      const transactionDeadline = calculateDeadline(deadline);
      
      return await removeLiquidityAsync({
        address: contractAddresses.router,
        abi: contractABIs.router.abi,
        functionName: 'removeLiquidity',
        args: [
          tokenA,
          tokenB,
          parsedLiquidity,
          amountAMin,
          amountBMin,
          recipient,
          transactionDeadline,
        ],
      });
    } catch (error) {
      console.error('Remove liquidity transaction failed:', error);
      throw error;
    }
  }, [removeLiquidityAsync, calculateDeadline]);

  return {
    // Write contract functions
    swapExactTokensForTokens,
    swapExactTokensForTokensAsync,
    swapTokensForExactTokens,
    swapTokensForExactTokensAsync,
    addLiquidity,
    addLiquidityAsync,
    removeLiquidity,
    removeLiquidityAsync,
    
    // Write transaction states
    isSwapExactPending,
    isSwapForExactPending,
    isAddLiquidityPending,
    isRemoveLiquidityPending,
    
    // Write transaction errors
    swapExactError,
    swapForExactError,
    addLiquidityError,
    removeLiquidityError,
    
    // Helper functions
    swapExactIn,
    swapExactOut,
    addLiquidityHelper,
    removeLiquidityHelper,
    
    // Quote functions
    getAmountsOut,
    getAmountsIn,
    
    // Utility functions
    calculateMinAmountOut,
    calculateMaxAmountIn,
    calculateDeadline,
  };
}