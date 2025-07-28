import { create } from 'zustand';

export type Token = {
  symbol: string;
  address: string;
};

export type Balance = {
  token: string;
  symbol: string;
  amount: string;
  decimals: number;
  type?: 'native' | 'erc20';
  name?: string;
};

interface AppState {
  address: string | null;
  tokens: Token[];
  balances: Balance[];
  balancesLoading: boolean;
  balancesError: string | null;
  tokenPrices: Record<string, number>;
  tokenPricesLoading: boolean;
  tokenPricesError: string | null;
  setAddress: (address: string | null) => void;
  setTokens: (tokens: Token[]) => void;
  setBalances: (balances: Balance[]) => void;
  setBalancesLoading: (loading: boolean) => void;
  setBalancesError: (error: string | null) => void;
  setTokenPrices: (prices: Record<string, number>) => void;
  setTokenPricesLoading: (loading: boolean) => void;
  setTokenPricesError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  address: null,
  tokens: [
    { symbol: 'TOKEN0', address: '0x8923889697C9467548ABe8E815105993EBC785b6' },
    { symbol: 'TOKEN1', address: '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7' },
    { symbol: 'TOKEN2', address: '0xD6383ef8A67E929274cE9ca05b694f782A5070D7' },
  ],
  balances: [],
  balancesLoading: false,
  balancesError: null,
  tokenPrices: {},
  tokenPricesLoading: false,
  tokenPricesError: null,
  setAddress: (address) => set({ address }),
  setTokens: (tokens) => set({ tokens }),
  setBalances: (balances) => set({ balances }),
  setBalancesLoading: (loading) => set({ balancesLoading: loading }),
  setBalancesError: (error) => set({ balancesError: error }),
  setTokenPrices: (prices) => set({ tokenPrices: prices }),
  setTokenPricesLoading: (loading) => set({ tokenPricesLoading: loading }),
  setTokenPricesError: (error) => set({ tokenPricesError: error }),
})); 