import { useCallback } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, type Address, type Hash } from 'viem';
import { contractABIs, contractAddresses } from '../contractConfig';

// Types for better TypeScript support
interface PlaceOrderParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  targetPrice: string;
  deadline?: number; // Optional, defaults to 24 hours
  decimalsIn?: number;
  decimalsOut?: number;
}

interface ExecuteOrderParams {
  orderId: number;
  expectedPriceImpact?: number; // Optional, defaults to 1%
}

interface CancelOrderParams {
  orderId: number;
}

interface OrderInfo {
  id: bigint;
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  targetAmountOut: bigint;
  deadline: bigint;
  isActive: boolean;
}

interface UseBarukLimitOrderReturn {
  // Write contract functions
  placeOrder: ReturnType<typeof useWriteContract>['writeContract'];
  placeOrderAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  cancelOrder: ReturnType<typeof useWriteContract>['writeContract'];
  cancelOrderAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  executeOrder: ReturnType<typeof useWriteContract>['writeContract'];
  executeOrderAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  
  // Write transaction states
  isPlaceOrderPending: boolean;
  isCancelOrderPending: boolean;
  isExecuteOrderPending: boolean;
  
  // Write transaction errors
  placeOrderError: Error | null;
  cancelOrderError: Error | null;
  executeOrderError: Error | null;
  
  // Read contract data
  userOrders: readonly OrderInfo[] | undefined;
  orderCount: bigint | undefined;
  
  // Read contract loading states
  isUserOrdersLoading: boolean;
  isOrderCountLoading: boolean;
  
  // Read contract errors
  userOrdersError: Error | null;
  orderCountError: Error | null;
  
  // Helper functions
  placeLimitOrder: (params: PlaceOrderParams) => Promise<Hash>;
  executeOrderById: (params: ExecuteOrderParams) => Promise<Hash>;
  cancelOrderById: (params: CancelOrderParams) => Promise<Hash>;
  
  // Utility functions
  getOrderInfo: (orderId: number) => Promise<OrderInfo | null>;
  refreshUserOrders: () => void;
}

