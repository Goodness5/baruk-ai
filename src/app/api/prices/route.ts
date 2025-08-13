import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || '';

async function fetchSyvePrices(addresses: string[]): Promise<Record<string, number>> {
  if (addresses.length === 0) return {};
  const filters = addresses.map(addr => ({
    type: 'eq',
    params: { field: 'token_address', value: addr }
  }));
  const body = {
    filter: filters.length === 1 ? filters[0] : { type: 'or', params: { filters } },
    options: [
      { type: 'sort', params: { field: 'block_number', value: 'desc' } },
      { type: 'size', params: { value: 1 } }
    ]
  };
  const res = await fetch('https://api.syve.ai/v1/prices_usd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) return {};
  const data = await res.json();
  const results = data.results || [];
  const prices: Record<string, number> = {};
  for (const r of results) {
    prices[r.token_address.toLowerCase()] = Number(r.price_usd_token);
  }
  return prices;
}

async function fetchCoinGeckoPrices(addresses: string[]): Promise<Record<string, number>> {
  const params = new URLSearchParams({
    ids: addresses.join(','),
    vs_currencies: 'usd'
  });
  try {
    const res = await fetch(`${COINGECKO_URL}?${params.toString()}`, {
      headers: {
        'x-cg-pro-api-key': COINGECKO_API_KEY
      }
    });
    if (!res.ok) return {};
    const data = await res.json();
    const prices: Record<string, number> = {};
    for (const id of addresses) {
      if (data[id] && data[id].usd) prices[id] = data[id].usd;
    }
    return prices;
  } catch (e) {
    console.error('CoinGecko fetch failed:', e);
    return {};
  }
}

export async function POST(req: NextRequest) {
  const { addresses, chainId } = await req.json();
  if (!Array.isArray(addresses)) {
    return NextResponse.json({ error: 'Invalid addresses' }, { status: 400 });
  }
  
  // Check if we're on a testnet chain that price APIs don't support
  if (chainId === 1328) {
    console.log('🔄 Sei Network testnet detected - returning mock prices to avoid API errors');
    // Return mock prices for testnet to avoid API errors
    const mockPrices: Record<string, number> = {
      '0x8923889697C9467548ABe8E815105993EBC785b6': 1.5, // TOKEN0
      '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7': 2.3, // TOKEN1
      '0xD6383ef8A67E929274cE9ca05b694f782A5070D7': 0.8, // TOKEN2
      'native': 0.487, // SEI native token
    };
    
    // Return mock prices for all addresses
    const result: Record<string, number> = {};
    addresses.forEach(address => {
      const lowerAddress = address.toLowerCase();
      if (address === 'native') {
        result[lowerAddress] = mockPrices.native;
      } else if (mockPrices[address]) {
        result[lowerAddress] = mockPrices[address];
      } else {
        // Default mock price for unknown tokens on testnet
        result[lowerAddress] = 1.0;
      }
    });
    
    return NextResponse.json(result);
  }
  
  // Try syve first
  const syvePrices = await fetchSyvePrices(addresses);
  // Fallback to CoinGecko for missing
  const missing = addresses.filter(addr => !syvePrices[addr.toLowerCase()]);
  let geckoPrices: Record<string, number> = {};
  if (missing.length > 0) {
    geckoPrices = await fetchCoinGeckoPrices(missing);
  }
  const prices = { ...syvePrices, ...geckoPrices };
  return NextResponse.json(prices);
} 