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
  
  // Read contract loading states
  isPendingRewardLoading: boolean;
  isPoolInfoLoading: boolean;
  isUserInfoLoading: boolean;
  isRewardPerSecondLoading: boolean;
  
  // Read contract errors
  pendingRewardError: Error | null;
  poolInfoError: Error | null;
  userInfoError: Error | null;
  rewardPerSecondError: Error | null;
  
  // Helper functions
  stakeTokens: (params: StakeParams) => Promise<Hash | undefined>;
  unstakeTokens: (params: UnstakeParams) => Promise<Hash | undefined>;
  harvestRewards: (poolId: number) => Promise<Hash | undefined>;
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

  // Read contract hooks - only call when parameters are available
  const {
    data: pendingReward,
    isLoading: isPendingRewardLoading,
    error: pendingRewardError
  } = useReadContract({
    address: contractAddresses.yieldFarm as Address,
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
  };

  const {
    data: poolInfo,
    isLoading: isPoolInfoLoading,
    error: poolInfoError
  } = useReadContract({
    address: contractAddresses.yieldFarm as Address,
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
  };

  const {
    data: userInfo,
    isLoading: isUserInfoLoading,
    error: userInfoError
  } = useReadContract({
    address: contractAddresses.yieldFarm as Address,
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
  };

  const {
    data: rewardPerSecond,
    isLoading: isRewardPerSecondLoading,
    error: rewardPerSecondError
  } = useReadContract({
    address: contractAddresses.yieldFarm as Address,
    abi: contractABIs.yieldFarm,
    functionName: 'rewardPerSecond'
  }) as {
    data: bigint | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  // Helper functions with proper error handling and validation
  const stakeTokens = useCallback(async (params: StakeParams): Promise<Hash | undefined> => {
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
      
      return await stakeAsync({
        address: contractAddresses.yieldFarm as Address,
        abi: contractABIs.yieldFarm,
        functionName: 'stake',
        args: [BigInt(targetPoolId), parsedAmount],
      });
    } catch (error) {
      console.error('Stake transaction failed:', error);
      throw error;
    }
  }, [stakeAsync]);

  const unstakeTokens = useCallback(async (params: UnstakeParams): Promise<Hash | undefined> => {
    const { poolId: targetPoolId, amount, decimals = 18 } = params;

    // Validation
    if (targetPoolId < 0 || !Number.isInteger(targetPoolId)) {
      throw new Error('Invalid pool ID provided');
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Invalid unstake amount provided');
    }

    try {
      const parsedAmount = parseUnits(amount, decimals);
      
      return await unstakeAsync({
        address: contractAddresses.yieldFarm as Address,
        abi: contractABIs.yieldFarm,
        functionName: 'unstake',
        args: [BigInt(targetPoolId), parsedAmount],
      });
    } catch (error) {
      console.error('Unstake transaction failed:', error);
      throw error;
    }
  }, [unstakeAsync]);

  const harvestRewards = useCallback(async (targetPoolId: number): Promise<Hash | undefined> => {
    // Validation
    if (targetPoolId < 0 || !Number.isInteger(targetPoolId)) {
      throw new Error('Invalid pool ID provided');
    }

    try {
      return await claimRewardAsync({
        address: contractAddresses.yieldFarm as Address,
        abi: contractABIs.yieldFarm,
        functionName: 'claimReward',
        args: [BigInt(targetPoolId)],
      });
    } catch (error) {
      console.error('Claim reward transaction failed:', error);
      throw error;
    }
  }, [claimRewardAsync]);

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

    // Read contract loading states
    isPendingRewardLoading,
    isPoolInfoLoading,
    isUserInfoLoading,
    isRewardPerSecondLoading,

    // Read contract errors
    pendingRewardError,
    poolInfoError,
    userInfoError,
    rewardPerSecondError,

    // Helper functions
    stakeTokens,
    unstakeTokens,
    harvestRewards,
  };
}