export function useBarukLimitOrder(userAddress?: Address): UseBarukLimitOrderReturn {
  // Write contract hooks
  const {
    writeContract: placeOrder,
    writeContractAsync: placeOrderAsync,
    isPending: isPlaceOrderPending,
    error: placeOrderError
  } = useWriteContract();
  
  const {
    writeContract: cancelOrder,
    writeContractAsync: cancelOrderAsync,
    isPending: isCancelOrderPending,
    error: cancelOrderError
  } = useWriteContract();
  
  const {
    writeContract: executeOrder,
    writeContractAsync: executeOrderAsync,
    isPending: isExecuteOrderPending,
    error: executeOrderError
  } = useWriteContract();

  // Read contract hooks
  const {
    data: userOrders,
    isLoading: isUserOrdersLoading,
    error: userOrdersError,
    refetch: refreshUserOrders
  } = useReadContract({
    address: contractAddresses.limitOrder,
    abi: contractABIs.limitOrder.abi,
    functionName: 'getUserOrders',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress)
    }
  }) as { 
    data: readonly OrderInfo[] | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };

  const {
    data: orderCount,
    isLoading: isOrderCountLoading,
    error: orderCountError
  } = useReadContract({
    address: contractAddresses.limitOrder,
    abi: contractABIs.limitOrder.abi,
    functionName: 'orderCount',
  }) as {
    data: bigint | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  // Individual order read hook (we'll use this in the helper function)
  const getOrderInfo = useCallback(async (orderId: number): Promise<OrderInfo | null> => {
    try {
      // This would typically be done through a separate useReadContract hook
      // or by using a wagmi action directly. For now, we'll simulate the call
      const orderData = await fetch(`/api/orders/${orderId}`).then(res => res.json());
      return orderData as OrderInfo;
    } catch (error) {
      console.error('Failed to fetch order info:', error);
      return null;
    }
  }, []);

  // Helper functions with useCallback for performance optimization
  const placeLimitOrder = useCallback(async (params: PlaceOrderParams): Promise<Hash> => {
    const { 
      tokenIn, 
      tokenOut, 
      amountIn, 
      targetPrice, 
      deadline,
      decimalsIn = 18,
      decimalsOut = 18
    } = params;
    
    // Validation
    if (!amountIn || isNaN(Number(amountIn))) {
      throw new Error('Invalid amount provided');
    }
    
    if (!targetPrice || isNaN(Number(targetPrice))) {
      throw new Error('Invalid target price provided');
    }
    
    try {
      const parsedAmountIn = parseUnits(amountIn, decimalsIn);
      const parsedTargetPrice = parseUnits(targetPrice, decimalsOut);
      
      // Calculate target amount out based on price and amount in
      const targetAmountOut = (parsedAmountIn * parsedTargetPrice) / parseUnits('1', decimalsIn);
      
      // Default deadline to 24 hours if not provided
      const orderDeadline = BigInt(Math.floor(Date.now() / 1000) + (deadline || 86400));
      
      return await placeOrderAsync({
        address: contractAddresses.limitOrder,
        abi: contractABIs.limitOrder.abi,
        functionName: 'placeOrder',
        args: [tokenIn, tokenOut, parsedAmountIn, targetAmountOut, orderDeadline],
      });
    } catch (error) {
      console.error('Place order transaction failed:', error);
      throw error;
    }
  }, [placeOrderAsync]);

  const executeOrderById = useCallback(async (params: ExecuteOrderParams): Promise<Hash> => {
    const { orderId, expectedPriceImpact = 0.01 } = params;
    
    if (orderId < 0 || !Number.isInteger(orderId)) {
      throw new Error('Invalid order ID provided');
    }
    
    if (expectedPriceImpact < 0 || expectedPriceImpact > 1) {
      throw new Error('Price impact must be between 0 and 1');
    }
    
    try {
      // Get order information first
      const orderData = await getOrderInfo(orderId);
      if (!orderData || !orderData.isActive) {
        throw new Error('Order not found or not active');
      }
      
      // Calculate minimum amount out with slippage protection
      const slippage = 1 - expectedPriceImpact;
      const minAmountOut = (orderData.targetAmountOut * BigInt(Math.floor(slippage * 1e18))) / BigInt(1e18);
      
      return await executeOrderAsync({
        address: contractAddresses.limitOrder,
        abi: contractABIs.limitOrder.abi,
        functionName: 'executeOrder',
        args: [BigInt(orderId), minAmountOut],
      });
    } catch (error) {
      console.error('Execute order transaction failed:', error);
      throw error;
    }
  }, [executeOrderAsync, getOrderInfo]);

  const cancelOrderById = useCallback(async (params: CancelOrderParams): Promise<Hash> => {
    const { orderId } = params;
    
    if (orderId < 0 || !Number.isInteger(orderId)) {
      throw new Error('Invalid order ID provided');
    }
    
    try {
      return await cancelOrderAsync({
        address: contractAddresses.limitOrder,
        abi: contractABIs.limitOrder.abi,
        functionName: 'cancelOrder',
        args: [BigInt(orderId)],
      });
    } catch (error) {
      console.error('Cancel order transaction failed:', error);
      throw error;
    }
  }, [cancelOrderAsync]);

  return {
    // Write contract functions
    placeOrder,
    placeOrderAsync,
    cancelOrder,
    cancelOrderAsync,
    executeOrder,
    executeOrderAsync,
    
    // Write transaction states
    isPlaceOrderPending,
    isCancelOrderPending,
    isExecuteOrderPending,
    
    // Write transaction errors
    placeOrderError,
    cancelOrderError,
    executeOrderError,
    
    // Read contract data
    userOrders,
    orderCount,
    
    // Read contract loading states
    isUserOrdersLoading,
    isOrderCountLoading,
    
    // Read contract errors
    userOrdersError,
    orderCountError,
    
    // Helper functions
    placeLimitOrder,
    executeOrderById,
    cancelOrderById,
    
    // Utility functions
    getOrderInfo,
    refreshUserOrders,
  };
}