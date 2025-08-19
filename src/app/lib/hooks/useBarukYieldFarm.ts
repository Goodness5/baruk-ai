import { useCallback } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, type Address, type Hash } from 'viem';
import { contractABIs, contractAddresses } from '../contractConfig';

// Types for better TypeScript support
interface StakeParams {
  poolId: number;
  amount: string;
  decimals?: number;
}

interface UnstakeParams {
  poolId: number;
  amount: string;
  decimals?: number;
}

interface ClaimParams {
  poolId: number;
}

interface EmergencyWithdrawParams {
  poolId: number;
}

interface PoolInfo {
  lpToken: Address;
  allocPoint: bigint;
  lastRewardBlock: bigint;
  accRewardPerShare: bigint;
  totalStaked: bigint;
}

interface UserInfo {
  amount: bigint;
  rewardDebt: bigint;
  pendingRewards: bigint;
}

interface UseBarukYieldFarmReturn {
  // Write contract functions
  stake: ReturnType<typeof useWriteContract>['writeContract'];
  stakeAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  unstake: ReturnType<typeof useWriteContract>['writeContract'];
  unstakeAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  claimReward: ReturnType<typeof useWriteContract>['writeContract'];
  claimRewardAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  emergencyWithdraw: ReturnType<typeof useWriteContract>['writeContract'];
  emergencyWithdrawAsync: ReturnType<typeof useWriteContract>['writeContractAsync'];
  
  // Write transaction states
  isStakePending: boolean;
  isUnstakePending: boolean;
  isClaimPending: boolean;
  isEmergencyWithdrawPending: boolean;
  
  // Write transaction errors
  stakeError: Error | null;
  unstakeError: Error | null;
  claimError: Error | null;
  emergencyWithdrawError: Error | null;
  
  // Read contract data
  pendingReward: bigint | undefined;
  poolInfo: PoolInfo | undefined;
  userInfo: UserInfo | undefined;
  rewardPerSecond: bigint | undefined;
  totalAllocPoint: bigint | undefined;
  
  // Read contract loading states
  isPendingRewardLoading: boolean;
  isPoolInfoLoading: boolean;
  isUserInfoLoading: boolean;
  isRewardPerSecondLoading: boolean;
  isTotalAllocPointLoading: boolean;
  
  // Read contract errors
  pendingRewardError: Error | null;
  poolInfoError: Error | null;
  userInfoError: Error | null;
  rewardPerSecondError: Error | null;
  totalAllocPointError: Error | null;
  
  // Helper functions
  stakeTokens: (params: StakeParams) => Promise<Hash>;
  unstakeTokens: (params: UnstakeParams) => Promise<Hash>;
  harvestRewards: (params: ClaimParams) => Promise<Hash>;
  emergencyWithdrawTokens: (params: EmergencyWithdrawParams) => Promise<Hash>;
  
  // Utility functions
  calculateAPR: (poolId: number) => number | null;
  calculatePendingRewards: (poolId: number) => bigint | null;
  refreshPoolData: () => void;
  refreshUserData: () => void;
}

