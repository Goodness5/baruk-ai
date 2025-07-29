import { contractAddresses, contractABIs, ContractNames } from './contractConfig';
import { useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { getContract, type Abi } from 'viem';

export function useWagmiBarukContract(contractName: ContractNames) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const callContract = useCallback(async (
    method: string,
    args: unknown[] = [],
    options: Record<string, unknown> = {}
  ) => {
    console.log('callContract - walletClient:', !!walletClient, 'address:', address);
    
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    const contractAddress = contractAddresses[contractName];
    const abi = (contractABIs[contractName] as { abi: Abi }).abi;
    
    const contract = getContract({
      address: contractAddress as `0x${string}`,
      abi: abi,
      client: walletClient
    });

    const hash = await contract.write[method](args, options);
    return { hash };
  }, [contractName, walletClient, address]);

  const callTokenContract = useCallback(async (
    tokenAddress: string,
    method: string,
    args: unknown[] = [],
    options: Record<string, unknown> = {}
  ) => {
    console.log('callTokenContract - walletClient:', !!walletClient, 'address:', address);
    
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    const abi = (contractABIs.erc20 as { abi: Abi }).abi;
    
    const contract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: abi,
      client: walletClient
    });

    const hash = await contract.write[method](args, options);
    return { hash };
  }, [walletClient, address]);

  return { callContract, callTokenContract };
} 