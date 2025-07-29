import { getContract, createWalletClient, custom, Abi } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import type { InterfaceAbi, ContractRunner } from 'ethers';

// Minimal EIP-1193 provider interface for viem
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}



// Wagmi-based contract interaction utility
export function useWagmiContractInteraction() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const executeEVMContract = async (contractAddress: string, abi: Abi, method: string, methodArgs: unknown[], options?: Record<string, unknown>) => {
    if (!isConnected || !address) throw new Error('Wagmi wallet not connected');
    
    console.log('executeEVMContract called with:', { contractAddress, method, methodArgs, argsLength: methodArgs.length, argsType: typeof methodArgs, abiType: typeof abi, isArray: Array.isArray(abi) });
    
    if (window.ethereum) {
      // Use window.ethereum directly with viem
      const viemWalletClient = createWalletClient({
        transport: custom(window.ethereum as EthereumProvider),
        account: address as `0x${string}`
      });
      
      // Extract ABI from contract artifact if needed
      const contractAbi = Array.isArray(abi) ? abi : (abi as any).abi || abi;
      
      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: contractAbi,
        client: viemWalletClient
      });

      console.log('About to call viem contract method with methodArgs:', methodArgs);
      console.log('MethodArgs length:', methodArgs.length);
      console.log('MethodArgs content:', JSON.stringify(methodArgs));
      
      // Call the method with arguments as individual parameters instead of spreading
      if (methodArgs.length === 2) {
        return await (contract.write[method] as (arg1: unknown, arg2: unknown) => Promise<unknown>)(methodArgs[0], methodArgs[1]);
      } else if (methodArgs.length === 1) {
        return await (contract.write[method] as (arg1: unknown) => Promise<unknown>)(methodArgs[0]);
      } else {
        return await (contract.write[method] as () => Promise<unknown>)();
      }
    } else {
      // Fallback to ethers with wagmi wallet client
      if (!walletClient) throw new Error('No wallet client available');
      
      const ethersModule = await import('ethers');
      const { Contract } = ethersModule;
      
      // Create ethers provider from wagmi wallet client
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Extract ABI from contract artifact if needed
      const contractAbi = Array.isArray(abi) ? abi : (abi as any).abi || abi;
      
      const contract = new Contract(
        contractAddress,
        contractAbi as InterfaceAbi,
        signer as ContractRunner
      );
      return await contract[method](...methodArgs);
    }
  };

  return {
    executeEVMContract,
    isConnected,
    address
  };
} 