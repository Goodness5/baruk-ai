"use client";
import { useState, useEffect } from 'react';
import { useUnifiedWallet, WalletType } from '../lib/unifiedWallet';
import { useAppStore } from '../store/useAppStore';

// Common chain configurations
const SUPPORTED_CHAINS = [
  { id: '0x1', name: 'Ethereum Mainnet', symbol: 'ETH' },
  { id: '0x89', name: 'Polygon', symbol: 'MATIC' },
  { id: '0xa', name: 'Optimism', symbol: 'ETH' },
  { id: '0xa4b1', name: 'Arbitrum', symbol: 'ETH' },
  { id: '0x38', name: 'BSC', symbol: 'BNB' },
  { id: '0x5', name: 'Goerli Testnet', symbol: 'ETH' },
  { id: '0xaa36a7', name: 'Sepolia Testnet', symbol: 'ETH' },
  { id: '0x1a4', name: 'Optimism Goerli', symbol: 'ETH' },
  { id: '0x66eed', name: 'Arbitrum Goerli', symbol: 'ETH' },
  { id: 'atlantic-2', name: 'SEI Testnet', symbol: 'SEI', isCosmos: true },
  { id: 'pacific-1', name: 'SEI Mainnet', symbol: 'SEI', isCosmos: true },
];

declare global {
  interface Window {
    ethereum?: any;
    keplr?: any;
  }
}

