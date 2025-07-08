import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum';

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
  if (addresses.length === 0) return {};
  const params = new URLSearchParams({
    contract_addresses: addresses.join(','),
    vs_currencies: 'usd'
  });
  const res = await fetch(`${COINGECKO_URL}?${params.toString()}`);
  if (!res.ok) return {};
  const data = await res.json();
  const prices: Record<string, number> = {};
  for (const [address, obj] of Object.entries(data)) {
    if (obj && typeof obj === 'object' && 'usd' in obj) {
      prices[address.toLowerCase()] = Number(obj.usd);
    }
  }
  return prices;
}

export async function POST(req: NextRequest) {
  const { addresses } = await req.json();
  if (!Array.isArray(addresses)) {
    return NextResponse.json({ error: 'Invalid addresses' }, { status: 400 });
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