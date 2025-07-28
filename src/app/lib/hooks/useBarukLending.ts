import { useCallback } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, type Address, type Hash } from 'viem';
import { contractABIs, contractAddresses } from '../contractConfig';


interface DepositParams {
  token: Address;
  amount: string;
  decimals?: number;
}

interface BorrowParams {
  token: Address;
  amount: string;
  decimals?: number;
}

interface DepositAndBorrowParams {
  collateralToken: Address;
  borrowToken: Address;
  depositAmount: string;
  borrowAmount: string;
  decimals?: number;
}

interface RepayParams {
  token: Address;
  amount: string;
  decimals?: number;
}

interface WithdrawParams {
  token: Address;
  amount: string;
  decimals?: number;
}

interface LiquidateParams {
  user: Address;
  collateralToken: Address;
  debtToken: Address;
  debtToCover: string;
  decimals?: number;
}

interface UseBarukLendingReturn {
  // Write contract functions
  deposit: ReturnType<typeof useWriteContract>['writeContract'];
  depositAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  borrow: ReturnType<typeof useWriteContract>['writeContract'];
  borrowAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  depositAndBorrow: ReturnType<typeof useWriteContract>['writeContract'];
  depositAndBorrowAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  repay: ReturnType<typeof useWriteContract>['writeContract'];
  repayAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  withdraw: ReturnType<typeof useWriteContract>['writeContract'];
  withdrawAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  liquidate: ReturnType<typeof useWriteContract>['writeContract'];
  liquidateAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  
  // Write transaction states
  isDepositPending: boolean;
  isBorrowPending: boolean;
  isDepositAndBorrowPending: boolean;
  isRepayPending: boolean;
  isWithdrawPending: boolean;
  isLiquidatePending: boolean;
  
  // Write transaction errors
  depositError: Error | null;
  borrowError: Error | null;
  depositAndBorrowError: Error | null;
  repayError: Error | null;
  withdrawError: Error | null;
  liquidateError: Error | null;
  
  // Read contract data
  maxBorrow: bigint | undefined;
  liquidationPrice: bigint | undefined;
  healthFactor: bigint | undefined;
  
  // Read contract loading states
  isMaxBorrowLoading: boolean;
  isLiquidationPriceLoading: boolean;
  isHealthFactorLoading: boolean;
  
  // Read contract errors
  maxBorrowError: Error | null;
  liquidationPriceError: Error | null;
  healthFactorError: Error | null;
  
  // Helper functions with proper error handling
  depositWithAmount: (params: DepositParams) => Promise<Hash>;
  borrowWithAmount: (params: BorrowParams) => Promise<Hash>;
  depositAndBorrowWithAmounts: (params: DepositAndBorrowParams) => Promise<Hash>;
  repayWithAmount: (params: RepayParams) => Promise<Hash>;
  withdrawWithAmount: (params: WithdrawParams) => Promise<Hash>;
  liquidateWithAmount: (params: LiquidateParams) => Promise<Hash>;
}

