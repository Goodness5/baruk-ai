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