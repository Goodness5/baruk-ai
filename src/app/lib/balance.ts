import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import erc20Abi from '../../abi/BarukAMM.json'; // Use a minimal ERC20 ABI if available
import type { Token } from '../store/useAppStore';

const client = createPublicClient({
  chain: mainnet,
  transport: http()
});

export async function fetchBalances(address: string, tokens: Token[]): Promise<{ token: string; amount: string }[]> {
  const balances = await Promise.all(
    tokens.map(async (token) => {
      try {
        const amount = await client.readContract({
          address: token.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address]
        });
        return { token: token.address, amount: amount?.toString() ?? '0' };
      } catch {
        return { token: token.address, amount: '0' };
      }
    })
  );
  return balances;
} 