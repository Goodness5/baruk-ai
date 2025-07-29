import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { DirectSecp256k1HdWallet, OfflineSigner } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { Window as KeplrWindow } from '@keplr-wallet/types';

export type WalletType = 'evm-external' | 'evm-internal' | 'cosmos-external' | 'cosmos-internal' | null;

export interface UnifiedWalletState {
  type: WalletType;
  address: string | null;
  chain: 'evm' | 'cosmos' | null;
  provider: unknown;
  signer: unknown;
  accounts: string[]; // All available accounts
  currentAccountIndex: number; // Current account index
  chainId: string | null; // Current chain ID
  connect: (opts?: { type?: WalletType }) => Promise<void>;
  disconnect: () => void;
  switchAccount: (index: number) => Promise<void>;
  switchChain: (chainId: string) => Promise<void>;
  signAndSend: (tx: unknown, opts?: unknown) => Promise<unknown>;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useUnifiedWallet(): UnifiedWalletState {
  const [type, setType] = useState<WalletType>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chain, setChain] = useState<'evm' | 'cosmos' | null>(null);
  const [provider, setProvider] = useState<unknown>(null);
  const [signer, setSigner] = useState<unknown>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState<number>(0);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced MetaMask connection with full account management
  const connectEvmExternal = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('No EVM wallet found');
    }

    setIsConnecting(true);
    setError(null);

    try {
      if (window.ethereum && typeof window.ethereum.request === 'function') {
        // Check if MetaMask is already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        setAccounts(accounts);
        
        if (accounts.length === 0) {
          // If no accounts are connected, request connection
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        
        // Get current chain ID
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
        setChainId(currentChainId);

        // Get the currently selected account
        const selectedAccounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        const currentAddress = selectedAccounts[0];
        const currentIndex = accounts.findIndex((acc) => acc.toLowerCase() === currentAddress.toLowerCase());
        
        // Create provider and signer
        if (!window.ethereum) throw new Error('window.ethereum is not available');
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        const ethersSigner = await ethersProvider.getSigner();
        
        setType('evm-external');
        setChain('evm');
        setProvider(ethersProvider);
        setSigner(ethersSigner);
        setAddress(currentAddress);
        setCurrentAccountIndex(currentIndex >= 0 ? currentIndex : 0);
        setIsConnected(true);
        setIsConnecting(false);
      } else {
        throw new Error('window.ethereum is not available or does not support request');
      }
    } catch (error: unknown) {
      setError((error as { message?: string })?.message ?? (typeof error === 'string' ? error : null));
      setIsConnecting(false);
      throw error;
    }
  }, []);

  // Switch to a different account
  const switchAccount = useCallback(async (index: number) => {
    if (!window.ethereum || type !== 'evm-external') {
      throw new Error('MetaMask not connected');
    }

    try {
      // MetaMask doesn't have a direct method to switch accounts
      // We need to request the user to switch manually
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const newAddress = accounts[index];
      
      if (newAddress) {
        if (!window.ethereum) throw new Error('window.ethereum is not available');
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        const ethersSigner = await ethersProvider.getSigner();
        
        setAddress(newAddress);
        setCurrentAccountIndex(index);
        setSigner(ethersSigner);
        
        console.log('Switched to account:', newAddress);
      }
    } catch (error: unknown) {
      setError((error as { message?: string })?.message ?? (typeof error === 'string' ? error : null));
      throw error;
    }
  }, [type]);

  // Create internal EVM wallet
  const connectEvmInternal = useCallback(async () => {
    let mnemonic = localStorage.getItem('evm_mnemonic');
    if (!mnemonic) {
      mnemonic = ethers.Wallet.createRandom().mnemonic?.phrase || ethers.Wallet.createRandom().privateKey;
      localStorage.setItem('evm_mnemonic', mnemonic);
    }
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    setType('evm-internal');
    setChain('evm');
    setProvider(null);
    setSigner(wallet);
    setAddress(wallet.address);
    setIsConnected(true);
  }, []);

  // Connect to external Cosmos wallet (Keplr, Compass, Leap)
  const connectCosmosExternal = useCallback(async () => {
    const keplr = (window as KeplrWindow).keplr;
    if (!keplr) throw new Error('No Keplr/Compass/Leap wallet found');
    const chainId = 'atlantic-2'; // SEI testnet chain ID
    await keplr.enable(chainId);
    const offlineSigner = keplr.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    setType('cosmos-external');
    setChain('cosmos');
    setProvider(keplr);
    setSigner(offlineSigner);
    setAddress(accounts[0].address);
    setIsConnected(true);
  }, []);

  // Create internal Cosmos wallet
  const connectCosmosInternal = useCallback(async () => {
    let mnemonic = localStorage.getItem('cosmos_mnemonic');
    if (!mnemonic) {
      mnemonic = (await DirectSecp256k1HdWallet.generate(24)).mnemonic;
      localStorage.setItem('cosmos_mnemonic', mnemonic);
    }
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'sei' });
    const [account] = await wallet.getAccounts();
    setType('cosmos-internal');
    setChain('cosmos');
    setProvider(null);
    setSigner(wallet);
    setAddress(account.address);
    setIsConnected(true);
  }, []);

  // Unified connect method
  const connect = useCallback(async (opts?: { type?: WalletType }) => {
    if (opts?.type === 'evm-external') return connectEvmExternal();
    if (opts?.type === 'evm-internal') return connectEvmInternal();
    if (opts?.type === 'cosmos-external') return connectCosmosExternal();
    if (opts?.type === 'cosmos-internal') return connectCosmosInternal();
    // Default: prompt user (could show modal in UI)
    // For now, try EVM external, then Cosmos external, then internal
    try {
      await connectEvmExternal();
    } catch {
      try {
        await connectCosmosExternal();
      } catch {
        await connectEvmInternal();
      }
    }
  }, [connectEvmExternal, connectEvmInternal, connectCosmosExternal, connectCosmosInternal]);

  const disconnect = useCallback(() => {
    setType(null);
    setChain(null);
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
  }, []);

  // Switch to a different chain
  const switchChain = useCallback(async (targetChainId: string) => {
    // Handle Cosmos chains (SEI)
    if (targetChainId === 'atlantic-2' || targetChainId === 'pacific-1') {
      // For SEI, we need to connect to Cosmos wallet instead
      console.log('Switching to SEI chain:', targetChainId);
      try {
        // We'll handle this in the connect method
        await connect({ type: 'cosmos-external' });
        setChainId(targetChainId);
        console.log('Connected to SEI:', targetChainId);
      } catch (error: unknown) {
        setError((error as { message?: string })?.message ?? (typeof error === 'string' ? error : null));
        throw error;
      }
      return;
    }

    // Handle EVM chains
    if (!window.ethereum || type !== 'evm-external') {
      throw new Error('MetaMask not connected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      
      // Update chain ID
      const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(newChainId as string);
      
      console.log('Switched to chain:', newChainId);
    } catch (error: unknown) {
      setError((error as { message?: string })?.message ?? (typeof error === 'string' ? error : null));
      throw error;
    }
  }, [type, connect]);

  // Enhanced MetaMask event listeners
  useEffect(() => {
    if (window.ethereum && type === 'evm-external') {
      const handleAccountsChanged = async (accounts: string[]) => {
        console.log('MetaMask accounts changed:', accounts);
        
        if (accounts.length === 0) {
          // User disconnected
          disconnect();
        } else {
          // User switched accounts or new account added
          const newAddress = accounts[0];
          const newIndex = accounts.findIndex((acc: string) => acc.toLowerCase() === newAddress.toLowerCase());
          
          // Update provider and signer
          if (!window.ethereum) throw new Error('window.ethereum is not available');
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          const ethersSigner = await ethersProvider.getSigner();
          
          setAccounts(accounts);
          setAddress(newAddress);
          setCurrentAccountIndex(newIndex >= 0 ? newIndex : 0);
          setSigner(ethersSigner);
          
          console.log('MetaMask account changed to:', newAddress, 'index:', newIndex);
        }
      };

      const handleChainChanged = async (chainId: string) => {
        console.log('MetaMask chain changed to:', chainId);
        setChainId(chainId);
        
        // Update provider and signer for new chain
        if (!window.ethereum) throw new Error('window.ethereum is not available');
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        const ethersSigner = await ethersProvider.getSigner();
        setProvider(ethersProvider);
        setSigner(ethersSigner);
      };

      const handleConnect = (connectInfo: { chainId: string }) => {
        console.log('MetaMask connected to chain:', connectInfo.chainId);
        setChainId(connectInfo.chainId);
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        console.log('MetaMask disconnected:', error);
        disconnect();
      };

      // Adapter event handlers for MetaMask
      const accountsChangedAdapter = (...args: unknown[]) => {
        if (Array.isArray(args[0]) && args[0].every(a => typeof a === 'string')) {
          handleAccountsChanged(args[0] as string[]);
        }
      };
      const chainChangedAdapter = (...args: unknown[]) => {
        if (typeof args[0] === 'string') {
          handleChainChanged(args[0]);
        }
      };
      const connectAdapter = (...args: unknown[]) => {
        if (typeof args[0] === 'object' && args[0] !== null && 'chainId' in args[0]) {
          handleConnect(args[0] as { chainId: string });
        }
      };
      const disconnectAdapter = (...args: unknown[]) => {
        if (typeof args[0] === 'object' && args[0] !== null && 'code' in args[0] && 'message' in args[0]) {
          handleDisconnect(args[0] as { code: number; message: string });
        }
      };
      if (typeof window.ethereum.on === 'function') {
        window.ethereum.on('accountsChanged', accountsChangedAdapter);
        window.ethereum.on('chainChanged', chainChangedAdapter);
        window.ethereum.on('connect', connectAdapter);
        window.ethereum.on('disconnect', disconnectAdapter);
      }

      return () => {
        if (typeof window.ethereum?.removeListener === 'function') {
          window.ethereum.removeListener('accountsChanged', accountsChangedAdapter);
          window.ethereum.removeListener('chainChanged', chainChangedAdapter);
          window.ethereum.removeListener('connect', connectAdapter);
          window.ethereum.removeListener('disconnect', disconnectAdapter);
        }
      };
    }
  }, [type, disconnect]);

  // Unified sign and send
  const signAndSend = useCallback(async (tx: unknown) => {
    if (chain === 'evm') {
      // EVM: tx is ethers.js transaction request
      if (!signer) throw new Error('No EVM signer');
      return await (signer as { sendTransaction: (tx: unknown) => Promise<unknown> }).sendTransaction(tx);
    } else if (chain === 'cosmos') {
      // Cosmos: tx is { msgs, fee, memo, chainId, rpc }
      if (!signer || !address) throw new Error('No Cosmos signer');
      const cosmosTx = tx as { rpc: string; msgs: unknown[]; fee: unknown; memo?: string };
      const client = await SigningStargateClient.connectWithSigner(cosmosTx.rpc, signer as OfflineSigner);
      return await client.signAndBroadcast(
        address,
        cosmosTx.msgs as import('@cosmjs/proto-signing').EncodeObject[],
        cosmosTx.fee as import('@cosmjs/stargate').StdFee,
        cosmosTx.memo || ''
      );
    }
    throw new Error('No wallet connected');
  }, [chain, signer, address]);

  return {
    type,
    address,
    chain,
    provider,
    signer,
    accounts,
    currentAccountIndex,
    chainId,
    connect,
    disconnect,
    switchAccount,
    switchChain,
    signAndSend,
    isConnected,
    isConnecting,
    error,
  };
} 