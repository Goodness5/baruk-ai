"use client"
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchBalances } from '../lib/balance';

export default function BalanceWatcher() {
  const address = useAppStore(s => s.address);
  const tokens = useAppStore(s => s.tokens);
  const setBalances = useAppStore(s => s.setBalances);
  const setBalancesLoading = useAppStore(s => s.setBalancesLoading);
  const setBalancesError = useAppStore(s => s.setBalancesError);

  useEffect(() => {
    if (!address) {
      setBalances([]);
      setBalancesLoading(false);
      setBalancesError(null);
      return;
    }
    setBalancesLoading(true);
    setBalancesError(null);
    fetchBalances(address, tokens)
      .then(balances => {
        setBalances(balances);
        setBalancesLoading(false);
      })
      .catch(err => {
        setBalancesError(err?.message || 'Failed to fetch balances');
        setBalancesLoading(false);
      });
  }, [address, tokens, setBalances, setBalancesLoading, setBalancesError]);

  return null;
} 