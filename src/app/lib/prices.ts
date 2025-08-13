export async function fetchTokenPrices(addresses: string[], chainId?: number): Promise<Record<string, number>> {
  if (addresses.length === 0) return {};
  
  // Check if we're on a testnet chain that price APIs don't support
  if (chainId === 1328) {
    console.log('🔄 Sei Network testnet detected - using mock prices for all tokens');
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
    
    return result;
  }
  
  // Mock prices for test tokens
  const mockPrices: Record<string, number> = {
    '0x8923889697C9467548ABe8E815105993EBC785b6': 1.5, // TOKEN0
    '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7': 2.3, // TOKEN1
    '0xD6383ef8A67E929274cE9ca05b694f782A5070D7': 0.8, // TOKEN2
  };
  
  // Filter out test tokens and get their mock prices
  const testTokenPrices: Record<string, number> = {};
  const realTokenAddresses: string[] = [];
  
  addresses.forEach(address => {
    const lowerAddress = address.toLowerCase();
    if (mockPrices[address]) {
      testTokenPrices[lowerAddress] = mockPrices[address];
    } else {
      realTokenAddresses.push(address);
    }
  });
  
  // Fetch real prices for non-test tokens
  let realPrices: Record<string, number> = {};
  if (realTokenAddresses.length > 0) {
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: realTokenAddresses, chainId })
      });
      if (res.ok) {
        realPrices = await res.json();
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch real token prices, using mock prices as fallback:', error);
    }
  }
  
  // Combine mock and real prices
  return { ...testTokenPrices, ...realPrices };
} 