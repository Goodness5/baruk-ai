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
  }
] as const; // Use a minimal ERC20 ABI if available
import type { Token } from '../store/useAppStore';
import { useUnifiedWallet } from './unifiedWallet';

const client = createPublicClient({
  chain: mainnet,
  transport: http()
});

export async function fetchBalances(address: string, tokens: Token[]): Promise<{ token: string; amount: string }[]> {
  if (!address || tokens.length === 0) {
    return [];
  }

  const balances = await Promise.all(
    tokens.map(async (token) => {
      try {
        // For EVM tokens
        if (token.address.startsWith('0x')) {
          const amount = await client.readContract({
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address]
          });
          return { token: token.address, amount: amount?.toString() ?? '0' };
        } else {
          // For Cosmos tokens, we'll need to implement Cosmos balance fetching
          // For now, return 0 for non-EVM tokens
          return { token: token.address, amount: '0' };
        }
      } catch (error) {
        console.warn(`Failed to fetch balance for token ${token.address}:`, error);
        return { token: token.address, amount: '0' };
      }
    })
  );

  return balances.filter(balance => balance.amount !== '0' || true); // Show all tokens including zero balances
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