// src/lib/useYakaContract.ts

import { useContractInteraction } from './contracts';
import yakaRouterAbi from '../../abi/yakaRouter.json';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const YAKA_ROUTER_ADDRESS = '0xd45dAff288075952822d5323F1d571e73435E929'; 

// ✅ Step 1: Define and export the type
export type YakaContractHook = {
  callContract: (
    method: string,
    args: unknown[],
    options?: { account?: `0x${string}` }
  ) => Promise<any>;

  callTokenContract: (
    tokenAddress: string,
    method: string,
    args: unknown[]
  ) => Promise<any>;
};

// ✅ Step 2: Implement the hook
export function useYakaContract(): YakaContractHook {
  const { walletClient } = useContractInteraction();

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  const callContract = async (
    method: string,
    args: unknown[],
    options?: { account?: `0x${string}` }
  ) => {
    if (!walletClient) throw new Error('Wallet client not available');
    return walletClient.writeContract({
      address: YAKA_ROUTER_ADDRESS,
      abi: yakaRouterAbi,
      functionName: method,
      args,
      ...options,
    });
  };

  const callTokenContract = async (
    tokenAddress: string,
    method: string,
    args: unknown[]
  ) => {
    const erc20Abi = await import('../../abi/ERC20.json');
    if (!walletClient) throw new Error('Wallet client not available');
    return walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi.default,
      functionName: method,
      args,
    });
  };

  return {
    callContract,
    callTokenContract,
  };
}
