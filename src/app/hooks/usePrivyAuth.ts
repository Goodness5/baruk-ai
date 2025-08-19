'use client';

import { usePrivy, useWallets, useSendTransaction } from '@privy-io/react-auth';
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
  const { sendTransaction } = useSendTransaction();
  
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
      // Send transaction using Privy v2 sendTransaction hook
      const hash = await sendTransaction(
        {
          to: to as `0x${string}`,
          data: data as `0x${string}`,
          value: value ? BigInt(value) : 0n,
          chainId: 1328, // Sei testnet chain ID
        },
        { address: embeddedWallet.address }
      );
      
      return hash.hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw new Error(`Autonomous trade failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, embeddedWallet]);

  // Get user's token balance - simplified for Privy v2
  const getTokenBalance = useCallback(async (
    _tokenAddress: string, // Unused parameter prefixed with underscore
    _userAddress: string   // Unused parameter prefixed with underscore
  ): Promise<string> => {
    // TODO: Implement token balance checking using Privy v2 APIs
    // For now, return a placeholder value
    return '0';
  }, [authenticated, embeddedWallet]);

  // Approve token spending for autonomous trading - simplified for Privy v2
  const approveTokenSpending = useCallback(async (
    _tokenAddress: string,  // Unused parameter prefixed with underscore
    _spenderAddress: string, // Unused parameter prefixed with underscore
    _amount: string         // Unused parameter prefixed with underscore
  ): Promise<boolean> => {
    // TODO: Implement token approval using Privy v2 APIs
    // For now, return false to indicate approval is needed
    return false;
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
