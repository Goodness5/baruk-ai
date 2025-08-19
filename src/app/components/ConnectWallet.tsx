"use client";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';
import { config } from '../../wagmi';

export default function ConnectWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const [availableConnectors, setAvailableConnectors] = useState<typeof connectors>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sei testnet chain ID
  const seiTestnetId = 1328;
  const isOnSeiTestnet = chainId === seiTestnetId;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Auto-reconnect only once on mount if wallet was previously connected
    if (!hasAttemptedReconnect && typeof window !== 'undefined' && window.ethereum && !isConnected) {
      setHasAttemptedReconnect(true);
      
      // Check if wallet was previously connected
      const wasConnected = localStorage.getItem('wallet-connected');
      
      if (wasConnected === 'true') {
        window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
          if (accounts.length > 0 && connectors.length > 0) {
            // Find the injected connector
            const injectedConnector = connectors.find(c => c.id === 'injected');
            if (injectedConnector && injectedConnector.ready) {
              connect({ connector: injectedConnector });
            }
          } else {
            // Clear the stored connection if no accounts found
            localStorage.removeItem('wallet-connected');
          }
        });
      }
    }
  }, [isConnected, connectors, connect, hasAttemptedReconnect]);

  useEffect(() => {
    // Store connection state in localStorage
    if (isConnected) {
      localStorage.setItem('wallet-connected', 'true');
    } else {
      localStorage.removeItem('wallet-connected');
    }
  }, [isConnected]);

  // Update the logic to prioritize MetaMask (injected wallet) when available
  useEffect(() => {
    // Update available connectors using wagmi hooks
    const readyConnectors = connectors.filter((connector) => {
      if (connector.id === 'metaMask') {
        return typeof window !== 'undefined' && window.ethereum?.isMetaMask;
      }
      return connector.ready || connector.type === 'metaMask';
    });

    // Log connectors for debugging
    console.log('Available connectors:', readyConnectors);

    // Sort connectors to prioritize MetaMask
    readyConnectors.sort((a, b) => (a.id === 'metaMask' ? -1 : b.id === 'metaMask' ? 1 : 0));

    setAvailableConnectors(readyConnectors);
  }, [connectors]);

  const handleConnect = async (connector: typeof connectors[number]) => {
    try {
      setIsLoading(true);
      await connect({ connector });
      setIsOpen(false);
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure the wagmi configuration is applied
  useEffect(() => {
    console.log('Wagmi config:', config);
  }, []);

  // Don't render anything until client-side
  if (!isMounted) {
    return (
      <div className="px-4 py-2 bg-gray-600 text-white rounded-lg">
        Loading...
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm">
          <div className="text-gray-300">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <div className="text-xs text-gray-500">
            {isOnSeiTestnet ? 'Sei Testnet' : `Chain ID: ${chainId}`}
          </div>
        </div>
        <button
          onClick={() => {
            disconnect();
            localStorage.removeItem('wallet-connected');
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
      </button>

      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-800 border border-red-600 rounded-lg shadow-lg z-50 min-w-[300px] p-3">
          <div className="text-red-200 text-sm">Error: {error.message}</div>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[250px]">
          <div className="p-3 border-b border-gray-700">
            <div className="text-sm font-medium text-gray-200">Connect Wallet</div>
            <div className="text-xs text-gray-400">Choose your wallet to connect</div>
          </div>
          {availableConnectors.length > 0 ? (
            availableConnectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={isLoading}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-700 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {connector.id === 'metaMask' ? 'MetaMask' : connector.name}
                  </span>
                  {isLoading && (
                    <span className="text-xs text-blue-400">Connecting...</span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center">
              <div className="text-sm text-gray-400">No wallets detected</div>
              <div className="text-xs text-gray-500 mt-1">
                Please install MetaMask or another wallet extension
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}