import { useContractInteraction } from './contracts';
import { contractAddresses, contractABIs, ContractNames } from './contractConfig';
import { useCallback } from 'react';
import { type Abi } from 'viem';

export function useBarukContract(contractName: ContractNames) {
  const { executeEVMContract } = useContractInteraction();

  const callContract = useCallback(async (
    method: string,
    args: unknown[] = [],
    options: Record<string, unknown> = {}
  ) => {
    const address = contractAddresses[contractName];
    const abi = contractABIs[contractName] as Abi;
    
    return executeEVMContract(address as `0x${string}`, abi, method, args, options);
  }, [contractName, executeEVMContract]);

  const callTokenContract = useCallback(async (
    tokenAddress: string,
    method: string,
    args: unknown[] = [],
    options: Record<string, unknown> = {}
  ) => {
    const abi = contractABIs.erc20 as Abi;
    return executeEVMContract(tokenAddress as `0x${string}`, abi, method, args, options);
  }, [executeEVMContract]);

  return { callContract, callTokenContract };
}
