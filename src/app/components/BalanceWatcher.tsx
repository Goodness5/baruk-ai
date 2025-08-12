"use client"
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getWalletTokenHoldings } from '../lib/barukTools';
import { usePrivy } from '@privy-io/react-auth';
import { TokenHolding, TokenError } from '../lib/types';

export default function BalanceWatcher() {
  const address = useAppStore(s => s.address);
  const balances = useAppStore(s => s.balances);
  const balancesLoading = useAppStore(s => s.balancesLoading);
  const balancesError = useAppStore(s => s.balancesError);
  const setBalances = useAppStore(s => s.setBalances);
  const setBalancesLoading = useAppStore(s => s.setBalancesLoading);
  const setBalancesError = useAppStore(s => s.setBalancesError);
  const setAddress = useAppStore(s => s.setAddress);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const { authenticated, user } = usePrivy();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Get user's wallet address from Privy
  let currentAddress: string | null = null;
  
  if (user?.wallet?.address) {
    // Handle case where address might be an object
    if (typeof user.wallet.address === 'string') {
      currentAddress = user.wallet.address;
    } else if (typeof user.wallet.address === 'object' && user.wallet.address !== null) {
      // If it's an object, try to extract the address string
      currentAddress = (user.wallet.address as { address?: string }).address || null;
    }
  }
  
  // Use the Privy address if available, otherwise fall back to store address
  currentAddress = currentAddress || address;
  
  console.log('BalanceWatcher Debug:', {
    authenticated,
    privyAddress: currentAddress,
    storeAddress: address,
    currentAddress,
    balancesLength: balances.length
  });
  
  // Use Baruk test tokens for balance watching
  // Common tokens to watch for
  const tokens = useMemo(() => [
    // Sei Test Tokens
    { symbol: 'SEI', address: 'native' }, // Native SEI token
    { symbol: 'TOKEN0', address: '0x8923889697C9467548ABe8E815105993EBC785b6' },
    { symbol: 'TOKEN1', address: '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7' },
    { symbol: 'TOKEN2', address: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7' },
  ], []);

  const fetchAndUpdateBalances = useCallback(async () => {
    console.log('fetchAndUpdateBalances called:', { currentAddress, authenticated });
    
    if (!currentAddress || !authenticated) {
      console.log('Not fetching balances - not authenticated or no address');
      setBalances([]);
      setBalancesLoading(false);
      setBalancesError(null);
      return;
    }
    
    setBalancesLoading(true);
    setBalancesError(null);
    
    try {
      console.log('Fetching balances for address:', currentAddress);
      const holdings = await getWalletTokenHoldings(currentAddress) as (TokenHolding[] | TokenError[]);
      console.log('Raw holdings:', holdings);
      
      if (Array.isArray(holdings) && 'contract_address' in (holdings[0] || {})) {
        const newBalances = (holdings as TokenHolding[]).map(token => ({
          token: token.contract_address,
          symbol: token.symbol,
          amount: token.balance,
          decimals: token.decimals,
          type: token.type,
          name: token.name
        }));
        console.log('Processed balances:', newBalances);
        setBalances(newBalances);
        setBalancesLoading(false);
        setLastUpdate(new Date());
      } else if ('error' in (holdings[0] || {})) {
        console.log('Error in holdings:', holdings[0]);
        setBalancesError((holdings[0] as TokenError).error);
        setBalancesLoading(false);
      }
    } catch (err: unknown) {
      console.error('Error fetching balances:', err);
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setBalancesError((err as { message?: string }).message || 'Failed to fetch balances');
      } else {
        setBalancesError('Failed to fetch balances');
      }
      setBalancesLoading(false);
    }
  }, [currentAddress, authenticated, setBalances, setBalancesLoading, setBalancesError]);

  // Synchronize Privy address with app store and backend
  useEffect(() => {
    const syncWalletState = async () => {
      if (currentAddress && currentAddress !== address) {
        console.log('Syncing Privy address to app store:', currentAddress);
        setAddress(currentAddress);
        
        // Also sync with backend
        try {
          const response = await fetch('/api/wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'connect',
              userId: currentAddress,
              address: currentAddress,
              type: 'embedded'
            }),
          });
          
          if (response.ok) {
            console.log('Backend wallet connection synchronized');
          } else {
            console.error('Failed to sync wallet with backend');
          }
        } catch (error) {
          console.error('Error syncing wallet with backend:', error);
        }
      } else if (!currentAddress && address) {
        console.log('Clearing app store address - wallet disconnected');
        setAddress(null);
        
        // Also disconnect from backend
        try {
          await fetch('/api/wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'disconnect',
              userId: address
            }),
          });
        } catch (error) {
          console.error('Error disconnecting wallet from backend', error);
        }
      }
    };

    syncWalletState();
  }, [currentAddress, address, setAddress]);

  // Initial fetch
  useEffect(() => {
    fetchAndUpdateBalances();
  }, [currentAddress, tokens, authenticated, fetchAndUpdateBalances]);

  // Real-time updates every 10 seconds
  useEffect(() => {
    if (!currentAddress || !authenticated) return;
    const interval = setInterval(fetchAndUpdateBalances, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [currentAddress, tokens, authenticated, fetchAndUpdateBalances]);

  // Don't render anything if not authenticated
  if (!authenticated || !currentAddress) return null;

  const getTokenSymbol = (tokenAddress: string) => {
    return tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase())?.symbol || 'Unknown';
  };

  const getTokenPrice = (tokenAddress: string) => {
    return tokenPrices[tokenAddress.toLowerCase()] || 0;
  };

  const getUSDValue = (tokenAddress: string, amount: string) => {
    const price = getTokenPrice(tokenAddress);
    const amountNum = parseFloat(amount) || 0;
    return (price * amountNum).toFixed(2);
  };

  const formatBalance = (amount: string) => {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(4);
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/50 via-blue-900/50 to-green-900/50 border-b border-purple-700/30 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span>💰</span>
            Wallet Balances
            <span className="text-xs text-purple-300">
              (Connected Wallet)
            </span>
          </h3>
          <div className="text-xs text-purple-300">
            Last updated: {lastUpdate.toLocaleTimeString()}
            {balances.length > 0 && (
              <button
                onClick={fetchAndUpdateBalances}
                className="ml-2 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs transition"
              >
                🔄 Refresh
              </button>
            )}
          </div>
        </div>
        
        {balances.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {balances.map((balance) => {
              const symbol = getTokenSymbol(balance.token);
              const usdValue = getUSDValue(balance.token, balance.amount);
              const formattedBalance = formatBalance(balance.amount);
              
              return (
                <div
                  key={balance.token}
                  className="bg-gradient-to-br from-[#2d193c]/80 via-[#1e2e2e]/80 to-[#3a1c4a]/80 rounded-lg p-3 border border-purple-700/30"
                >
                  <div className="text-white font-semibold text-sm">{symbol}</div>
                  <div className="text-purple-300 text-xs mt-1">
                    {formattedBalance}
                  </div>
                  {parseFloat(usdValue) > 0 && (
                    <div className="text-green-400 text-xs mt-1">
                      ${usdValue}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            {balancesLoading ? (
              <div className="text-purple-300">Loading balances...</div>
            ) : balancesError ? (
              <div className="text-red-400">Error: {balancesError}</div>
            ) : (
              <div className="text-purple-300">No token balances found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 