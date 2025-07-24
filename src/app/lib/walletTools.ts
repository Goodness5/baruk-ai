import { createWalletClient, http, createPublicClient, Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { seiTestnet } from '../../chains/seiTestnet';

export interface WalletResponse {
  address: string;
  privateKey?: string;
  type: 'external' | 'internal';
  status: 'active' | 'pending';
  message?: string;
}

export async function createInternalWallet(): Promise<WalletResponse> {
  try {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    
    const walletClient = createWalletClient({
      account,
      chain: seiTestnet,
      transport: http()
    });

    return {
      address: account.address,
      privateKey: privateKey as string,
      type: 'internal',
      status: 'active'
    };
  } catch (error) {
    console.error('Failed to create internal wallet:', error);
    return {
      address: '',
      type: 'internal',
      status: 'pending',
      message: 'Failed to create internal wallet'
    };
  }
}

export async function importWallet(privateKey: Hex): Promise<WalletResponse> {
  try {
    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      chain: seiTestnet,
      transport: http()
    });

    return {
      address: account.address,
      type: 'internal',
      status: 'active'
    };
  } catch (error) {
    console.error('Failed to import wallet:', error);
    return {
      address: '',
      type: 'internal',
      status: 'pending',
      message: 'Failed to import wallet'
    };
  }
}

export async function validateExternalWallet(address: string): Promise<boolean> {
  try {
    const publicClient = createPublicClient({
      chain: seiTestnet,
      transport: http()
    });

    const code = await publicClient.getBytecode({ address: address as `0x${string}` });
    // If it's a contract address, return false
    if (code) return false;

    // Check if it's a valid address format
    return address.startsWith('0x') && address.length === 42;
  } catch (error) {
    return false;
  }
}
