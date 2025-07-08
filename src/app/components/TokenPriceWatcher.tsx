"use client"
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchTokenPrices } from '../lib/prices';

export default function TokenPriceWatcher() {
  const tokens = useAppStore(s => s.tokens);
  const setTokenPrices = useAppStore(s => s.setTokenPrices);
  const setTokenPricesLoading = useAppStore(s => s.setTokenPricesLoading);
  const setTokenPricesError = useAppStore(s => s.setTokenPricesError);

  useEffect(() => {
    let active = true;
    async function fetchPrices() {
      setTokenPricesLoading(true);
      setTokenPricesError(null);
      try {
        const prices = await fetchTokenPrices(tokens.map(t => t.address));
        if (active) setTokenPrices(prices);
      } catch (err: any) {
        if (active) setTokenPricesError(err?.message || 'Failed to fetch prices');
      } finally {
        if (active) setTokenPricesLoading(false);
      }
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [tokens, setTokenPrices, setTokenPricesLoading, setTokenPricesError]);

  return null;
} 