export async function fetchTokenPrices(addresses: string[]): Promise<Record<string, number>> {
  if (addresses.length === 0) return {};
  const res = await fetch('/api/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses })
  });
  if (!res.ok) return {};
  return await res.json();
} 