export default function ConnectWallet() {
  const { 
    type, 
    address, 
    chain, 
    accounts, 
    currentAccountIndex, 
    chainId,
    connect, 
    disconnect, 
    switchAccount,
    switchChain,
    isConnected,
    isConnecting,
    error
  } = useUnifiedWallet();
  const setAddress = useAppStore(s => s.setAddress);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);

  // Sync unified wallet address to app store whenever it changes
  useEffect(() => {
    console.log('Syncing wallet address to app store:', address);
    setAddress(address);
  }, [address, setAddress]);

  const handleConnect = async (walletType?: WalletType) => {
    try {
      await connect({ type: walletType });
      setShowWalletOptions(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(`Failed to connect wallet: ${error}`);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setAddress(null);
  };

  const getWalletDisplayName = () => {
    if (!type) return 'Connect Wallet';
    const typeMap = {
      'evm-external': 'MetaMask',
      'evm-internal': 'EVM (Internal)',
      'cosmos-external': 'Keplr/SEI',
      'cosmos-internal': 'Cosmos (Internal)',
    };
    
    if (type === 'evm-external' && accounts.length > 1) {
      return `${typeMap[type]} (${currentAccountIndex + 1}/${accounts.length}) - ${address?.slice(0, 6)}...${address?.slice(-4)}`;
    }
    
    return `${typeMap[type]} - ${address?.slice(0, 6)}...${address?.slice(-4)}`;
  };

  const getWalletIcon = () => {
    if (!type) return '🔗';
    const iconMap = {
      'evm-external': '🦊',
      'evm-internal': '💻',
      'cosmos-external': '🌌',
      'cosmos-internal': '💻',
    };
    return iconMap[type];
  };

  return (
    <div className="relative">
      {isConnected ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAccountSelector(!showAccountSelector)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <span>{getWalletIcon()}</span>
              <span>{getWalletDisplayName()}</span>
              {accounts.length > 1 && <span className="text-xs">▼</span>}
            </button>
            <button
              onClick={() => setShowChainSelector(!showChainSelector)}
              className="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              title="Switch Chain"
            >
              ⚡
            </button>
            <button
              onClick={handleDisconnect}
              className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              title="Disconnect"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowWalletOptions(!showWalletOptions)}
          disabled={isConnecting}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white rounded-lg hover:opacity-90 transition disabled:opacity-60"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-600 text-white text-xs rounded z-50 max-w-xs">
          {error}
        </div>
      )}

      {showWalletOptions && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] rounded-lg shadow-xl border border-purple-700 p-4 z-50">
          <div className="text-white font-semibold mb-3">Choose Wallet</div>
          
          {/* EVM Wallets */}
          <div className="mb-4">
            <div className="text-purple-300 text-sm mb-2">Ethereum (EVM)</div>
            <div className="space-y-2">
              <button
                onClick={() => handleConnect('evm-external')}
                className="w-full text-left px-3 py-2 bg-[#1e2e2e] hover:bg-[#2d193c] rounded text-white text-sm transition flex items-center gap-2"
              >
                <span>🦊</span>
                <span>MetaMask / WalletConnect</span>
              </button>
              <button
                onClick={() => handleConnect('evm-internal')}
                className="w-full text-left px-3 py-2 bg-[#1e2e2e] hover:bg-[#2d193c] rounded text-white text-sm transition flex items-center gap-2"
              >
                <span>💻</span>
                <span>In-Browser Wallet (No Extension)</span>
              </button>
            </div>
          </div>

          {/* Cosmos Wallets */}
          <div className="mb-4">
            <div className="text-purple-300 text-sm mb-2">Cosmos (SEI)</div>
            <div className="space-y-2">
              <button
                onClick={() => handleConnect('cosmos-external')}
                className="w-full text-left px-3 py-2 bg-[#1e2e2e] hover:bg-[#2d193c] rounded text-white text-sm transition flex items-center gap-2"
              >
                <span>🌌</span>
                <span>Keplr / Compass / Leap (SEI)</span>
              </button>
              <button
                onClick={() => handleConnect('cosmos-internal')}
                className="w-full text-left px-3 py-2 bg-[#1e2e2e] hover:bg-[#2d193c] rounded text-white text-sm transition flex items-center gap-2"
              >
                <span>💻</span>
                <span>In-Browser Wallet (No Extension)</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-purple-400 text-center">
            Internal wallets are stored securely in your browser
          </div>
        </div>
      )}

      {/* Account Selector Dropdown */}
      {showAccountSelector && type === 'evm-external' && accounts.length > 1 && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] rounded-lg shadow-xl border border-purple-700 p-4 z-50">
          <div className="text-white font-semibold mb-3">Select Account</div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {accounts.map((account, index) => (
              <button
                key={account}
                onClick={async () => {
                  try {
                    await switchAccount(index);
                    setShowAccountSelector(false);
                  } catch (error) {
                    console.error('Failed to switch account:', error);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm transition flex items-center justify-between ${
                  index === currentAccountIndex
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1e2e2e] hover:bg-[#2d193c] text-white'
                }`}
              >
                <div>
                  <div className="font-medium">Account {index + 1}</div>
                  <div className="text-xs text-purple-300">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                </div>
                {index === currentAccountIndex && <span>✓</span>}
              </button>
            ))}
          </div>
          
          {/* Chain Info */}
          {chainId && (
            <div className="mt-3 pt-3 border-t border-purple-700">
              <div className="text-purple-300 text-xs">
                <span className="font-semibold">Chain ID:</span> {chainId}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chain Selector Dropdown */}
      {showChainSelector && (type === 'evm-external' || type === 'cosmos-external') && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] rounded-lg shadow-xl border border-purple-700 p-4 z-50">
          <div className="text-white font-semibold mb-3">Switch Network</div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {SUPPORTED_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={async () => {
                  try {
                    await switchChain(chain.id);
                    setShowChainSelector(false);
                  } catch (error) {
                    console.error('Failed to switch chain:', error);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm transition flex items-center justify-between ${
                  chainId === chain.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1e2e2e] hover:bg-[#2d193c] text-white'
                }`}
              >
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {chain.name}
                    {chain.isCosmos && <span className="text-xs bg-blue-600 px-1 rounded">COSMOS</span>}
                  </div>
                  <div className="text-xs text-purple-300">
                    {chain.symbol} • {chain.id}
                  </div>
                </div>
                {chainId === chain.id && <span>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {(showWalletOptions || showAccountSelector || showChainSelector) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowWalletOptions(false);
            setShowAccountSelector(false);
            setShowChainSelector(false);
          }}
        />
      )}
    </div>
  );
} 