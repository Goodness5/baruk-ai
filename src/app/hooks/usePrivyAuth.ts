'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useState } from 'react';

export function usePrivyAuth() {
  const {
    login,
    logout,
    authenticated,
    user,
    ready,
  } = usePrivy();
  
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's embedded wallet address
  const getUserAddress = useCallback(async (): Promise<string | null> => {
    if (!authenticated || !embeddedWallet) return null;
    
    try {
      return embeddedWallet.address;
    } catch (err) {
      console.error('Failed to get user address:', err);
      return null;
    }
  }, [authenticated, embeddedWallet]);

  // Execute autonomous trade without user confirmation
  const executeAutonomousTrade = useCallback(async (
    to: string,
    data: string,
    value?: string
  ): Promise<string | null> => {
    if (!authenticated || !embeddedWallet) {
      throw new Error('User not authenticated or no embedded wallet');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create transaction using the embedded wallet
      const tx = {
        to,
        data,
        value: value || '0x0',
        gasLimit: '500000', // Default gas limit
      };

      // Send transaction using embedded wallet (no confirmation needed)
      const response = await embeddedWallet.sendTransaction(tx);
      
      // Wait for transaction to be mined
      const receipt = await response.wait();
      
      return receipt.transactionHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw new Error(`Autonomous trade failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, embeddedWallet]);

  // Get user's token balance
  const getTokenBalance = useCallback(async (
    tokenAddress: string,
    userAddress: string
  ): Promise<string> => {
    if (!authenticated || !embeddedWallet) return '0';

    try {
      const provider = await embeddedWallet.getEthersProvider();
      const contract = new (await import('ethers')).Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      
      const balance = await contract.balanceOf(userAddress);
      return balance.toString();
    } catch (err) {
      console.error('Failed to get token balance:', err);
      return '0';
    }
  }, [authenticated, embeddedWallet]);

  // Approve token spending for autonomous trading
  const approveTokenSpending = useCallback(async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!authenticated || !embeddedWallet) return false;

    try {
      const signer = await embeddedWallet.getEthersSigner();
      const contract = new (await import('ethers')).Contract(
        tokenAddress,
        [
          'function approve(address spender, uint256 amount) returns (bool)',
          'function allowance(address owner, address spender) view returns (uint256)'
        ],
        signer
      );

      // Check current allowance
      const currentAllowance = await contract.allowance(await signer.getAddress(), spenderAddress);
      
      if (currentAllowance.lt(amount)) {
        // Approve spending
        const tx = await contract.approve(spenderAddress, amount);
        await tx.wait();
      }
      
      return true;
    } catch (err) {
      console.error('Failed to approve token spending:', err);
      return false;
    }
  }, [authenticated, embeddedWallet]);

  // Check if user has sufficient balance for trading
  const hasSufficientBalance = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!authenticated) return false;

    try {
      const userAddress = await getUserAddress();
      if (!userAddress) return false;

      const balance = await getTokenBalance(tokenAddress, userAddress);
      return parseFloat(balance) >= parseFloat(amount);
    } catch (err) {
      console.error('Failed to check balance:', err);
      return false;
    }
  }, [authenticated, getUserAddress, getTokenBalance]);

  // Get user's trading session info
  const getUserInfo = useCallback(() => {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email?.address,
      wallet: user.wallet?.address,
      createdAt: user.createdAt,
    };
  }, [user]);

  // Clear any errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Authentication state
    isAuthenticated: authenticated,
    isReady: ready,
    isLoading,
    error,
    
    // User info
    user: getUserInfo(),
    userAddress: getUserAddress,
    
    // Authentication methods
    login,
    logout,
    
    // Trading methods
    executeAutonomousTrade,
    getTokenBalance,
    approveTokenSpending,
    hasSufficientBalance,
    
    // Utility methods
    clearError,
  };
}
