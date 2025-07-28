import { useContractInteraction } from './contracts';
import { contractAddresses, contractABIs, ContractNames } from './contractConfig';
import { useCallback } from 'react';

export function useBarukContract(contractName: ContractNames) {
  const { executeEVMContract } = useContractInteraction();

  const callContract = useCallback(async (
    method: string,
    args: unknown[] = [],
    options: Record<string, unknown> = {}
  ) => {
    const address = contractAddresses[contractName];
    const abi = contractABIs[contractName];
    
    return executeEVMContract(address as `0x${string}`, abi, method, args, options);
  }, [contractName, executeEVMContract]);

  const callTokenContract = useCallback(async (
    tokenAddress: string,
    method: string,
    args: unknown[] = [],
    options: Record<string, unknown> = {}
  ) => {
    const abi = contractABIs.erc20;
    return executeEVMContract(tokenAddress as `0x${string}`, abi, method, args, options);
  }, [executeEVMContract]);

  return { callContract, callTokenContract };
}
