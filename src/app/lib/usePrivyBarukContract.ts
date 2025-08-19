import { contractAddresses, contractABIs, ContractNames } from './contractConfig';
import { useCallback } from 'react';
import { useWallets, useSendTransaction } from '@privy-io/react-auth';
import { type Abi, encodeFunctionData, parseEther } from 'viem';

export function usePrivyBarukContract(contractName: ContractNames) {
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  
  // Get the Privy embedded wallet
  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');
  
  const callContract = useCallback(async (
    method: string,
    args: unknown[] = [],
    options: {
      value?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    } = {}
  ) => {
    console.log('Privy callContract - method:', method, 'args:', args);
    console.log('Embedded wallet object:', embeddedWallet);
    console.log('Available methods on wallet:', Object.getOwnPropertyNames(embeddedWallet));
    
    if (!embeddedWallet) {
      throw new Error('Privy wallet not connected');
    }

    try {
      // Ensure we're on the correct network
      const currentChain = embeddedWallet.chainId;
      console.log('Current chain ID:', currentChain);
      
      if (currentChain !== '1328') {
        console.log('Switching to Sei Network testnet...');
        await embeddedWallet.switchChain(1328);
        console.log('Successfully switched to Sei Network testnet');
        
        // Wait for the switch to take effect
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const contractAddress = contractAddresses[contractName];
      const abi = contractABIs[contractName] as Abi;
      
      // Encode the function call
      const data = encodeFunctionData({
        abi,
        functionName: method,
        args
      });
      
      console.log('Sending transaction to contract:', contractAddress);
      console.log('Function data:', data);
      
      // In Privy v2, we use the useSendTransaction hook
      if (!embeddedWallet) {
        throw new Error('Privy wallet not available');
      }
      
      console.log('Using Privy useSendTransaction hook for transaction');
      
      // Use the sendTransaction hook with the wallet address
      const hash = await sendTransaction(
        {
          to: contractAddress as `0x${string}`,
          data,
          value: options.value || 0n,
          chainId: 1328, // Explicitly specify Sei testnet chain ID
          maxFeePerGas: options.maxFeePerGas || parseEther('0.0000000011'), // 1.1 gwei
          maxPriorityFeePerGas: options.maxPriorityFeePerGas || parseEther('0.0000000011') // 1.1 gwei
        },
        { address: embeddedWallet.address }
      );
      
      console.log('Transaction sent successfully:', hash);
      return { hash };
      
    } catch (error) {
      console.error('Error in Privy callContract:', error);
      throw error;
    }
  }, [contractName, embeddedWallet]);

  const callTokenContract = useCallback(async (
    tokenAddress: string,
    method: string,
    args: unknown[] = [],
    options: {
      value?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    } = {}
  ) => {
    console.log('Privy callTokenContract - token:', tokenAddress, 'method:', method, 'args:', args);
    console.log('Embedded wallet object:', embeddedWallet);
    console.log('Available methods on wallet:', Object.getOwnPropertyNames(embeddedWallet));
    
    if (!embeddedWallet) {
      throw new Error('Privy wallet not connected');
    }

    try {
      // Ensure we're on the correct network
      const currentChain = embeddedWallet.chainId;
      console.log('Current chain ID:', currentChain);
      
      if (currentChain !== '1328') {
        console.log('Switching to Sei Network testnet...');
        await embeddedWallet.switchChain(1328);
        console.log('Successfully switched to Sei Network testnet');
        
        // Wait for the switch to take effect
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const abi = contractABIs.erc20 as Abi;
      
      // Encode the function call
      const data = encodeFunctionData({
        abi,
        functionName: method,
        args
      });
      
      console.log('Sending token transaction to:', tokenAddress);
      console.log('Function data:', data);
      
      // In Privy v2, we use the useSendTransaction hook
      if (!embeddedWallet) {
        throw new Error('Privy wallet not available');
      }
      
      console.log('Using Privy useSendTransaction hook for transaction');
      
      // Use the sendTransaction hook with the wallet address
      const hash = await sendTransaction(
        {
          to: tokenAddress as `0x${string}`,
          data,
          value: options.value || 0n,
          chainId: 1328, // Explicitly specify Sei testnet chain ID
          maxFeePerGas: options.maxFeePerGas || parseEther('0.0000000011'), // 1.1 gwei
          maxPriorityFeePerGas: options.maxPriorityFeePerGas || parseEther('0.0000000011') // 1.1 gwei
        },
        { address: embeddedWallet.address }
      );
      
      console.log('Token transaction sent successfully:', hash);
      return { hash };
      
    } catch (error) {
      console.error('Error in Privy callTokenContract:', error);
      throw error;
    }
  }, [embeddedWallet]);

  return { callContract, callTokenContract };
}
