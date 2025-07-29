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

  const executeEVMContract = async (contractAddress: string, abi: Abi, method: string, args: unknown[], options?: Record<string, unknown>) => {
    if (!isConnected || !address) throw new Error('Wagmi wallet not connected');
    
    if (window.ethereum) {
      // Use window.ethereum directly with viem
      const viemWalletClient = createWalletClient({
        transport: custom(window.ethereum as EthereumProvider)
      });
      
      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: abi,
        client: viemWalletClient
      });

      return await (contract.write[method] as (...args: unknown[]) => Promise<unknown>)(...args, options);
    } else {
      // Fallback to ethers with wagmi wallet client
      if (!walletClient) throw new Error('No wallet client available');
      
      const ethersModule = await import('ethers');
      const { Contract } = ethersModule;
      
      // Create ethers provider from wagmi wallet client
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contract = new Contract(
        contractAddress,
        abi as InterfaceAbi,
        signer as ContractRunner
      );
      return await contract[method](...args, options);
    }
  };

  return {
    executeEVMContract,
    isConnected,
    address
  };
} 