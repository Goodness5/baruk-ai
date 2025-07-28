import { contractABIs, contractAddresses } from '../contractConfig';
import { useReadContract, useWriteContract } from 'wagmi';

export function useBarukAMM(pairAddress?: string) {
  const factoryAddress = contractAddresses.ammFactory as `0x${string}`;
  const factoryAbi = contractABIs.ammFactory.abi;

  // Factory functions - based on your actual contract ABI
  const { data: implementation, isLoading: isImplementationLoading } = useReadContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: 'implementation',
  });

  const { writeContractAsync: writeCreatePair } = useWriteContract();

  // Pair functions (only available when pairAddress is provided)
  // These will depend on your AMM contract ABI - you'll need to update based on actual AMM functions
  const { data: reserves, isLoading: isReservesLoading } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: contractABIs.amm?.abi || [],
    functionName: 'getReserves',
    query: {
      enabled: !!pairAddress && !!contractABIs.amm?.abi,
    },
  });

  const { data: token0, isLoading: isToken0Loading } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: contractABIs.amm?.abi || [],
    functionName: 'token0',
    query: {
      enabled: !!pairAddress && !!contractABIs.amm?.abi,
    },
  });

  const { data: token1, isLoading: isToken1Loading } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: contractABIs.amm?.abi || [],
    functionName: 'token1',
    query: {
      enabled: !!pairAddress && !!contractABIs.amm?.abi,
    },
  });

  const { writeContractAsync: writeMint } = useWriteContract();
  const { writeContractAsync: writeBurn } = useWriteContract();
  const { writeContractAsync: writeSwap } = useWriteContract();

  // Helper function to create a new pair
  const createNewPair = async (token0Address: string, token1Address: string) => {
    if (!writeCreatePair) throw new Error('CreatePair function not available');
    
    try {
      const result = await writeCreatePair({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: 'createPair',
        args: [token0Address as `0x${string}`, token1Address as `0x${string}`],
      });
      return result;
    } catch (error) {
      console.error('Error creating pair:', error);
      throw error;
    }
  };

  // Helper functions for pair operations
  const mint = async (to: string) => {
    if (!pairAddress || !writeMint) throw new Error('Mint function not available');
    
    try {
      const result = await writeMint({
        address: pairAddress as `0x${string}`,
        abi: contractABIs.amm?.abi || [],
        functionName: 'mint',
        args: [to as `0x${string}`],
      });
      return result;
    } catch (error) {
      console.error('Error minting:', error);
      throw error;
    }
  };

  const burn = async (to: string) => {
    if (!pairAddress || !writeBurn) throw new Error('Burn function not available');
    
    try {
      const result = await writeBurn({
        address: pairAddress as `0x${string}`,
        abi: contractABIs.amm?.abi || [],
        functionName: 'burn',
        args: [to as `0x${string}`],
      });
      return result;
    } catch (error) {
      console.error('Error burning:', error);
      throw error;
    }
  };

  const swap = async (amount0Out: bigint, amount1Out: bigint, to: string, data: `0x${string}`) => {
    if (!pairAddress || !writeSwap) throw new Error('Swap function not available');
    
    try {
      const result = await writeSwap({
        address: pairAddress as `0x${string}`,
        abi: contractABIs.amm?.abi || [],
        functionName: 'swap',
        args: [amount0Out, amount1Out, to as `0x${string}`, data],
      });
      return result;
    } catch (error) {
      console.error('Error swapping:', error);
      throw error;
    }
  };

  return {
    // Factory methods
    implementation,
    isImplementationLoading,
    createNewPair,
    
    // Pair methods (only work when pairAddress is provided)
    reserves,
    isReservesLoading,
    token0,
    isToken0Loading,
    token1,
    isToken1Loading,
    mint,
    burn,
    swap,
  };
}

// Separate hook for getting pair information
export function useGetPair(token0Address?: string, token1Address?: string) {
  const factoryAddress = contractAddresses.ammFactory as `0x${string}`;
  const factoryAbi = contractABIs.ammFactory.abi;

  const { data: pairAddress, isLoading: isPairLoading, error } = useReadContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: 'getPair',
    args: [token0Address as `0x${string}`, token1Address as `0x${string}`],
    query: {
      enabled: !!(token0Address && token1Address),
    },
  });

  return { 
    pairAddress, 
    isPairLoading, 
    error,
    // Helper to check if pair exists (address is not zero)
    pairExists: pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000'
  };
}

// Usage examples:
export const useFactoryOperations = () => {
  const { implementation, createNewPair } = useBarukAMM();
  
  return {
    implementation,
    createNewPair,
  };
};

export const usePairOperations = (pairAddress: string) => {
  const { 
    reserves, 
    token0, 
    token1, 
    mint, 
    burn, 
    swap,
    isReservesLoading,
    isToken0Loading,
    isToken1Loading
  } = useBarukAMM(pairAddress);
  
  return {
    reserves,
    token0,
    token1,
    mint,
    burn,
    swap,
    isLoading: isReservesLoading || isToken0Loading || isToken1Loading,
  };
};

// Example usage in a component:
/*
function MyComponent() {
  const [token0, setToken0] = useState('0x...');
  const [token1, setToken1] = useState('0x...');
  
  // Get pair address for two tokens
  const { pairAddress, isPairLoading, pairExists } = useGetPair(token0, token1);
  
  // Factory operations
  const { createNewPair } = useFactoryOperations();
  
  // Pair operations (only when pair exists)
  const pairOps = usePairOperations(pairAddress || '');
  
  const handleCreatePair = async () => {
    try {
      await createNewPair(token0, token1);
    } catch (error) {
      console.error('Failed to create pair:', error);
    }
  };
  
  return (
    <div>
      {isPairLoading && <p>Loading pair...</p>}
      {pairExists ? (
        <p>Pair exists at: {pairAddress}</p>
      ) : (
        <button onClick={handleCreatePair}>Create Pair</button>
      )}
    </div>
  );
}
*/