export function useBarukYieldFarm(
  userAddress?: Address, 
  poolId?: number
): UseBarukYieldFarmReturn {
  // Write contract hooks
  const {
    writeContract: stake,
    writeContractAsync: stakeAsync,
    isPending: isStakePending,
    error: stakeError
  } = useWriteContract();
  
  const {
    writeContract: unstake,
    writeContractAsync: unstakeAsync,
    isPending: isUnstakePending,
    error: unstakeError
  } = useWriteContract();
  
  const {
    writeContract: claimReward,
    writeContractAsync: claimRewardAsync,
    isPending: isClaimPending,
    error: claimError
  } = useWriteContract();
  
  const {
    writeContract: emergencyWithdraw,
    writeContractAsync: emergencyWithdrawAsync,
    isPending: isEmergencyWithdrawPending,
    error: emergencyWithdrawError
  } = useWriteContract();

  // Read contract hooks
  const {
    data: pendingReward,
    isLoading: isPendingRewardLoading,
    error: pendingRewardError,
    refetch: refetchPendingReward
  } = useReadContract({
    address: contractAddresses.yieldFarm,
    abi: contractABIs.yieldFarm,
    functionName: 'pendingReward',
    args: userAddress && poolId !== undefined ? [BigInt(poolId), userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && poolId !== undefined)
    }
  }) as {
    data: bigint | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };

  const {
    data: poolInfo,
    isLoading: isPoolInfoLoading,
    error: poolInfoError,
    refetch: refetchPoolInfo
  } = useReadContract({
    address: contractAddresses.yieldFarm,
    abi: contractABIs.yieldFarm,
    functionName: 'poolInfo',
    args: poolId !== undefined ? [BigInt(poolId)] : undefined,
    query: {
      enabled: poolId !== undefined
    }
  }) as {
    data: PoolInfo | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };

  const {
    data: userInfo,
    isLoading: isUserInfoLoading,
    error: userInfoError,
    refetch: refetchUserInfo
  } = useReadContract({
    address: contractAddresses.yieldFarm,
    abi: contractABIs.yieldFarm,
    functionName: 'userInfo',
    args: userAddress && poolId !== undefined ? [BigInt(poolId), userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && poolId !== undefined)
    }
  }) as {
    data: UserInfo | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };

  const {
    data: rewardPerSecond,
    isLoading: isRewardPerSecondLoading,
    error: rewardPerSecondError
  } = useReadContract({
    address: contractAddresses.yieldFarm,
    abi: contractABIs.yieldFarm,
    functionName: 'rewardPerSecond',
  }) as {
    data: bigint | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  const {
    data: totalAllocPoint,
    isLoading: isTotalAllocPointLoading,
    error: totalAllocPointError
  } = useReadContract({
    address: contractAddresses.yieldFarm,
    abi: contractABIs.yieldFarm,
    functionName: 'totalAllocPoint',
  }) as {
    data: bigint | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  // Utility functions
  const calculateAPR = useCallback((targetPoolId: number): number | null => {
    if (!poolInfo || !rewardPerSecond || !totalAllocPoint || targetPoolId !== poolId) {
      return null;
    }

    try {
      // APR calculation: (rewardPerSecond * poolAllocPoint / totalAllocPoint) * secondsInYear * 100 / totalStaked
      const secondsInYear = 365 * 24 * 60 * 60;
      const poolRewardPerSecond = (rewardPerSecond * poolInfo.allocPoint) / totalAllocPoint;
      const yearlyRewards = poolRewardPerSecond * BigInt(secondsInYear);
      
      if (poolInfo.totalStaked === BigInt(0)) {
        return 0;
      }
      
      const apr = Number(yearlyRewards * BigInt(100)) / Number(poolInfo.totalStaked);
      return apr;
    } catch (error) {
      console.error('Failed to calculate APR:', error);
      return null;
    }
  }, [poolInfo, rewardPerSecond, totalAllocPoint, poolId]);

  const calculatePendingRewards = useCallback((targetPoolId: number): bigint | null => {
    if (targetPoolId !== poolId || !pendingReward) {
      return null;
    }
    return pendingReward;
  }, [pendingReward, poolId]);

  const refreshPoolData = useCallback(() => {
    refetchPoolInfo();
    refetchPendingReward();
  }, [refetchPoolInfo, refetchPendingReward]);

  const refreshUserData = useCallback(() => {
    refetchUserInfo();
    refetchPendingReward();
  }, [refetchUserInfo, refetchPendingReward]);

  // Helper functions with proper error handling and validation
  const stakeTokens = useCallback(async (params: StakeParams): Promise<Hash> => {
    const { poolId: targetPoolId, amount, decimals = 18 } = params;
    
    // Validation
    if (targetPoolId < 0 || !Number.isInteger(targetPoolId)) {
      throw new Error('Invalid pool ID provided');
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Invalid stake amount provided');
    }
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      
      const hash = await stakeAsync({
        address: contractAddresses.yieldFarm,
        abi: contractABIs.yieldFarm,
        functionName: 'stake',
        args: [BigInt(targetPoolId), parsedAmount],
      });
      
      // Refresh data after successful stake
      setTimeout(() => {
        refreshUserData();
        refreshPoolData();
      }, 2000); // Wait 2 seconds for blockchain confirmation
      
      return hash;
    } catch (error) {
      console.error('Stake transaction failed:', error);
      throw error;
    }
  }, [stakeAsync, refreshUserData, refreshPoolData]);

  const unstakeTokens = useCallback(async (params: UnstakeParams): Promise<Hash> => {
    const { poolId: targetPoolId, amount, decimals = 18 } = params;
    
    // Validation
    if (targetPoolId < 0 || !Number.isInteger(targetPoolId)) {
      throw new Error('Invalid pool ID provided');
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Invalid unstake amount provided');
    }
    
    // Check if user has enough staked
    if (userInfo && parseUnits(amount, decimals) > userInfo.amount) {
      throw new Error('Insufficient staked amount');
    }
    
    try {
      const parsedAmount = parseUnits(amount, decimals);
      
      const hash = await unstakeAsync({
        address: contractAddresses.yieldFarm,
        abi: contractABIs.yieldFarm,
        functionName: 'unstake',
        args: [BigInt(targetPoolId), parsedAmount],
      });
      
      // Refresh data after successful unstake
      setTimeout(() => {
        refreshUserData();
        refreshPoolData();
      }, 2000);
      
      return hash;
    } catch (error) {
      console.error('Unstake transaction failed:', error);
      throw error;
    }
  }, [unstakeAsync, userInfo, refreshUserData, refreshPoolData]);

  const harvestRewards = useCallback(async (params: ClaimParams): Promise<Hash> => {
    const { poolId: targetPoolId } = params;
    
    // Validation
    if (targetPoolId < 0 || !Number.isInteger(targetPoolId)) {
      throw new Error('Invalid pool ID provided');
    }
    
    // Check if there are pending rewards
    if (pendingReward === BigInt(0)) {
      throw new Error('No pending rewards to claim');
    }
    
    try {
      const hash = await claimRewardAsync({
        address: contractAddresses.yieldFarm,
        abi: contractABIs.yieldFarm,
        functionName: 'claimReward',
        args: [BigInt(targetPoolId)],
      });
      
      // Refresh data after successful claim
      setTimeout(() => {
        refreshUserData();
      }, 2000);
      
      return hash;
    } catch (error) {
      console.error('Claim reward transaction failed:', error);
      throw error;
    }
  }, [claimRewardAsync, pendingReward, refreshUserData]);

  const emergencyWithdrawTokens = useCallback(async (params: EmergencyWithdrawParams): Promise<Hash> => {
    const { poolId: targetPoolId } = params;
    
    // Validation
    if (targetPoolId < 0 || !Number.isInteger(targetPoolId)) {
      throw new Error('Invalid pool ID provided');
    }
    
    // Check if user has staked tokens
    if (!userInfo || userInfo.amount === BigInt(0)) {
      throw new Error('No staked tokens to emergency withdraw');
    }
    
    try {
      const hash = await emergencyWithdrawAsync({
        address: contractAddresses.yieldFarm,
        abi: contractABIs.yieldFarm,
        functionName: 'emergencyWithdraw',
        args: [BigInt(targetPoolId)],
      });
      
      // Refresh data after successful emergency withdraw
      setTimeout(() => {
        refreshUserData();
        refreshPoolData();
      }, 2000);
      
      return hash;
    } catch (error) {
      console.error('Emergency withdraw transaction failed:', error);
      throw error;
    }
  }, [emergencyWithdrawAsync, userInfo, refreshUserData, refreshPoolData]);

  return {
    // Write contract functions
    stake,
    stakeAsync,
    unstake,
    unstakeAsync,
    claimReward,
    claimRewardAsync,
    emergencyWithdraw,
    emergencyWithdrawAsync,
    
    // Write transaction states
    isStakePending,
    isUnstakePending,
    isClaimPending,
    isEmergencyWithdrawPending,
    
    // Write transaction errors
    stakeError,
    unstakeError,
    claimError,
    emergencyWithdrawError,
    
    // Read contract data
    pendingReward,
    poolInfo,
    userInfo,
    rewardPerSecond,
    totalAllocPoint,
    
    // Read contract loading states
    isPendingRewardLoading,
    isPoolInfoLoading,
    isUserInfoLoading,
    isRewardPerSecondLoading,
    isTotalAllocPointLoading,
    
    // Read contract errors
    pendingRewardError,
    poolInfoError,
    userInfoError,
    rewardPerSecondError,
    totalAllocPointError,
    
    // Helper functions
    stakeTokens,
    unstakeTokens,
    harvestRewards,
    emergencyWithdrawTokens,
    
    // Utility functions
    calculateAPR,
    calculatePendingRewards,
    refreshPoolData,
    refreshUserData,
  };
}