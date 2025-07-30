
import { contractABIs, contractAddresses } from '../contractConfig';
import { useReadContract, useWriteContract } from 'wagmi';

export function useBarukAMM() {
  const ammAddress = contractAddresses.amm as `0x${string}`;
  const ammAbi = contractABIs.amm.abi;

  // Read functions
  const { data: reserves, isLoading: isReservesLoading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'getReserves',
  });

  const { data: token0, isLoading: isToken0Loading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'token0',
  });

  const { data: token1, isLoading: isToken1Loading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'token1',
  });

  const { data: totalLiquidity, isLoading: isTotalLiquidityLoading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'totalLiquidity',
  });

  const { data: totalSupply, isLoading: isTotalSupplyLoading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'totalSupply',
  });

  const { data: lpFeeBps, isLoading: isLpFeeBpsLoading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'lpFeeBps',
  });

  const { data: protocolFeeBps, isLoading: isProtocolFeeBpsLoading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'protocolFeeBps',
  });

  const { data: paused, isLoading: isPausedLoading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'paused',
  });

  // Write contract hooks
  const { writeContractAsync: writeAddLiquidity } = useWriteContract();
  const { writeContractAsync: writeRemoveLiquidity } = useWriteContract();
  const { writeContractAsync: writePublicSwap } = useWriteContract();

  // Helper function to add liquidity
  const addLiquidity = async (amount0: bigint, amount1: bigint, to: string) => {
    if (!writeAddLiquidity) throw new Error('AddLiquidity function not available');
    
    try {
      const result = await writeAddLiquidity({
        address: ammAddress,
        abi: ammAbi,
        functionName: 'addLiquidity',
        args: [amount0, amount1, to as `0x${string}`],
      });
      return result;
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw error;
    }
  };

  // Helper function to remove liquidity
  const removeLiquidity = async (liquidity: bigint) => {
    if (!writeRemoveLiquidity) throw new Error('RemoveLiquidity function not available');
    
    try {
      const result = await writeRemoveLiquidity({
        address: ammAddress,
        abi: ammAbi,
        functionName: 'removeLiquidity',
        args: [liquidity],
      });
      return result;
    } catch (error) {
      console.error('Error removing liquidity:', error);
      throw error;
    }
  };

  // Helper function for public swap
  const publicSwap = async (amountIn: bigint, tokenIn: string, minAmountOut: bigint, recipient: string) => {
    if (!writePublicSwap) throw new Error('PublicSwap function not available');
    
    try {
      const result = await writePublicSwap({
        address: ammAddress,
        abi: ammAbi,
        functionName: 'publicSwap',
        args: [amountIn, tokenIn as `0x${string}`, minAmountOut, recipient as `0x${string}`],
      });
      return result;
    } catch (error) {
      console.error('Error performing swap:', error);
      throw error;
    }
  };

  // Helper function to get amount out for swaps
  const getAmountOut = async (amountIn: bigint, reserveIn: bigint, reserveOut: bigint) => {
    try {
      const result = await useReadContract({
        address: ammAddress,
        abi: ammAbi,
        functionName: 'getAmountOut',
        args: [amountIn, reserveIn, reserveOut],
      });
      return result.data;
    } catch (error) {
      console.error('Error getting amount out:', error);
      throw error;
    }
  };

  // Helper function to get user's liquidity balance
  const getLiquidityBalance = (userAddress: string) => {
    return useReadContract({
      address: ammAddress,
      abi: ammAbi,
      functionName: 'liquidityBalance',
      args: [userAddress as `0x${string}`],
      query: {
        enabled: !!userAddress,
      },
    });
  };

  // Helper function to get LP rewards
  const getLPRewards = (userAddress: string) => {
    return useReadContract({
      address: ammAddress,
      abi: ammAbi,
      functionName: 'lpRewards',
      args: [userAddress as `0x${string}`],
      query: {
        enabled: !!userAddress,
      },
    });
  };

  return {
    // Read data
    reserves,
    token0,
    token1,
    totalLiquidity,
    totalSupply,
    lpFeeBps,
    protocolFeeBps,
    paused,
    
    // Loading states
    isReservesLoading,
    isToken0Loading,
    isToken1Loading,
    isTotalLiquidityLoading,
    isTotalSupplyLoading,
    isLpFeeBpsLoading,
    isProtocolFeeBpsLoading,
    isPausedLoading,
    
    // Write functions
    addLiquidity,
    removeLiquidity,
    publicSwap,
    getAmountOut,
    
    // User-specific functions
    getLiquidityBalance,
    getLPRewards,
  };
}

// Hook for user-specific AMM data
export function useUserAMMData(userAddress?: string) {
  const ammAddress = contractAddresses.amm as `0x${string}`;
  const ammAbi = contractABIs.amm.abi;

  const { data: liquidityBalance, isLoading: isLiquidityBalanceLoading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'liquidityBalance',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  });

  const { data: lpRewards, isLoading: isLpRewardsLoading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'lpRewards',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  });

  const { data: balanceOf, isLoading: isBalanceOfLoading } = useReadContract({
    address: ammAddress,
    abi: ammAbi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    liquidityBalance,
    lpRewards,
    balanceOf,
    isLiquidityBalanceLoading,
    isLpRewardsLoading,
    isBalanceOfLoading,
    isLoading: isLiquidityBalanceLoading || isLpRewardsLoading || isBalanceOfLoading,
  };
}

// Example usage in a component:
/*
function LiquidityComponent() {
  const { address } = useAccount();
  const { 
    reserves, 
    addLiquidity, 
    removeLiquidity,
    isReservesLoading 
  } = useBarukAMM();
  
  const { 
    liquidityBalance, 
    lpRewards,
    isLoading: isUserDataLoading 
  } = useUserAMMData(address);
  
  const handleAddLiquidity = async () => {
    try {
      await addLiquidity(
        parseUnits('100', 18), // amount0
        parseUnits('100', 18), // amount1
        address! // to
      );
    } catch (error) {
      console.error('Failed to add liquidity:', error);
    }
  };
  
  return (
    <div>
      {isReservesLoading ? (
        <p>Loading reserves...</p>
      ) : (
        <p>Reserves: {reserves?.toString()}</p>
      )}
      
      {isUserDataLoading ? (
        <p>Loading user data...</p>
      ) : (
        <div>
          <p>Your liquidity: {liquidityBalance?.toString()}</p>
          <p>Your rewards: {lpRewards?.toString()}</p>
        </div>
      )}
      
      <button onClick={handleAddLiquidity}>Add Liquidity</button>
    </div>
  );
}
*/
