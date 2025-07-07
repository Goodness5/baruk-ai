export async function fetchTokenPrices(addresses: string[]): Promise<Record<string, number>> {
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