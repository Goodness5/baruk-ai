import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
// Minimal ERC20 ABI for balanceOf function
const erc20Abi = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
] as const;
import type { Token } from '../store/useAppStore';

const client = createPublicClient({
  chain: mainnet,
  transport: http()
});

export async function fetchBalances(address: string, tokens: Token[]): Promise<{ token: string; symbol: string; amount: string; decimals: number }[]> {
  if (!address || tokens.length === 0) {
    return [];
  }

  const balances = await Promise.all(
    tokens.map(async (token) => {
      try {
        // For EVM tokens
        if (token.address.startsWith('0x')) {
          const contractAddress = token.address as `0x${string}`;
          
          // Fetch balance, decimals, and symbol in parallel
          const [rawAmount, decimals, fetchedSymbol] = await Promise.all([
            client.readContract({
              address: contractAddress,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address]
            }),
            client.readContract({
              address: contractAddress,
              abi: erc20Abi,
              functionName: 'decimals',
            }).catch(() => 18), // Default to 18 decimals if call fails
            client.readContract({
              address: contractAddress,
              abi: erc20Abi,
              functionName: 'symbol',
            }).catch(() => token.symbol) // Fall back to provided symbol
          ]);

          const amount = rawAmount?.toString() ?? '0';
          return { 
            token: token.address, 
            symbol: fetchedSymbol || token.symbol,
            amount,
            decimals: Number(decimals)
          };
        } else {
          // For Cosmos tokens, return with default values
          return { 
            token: token.address, 
            symbol: token.symbol,
            amount: '0',
            decimals: 18
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch balance for token ${token.address}:`, error);
        return { 
          token: token.address, 
          symbol: token.symbol,
          amount: '0',
          decimals: 18
        };
      }
    })
  );

  // Filter out failed requests but keep tokens with zero balance for display
  return balances.filter(balance => balance.symbol);
}

// Enhanced balance watcher with retry logic
export async function fetchBalancesWithRetry(
  address: string, 
  tokens: Token[], 
  maxRetries: number = 3
): Promise<{ token: string; amount: string }[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchBalances(address, tokens);
    } catch (error) {
      console.warn(`Balance fetch attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  return [];
} 