export function useBarukLending(userAddress?: Address): UseBarukLendingReturn {
  // Write contract hooks
  const {
    writeContract: deposit,
    writeContractAsync: depositAsync,
    isPending: isDepositPending,
    error: depositError
  } = useWriteContract();
  
  const {
    writeContract: borrow,
    writeContractAsync: borrowAsync,
    isPending: isBorrowPending,
    error: borrowError
  } = useWriteContract();
  
  const {
    writeContract: depositAndBorrow,
    writeContractAsync: depositAndBorrowAsync,
    isPending: isDepositAndBorrowPending,
    error: depositAndBorrowError
  } = useWriteContract();
  
  const {
    writeContract: repay,
    writeContractAsync: repayAsync,
    isPending: isRepayPending,
    error: repayError
  } = useWriteContract();
  
  const {
    writeContract: withdraw,
    writeContractAsync: withdrawAsync,
    isPending: isWithdrawPending,
    error: withdrawError
  } = useWriteContract();
  
  const {
    writeContract: liquidate,
    writeContractAsync: liquidateAsync,
    isPending: isLiquidatePending,
    error: liquidateError
  } = useWriteContract();

  // Read contract hooks - only call when user address is available
  const {
    data: maxBorrow,
    isLoading: isMaxBorrowLoading,
    error: maxBorrowError
  } = useReadContract({
    address: contractAddresses.lending,
    abi: contractABIs.lending.abi,
    functionName: 'getMaxBorrow',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress)
    }
  }) as { data: bigint | undefined; isLoading: boolean; error: Error | null };

  const {
    data: liquidationPrice,
    isLoading: isLiquidationPriceLoading,
    error: liquidationPriceError
  } = useReadContract({
    address: contractAddresses.lending,
    abi: contractABIs.lending.abi,
    functionName: 'getLiquidationPrice',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress)
    }
  }) as { data: bigint | undefined; isLoading: boolean; error: Error | null };

  const {
    data: healthFactor,
    isLoading: isHealthFactorLoading,
    error: healthFactorError
  } = useReadContract({
    address: contractAddresses.lending,
    abi: contractABIs.lending.abi,
    functionName: 'getHealthFactor',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress)
    }
  }) as { data: bigint | undefined; isLoading: boolean; error: Error | null };

  // Helper functions with useCallback for performance optimization
  const depositWithAmount = useCallback(async (params: DepositParams): Promise<Hash> => {
    const { token, amount, decimals = 18 } = params;
    
    if (!amount || isNaN(Number(amount))) {
      throw new Error('Invalid amount provided');
    }
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      return await depositAsync({
        address: contractAddresses.lending,
        abi: contractABIs.lending.abi,
        functionName: 'deposit',
        args: [token, parsedAmount],
      });
    } catch (error) {
      console.error('Deposit transaction failed:', error);
      throw error;
    }
  }, [depositAsync]);

  const borrowWithAmount = useCallback(async (params: BorrowParams): Promise<Hash> => {
    const { token, amount, decimals = 18 } = params;
    
    if (!amount || isNaN(Number(amount))) {
      throw new Error('Invalid amount provided');
    }
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      return await borrowAsync({
        address: contractAddresses.lending,
        abi: contractABIs.lending.abi,
        functionName: 'borrow',
        args: [token, parsedAmount],
      });
    } catch (error) {
      console.error('Borrow transaction failed:', error);
      throw error;
    }
  }, [borrowAsync]);

  const depositAndBorrowWithAmounts = useCallback(async (params: DepositAndBorrowParams): Promise<Hash> => {
    const { collateralToken, borrowToken, depositAmount, borrowAmount, decimals = 18 } = params;
    
    if (!depositAmount || !borrowAmount || isNaN(Number(depositAmount)) || isNaN(Number(borrowAmount))) {
      throw new Error('Invalid amounts provided');
    }
    
    try {
      const parsedDepositAmount = parseUnits(depositAmount, decimals);
      const parsedBorrowAmount = parseUnits(borrowAmount, decimals);
      
      return await depositAndBorrowAsync({
        address: contractAddresses.lending,
        abi: contractABIs.lending.abi,
        functionName: 'depositAndBorrow',
        args: [collateralToken, parsedDepositAmount, borrowToken, parsedBorrowAmount],
      });
    } catch (error) {
      console.error('Deposit and borrow transaction failed:', error);
      throw error;
    }
  }, [depositAndBorrowAsync]);

  const repayWithAmount = useCallback(async (params: RepayParams): Promise<Hash> => {
    const { token, amount, decimals = 18 } = params;
    
    if (!amount || isNaN(Number(amount))) {
      throw new Error('Invalid amount provided');
    }
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      return await repayAsync({
        address: contractAddresses.lending,
        abi: contractABIs.lending.abi,
        functionName: 'repay',
        args: [token, parsedAmount],
      });
    } catch (error) {
      console.error('Repay transaction failed:', error);
      throw error;
    }
  }, [repayAsync]);

  const withdrawWithAmount = useCallback(async (params: WithdrawParams): Promise<Hash> => {
    const { token, amount, decimals = 18 } = params;
    
    if (!amount || isNaN(Number(amount))) {
      throw new Error('Invalid amount provided');
    }
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      return await withdrawAsync({
        address: contractAddresses.lending,
        abi: contractABIs.lending.abi,
        functionName: 'withdraw',
        args: [token, parsedAmount],
      });
    } catch (error) {
      console.error('Withdraw transaction failed:', error);
      throw error;
    }
  }, [withdrawAsync]);

  const liquidateWithAmount = useCallback(async (params: LiquidateParams): Promise<Hash> => {
    const { user, collateralToken, debtToken, debtToCover, decimals = 18 } = params;
    
    if (!debtToCover || isNaN(Number(debtToCover))) {
      throw new Error('Invalid debt amount provided');
    }
    
    try {
      const parsedDebtToCover = parseUnits(debtToCover, decimals);
      return await liquidateAsync({
        address: contractAddresses.lending,
        abi: contractABIs.lending.abi,
        functionName: 'liquidate',
        args: [user, collateralToken, debtToken, parsedDebtToCover],
      });
    } catch (error) {
      console.error('Liquidate transaction failed:', error);
      throw error;
    }
  }, [liquidateAsync]);

  return {
    // Write contract functions
    deposit,
    depositAsync,
    borrow,
    borrowAsync,
    depositAndBorrow,
    depositAndBorrowAsync,
    repay,
    repayAsync,
    withdraw,
    withdrawAsync,
    liquidate,
    liquidateAsync,
    
    // Write transaction states
    isDepositPending,
    isBorrowPending,
    isDepositAndBorrowPending,
    isRepayPending,
    isWithdrawPending,
    isLiquidatePending,
    
    // Write transaction errors
    depositError,
    borrowError,
    depositAndBorrowError,
    repayError,
    withdrawError,
    liquidateError,
    
    // Read contract data
    maxBorrow,
    liquidationPrice,
    healthFactor,
    
    // Read contract loading states
    isMaxBorrowLoading,
    isLiquidationPriceLoading,
    isHealthFactorLoading,
    
    // Read contract errors
    maxBorrowError,
    liquidationPriceError,
    healthFactorError,
    
    // Helper functions
    depositWithAmount,
    borrowWithAmount,
    depositAndBorrowWithAmounts,
    repayWithAmount,
    withdrawWithAmount,
    liquidateWithAmount,
  };
}