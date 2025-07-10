"use client"
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchBalancesWithRetry } from '../lib/balance';
import { useUnifiedWallet } from '../lib/unifiedWallet';

export default function BalanceWatcher() {
  const address = useAppStore(s => s.address);
  const balances = useAppStore(s => s.balances);
  const balancesLoading = useAppStore(s => s.balancesLoading);
  const balancesError = useAppStore(s => s.balancesError);
  const setBalances = useAppStore(s => s.setBalances);
  const setBalancesLoading = useAppStore(s => s.setBalancesLoading);
  const setBalancesError = useAppStore(s => s.setBalancesError);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const { isConnected, type } = useUnifiedWallet();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Use Baruk test tokens for balance watching
  const tokens = [
    { symbol: 'TOKEN0', address: '0x8923889697C9467548ABe8E815105993EBC785b6' },
    { symbol: 'TOKEN1', address: '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7' },
    { symbol: 'TOKEN2', address: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7' },
  ];

  const fetchAndUpdateBalances = async () => {
    if (!address || !isConnected) {
      setBalances([]);
      setBalancesLoading(false);
      setBalancesError(null);
      return;
    }
    
    setBalancesLoading(true);
    setBalancesError(null);
    
    try {
      const newBalances = await fetchBalancesWithRetry(address, tokens);
      setBalances(newBalances);
      setBalancesLoading(false);
      setLastUpdate(new Date());
    } catch (err: any) {
      setBalancesError(err?.message || 'Failed to fetch balances');
      setBalancesLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAndUpdateBalances();
  }, [address, tokens, isConnected]);

  // Real-time updates every 10 seconds
  useEffect(() => {
    if (!address || !isConnected) return;
    
    const interval = setInterval(fetchAndUpdateBalances, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [address, tokens, isConnected]);

  // Don't render anything if not connected
  if (!isConnected || !address) return null;

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
    <div className="holo-surface border-b p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span>💰</span>
            Piggy-Pocket Coins
            <span className="text-xs text-purple-300">
              ({type?.includes('internal') ? 'Internal' : 'External'} Wallet)
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
                  className="glass-card p-3"
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