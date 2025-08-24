# Privy Integration

## Overview

Privy provides a comprehensive authentication and wallet management solution for Baruk AI, enabling users to interact with DeFi protocols without requiring traditional crypto wallet setup. This integration supports autonomous trading, simplified user onboarding, and enhanced security.

## What is Privy?

Privy is a Web3 authentication platform that provides:
- **Email/Password Authentication**: Traditional login methods
- **Social Logins**: Google, Twitter, Discord, and more
- **Embedded Wallets**: Automatic wallet creation and management
- **Gasless Transactions**: No need for users to manage gas fees
- **Multi-Chain Support**: Works with Sei Network and other EVM chains
- **Account Abstraction**: Simplified transaction signing

## Architecture

### High-Level Integration Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    User Interface                                │
├─────────────────────────────────────────────────────────────────┤
│  Login/Signup │  Wallet Management │  Transaction Execution    │
├─────────────────────────────────────────────────────────────────┤
│                    Privy SDK                                      │
├─────────────────────────────────────────────────────────────────┤
│  Authentication │  Wallet Creation │  Transaction Signing      │
├─────────────────────────────────────────────────────────────────┤
│                    Blockchain Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Sei Network │  Smart Contracts │  Transaction Broadcasting    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Integration
- **PrivyProvider**: Wraps the application with Privy context
- **usePrivyAuth**: Custom hook for authentication state
- **PrivyTradingService**: Autonomous trading with Privy wallets
- **Transaction Management**: Gasless transaction execution

## Setup and Configuration

### 1. Installation

```bash
# Install Privy dependencies
npm install @privy-io/react-auth @privy-io/server-auth

# Install additional dependencies for enhanced functionality
npm install @privy-io/privy-js @privy-io/privy-node
```

### 2. Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret

# Optional: Additional Privy configuration
NEXT_PUBLIC_PRIVY_CHAIN_ID=1328  # Sei Network
NEXT_PUBLIC_PRIVY_RPC_URL=https://evm-rpc.sei-apis.com
```

### 3. Privy Dashboard Setup

1. **Create Privy App**:
   - Visit [Privy Console](https://console.privy.io/)
   - Sign up and create a new application
   - Copy your App ID and App Secret

2. **Configure Authentication Methods**:
   - Enable email/password authentication
   - Configure social login providers
   - Set up embedded wallet options

3. **Configure Blockchain Settings**:
   - Add Sei Network (Chain ID: 1328)
   - Configure RPC endpoints
   - Set gas estimation parameters

## Core Components

### 1. PrivyProvider

#### Provider Configuration
```typescript
// src/app/components/PrivyProvider.tsx
import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { sei } from 'viem/chains';

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProviderBase
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#a855f7',
          showWalletLoginFirst: false,
        },
        defaultChain: sei,
        supportedChains: [sei],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          noPromptOnSignature: true,
        },
        // Enable autonomous trading
        autoConnect: true,
        // Customize login flow
        loginMethodsOrder: ['email', 'wallet'],
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
```

#### Advanced Configuration
```typescript
const privyConfig = {
  // Authentication methods
  loginMethods: ['email', 'wallet', 'google', 'twitter'],
  
  // Wallet configuration
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    noPromptOnSignature: true,
    requireUserSignature: false, // Enable autonomous trading
  },
  
  // Chain configuration
  defaultChain: sei,
  supportedChains: [sei],
  
  // UI customization
  appearance: {
    theme: 'dark',
    accentColor: '#a855f7',
    showWalletLoginFirst: false,
    logo: '/logo.png',
  },
  
  // Security settings
  security: {
    requireUserSignature: false,
    allowUserSignatureOverride: true,
  },
};
```

### 2. Authentication Hook

#### Custom Hook Implementation
```typescript
// src/app/hooks/usePrivyAuth.ts
import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

export function usePrivyAuth() {
  const {
    login,
    logout,
    authenticated,
    user,
    ready,
    sendEmail,
    linkEmail,
    linkWallet,
    unlinkWallet,
    exportWallet,
    getEthereumProvider,
  } = usePrivy();

  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (ready && authenticated && user) {
      // Get user's wallet address
      const getAddress = async () => {
        try {
          const provider = await getEthereumProvider();
          const accounts = await provider.request({ method: 'eth_accounts' });
          setUserAddress(accounts[0]);
        } catch (error) {
          console.error('Error getting user address:', error);
        } finally {
          setIsLoading(false);
        }
      };

      getAddress();
    } else if (ready) {
      setIsLoading(false);
    }
  }, [ready, authenticated, user, getEthereumProvider]);

  const signIn = async (email: string) => {
    try {
      await sendEmail(email);
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await login();
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error };
    }
  };

  const connectWallet = async () => {
    try {
      await linkWallet();
      return { success: true };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return { success: false, error };
    }
  };

  const disconnectWallet = async () => {
    try {
      await unlinkWallet();
      return { success: true };
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      return { success: false, error };
    }
  };

  const exportUserWallet = async () => {
    try {
      const walletData = await exportWallet();
      return { success: true, walletData };
    } catch (error) {
      console.error('Wallet export error:', error);
      return { success: false, error };
    }
  };

  return {
    // Authentication state
    isAuthenticated: authenticated,
    isReady: ready,
    isLoading,
    user,
    userAddress,
    
    // Authentication methods
    signIn,
    signUp,
    signOut: logout,
    
    // Wallet management
    connectWallet,
    disconnectWallet,
    exportUserWallet,
    
    // Utility methods
    getEthereumProvider,
  };
}
```

### 3. Autonomous Trading Service

#### Privy Trading Service
```typescript
// src/app/lib/privyTrading.ts
import { getEthereumProvider } from '@privy-io/react-auth';
import { ethers } from 'ethers';

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  maxSlippage: number;
  maxTradeSize: string;
  minProfitThreshold: number;
  enabled: boolean;
}

export interface AITradingSession {
  id: string;
  userId: string;
  strategy: TradingStrategy;
  status: 'active' | 'paused' | 'stopped';
  startTime: number;
  lastTradeTime: number;
  totalTrades: number;
  totalProfit: number;
  totalVolume: number;
}

export class PrivyTradingService {
  private activeSessions: Map<string, AITradingSession> = new Map();
  private tradingStrategies: TradingStrategy[] = [];

  constructor() {
    this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies(): void {
    this.tradingStrategies = [
      {
        id: 'momentum-trader',
        name: 'Momentum Trader',
        description: 'Follows price momentum with quick entry/exit',
        riskLevel: 'medium',
        maxSlippage: 0.5,
        maxTradeSize: '1000',
        minProfitThreshold: 0.3,
        enabled: true,
      },
      {
        id: 'arbitrage-bot',
        name: 'Arbitrage Bot',
        description: 'Exploits price differences across DEXs',
        riskLevel: 'low',
        maxSlippage: 0.1,
        maxTradeSize: '5000',
        minProfitThreshold: 0.1,
        enabled: true,
      },
      {
        id: 'trend-follower',
        name: 'Trend Follower',
        description: 'Follows established market trends',
        riskLevel: 'medium',
        maxSlippage: 0.3,
        maxTradeSize: '2000',
        minProfitThreshold: 0.5,
        enabled: true,
      },
    ];
  }

  async startTradingSession(
    userId: string,
    strategyId: string,
    initialCapital: string
  ): Promise<string> {
    const strategy = this.tradingStrategies.find(s => s.id === strategyId);
    if (!strategy || !strategy.enabled) {
      throw new Error('Strategy not found or disabled');
    }

    const sessionId = `session_${userId}_${Date.now()}`;
    const session: AITradingSession = {
      id: sessionId,
      userId,
      strategy,
      status: 'active',
      startTime: Date.now(),
      lastTradeTime: Date.now(),
      totalTrades: 0,
      totalProfit: 0,
      totalVolume: 0,
    };

    this.activeSessions.set(sessionId, session);
    return sessionId;
  }

  async executeTrade(
    sessionId: string,
    tradeData: {
      tokenIn: string;
      tokenOut: string;
      amountIn: string;
      slippageTolerance: number;
    }
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || session.status !== 'active') {
        throw new Error('Trading session not active');
      }

      // Get Privy provider
      const provider = await getEthereumProvider();
      const signer = provider.getSigner();

      // Execute trade using Baruk Router
      const routerContract = new ethers.Contract(
        contractAddresses.router,
        contractABIs.router,
        signer
      );

      const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
      const amountOutMin = ethers.utils.parseUnits(
        (parseFloat(tradeData.amountIn) * (1 - tradeData.slippageTolerance / 100)).toString(),
        18
      );

      const tx = await routerContract.swap(
        tradeData.tokenIn,
        tradeData.tokenOut,
        ethers.utils.parseUnits(tradeData.amountIn, 18),
        amountOutMin,
        await signer.getAddress(),
        deadline
      );

      const receipt = await tx.wait();

      // Update session
      session.totalTrades++;
      session.lastTradeTime = Date.now();

      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      console.error('Trade execution error:', error);
      return { success: false, error: error.message };
    }
  }

  getTradingStrategies(): TradingStrategy[] {
    return [...this.tradingStrategies];
  }

  getActiveSessions(): AITradingSession[] {
    return Array.from(this.activeSessions.values());
  }

  pauseSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      return true;
    }
    return false;
  }

  stopSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'stopped';
      return true;
    }
    return false;
  }
}
```

## User Interface Components

### 1. Authentication Components

#### Login Component
```typescript
// src/app/components/ConnectWallet.tsx
import { usePrivyAuth } from '../hooks/usePrivyAuth';
import { useState } from 'react';

export default function ConnectWallet() {
  const { signIn, signUp, isAuthenticated, user, signOut } = usePrivyAuth();
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      await signUp(email, '');
    } else {
      await signIn(email);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-300">
          {user.email?.address}
        </div>
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
        
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-sm text-gray-400 hover:text-white"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </form>
    </div>
  );
}
```

#### AI Trading Dashboard
```typescript
// src/app/components/AITradingDashboard.tsx
import { usePrivyAuth } from '../hooks/usePrivyAuth';
import { PrivyTradingService, TradingStrategy, AITradingSession } from '../lib/privyTrading';
import { useState, useEffect } from 'react';

export default function AITradingDashboard() {
  const { isAuthenticated, user, userAddress } = usePrivyAuth();
  const [tradingService] = useState(() => new PrivyTradingService());
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [activeSessions, setActiveSessions] = useState<AITradingSession[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [initialCapital, setInitialCapital] = useState<string>('1000');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStrategies();
    loadActiveSessions();
    
    // Refresh sessions every 10 seconds
    const interval = setInterval(loadActiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStrategies = () => {
    const availableStrategies = tradingService.getTradingStrategies();
    setStrategies(availableStrategies);
    if (availableStrategies.length > 0) {
      setSelectedStrategy(availableStrategies[0].id);
    }
  };

  const loadActiveSessions = () => {
    const sessions = tradingService.getActiveSessions();
    setActiveSessions(sessions);
  };

  const startTradingSession = async () => {
    if (!isAuthenticated || !user) return;
    
    setIsLoading(true);
    try {
      const sessionId = await tradingService.startTradingSession(
        user.id,
        selectedStrategy,
        initialCapital
      );
      
      loadActiveSessions();
      setInitialCapital('1000');
    } catch (error) {
      console.error('Error starting trading session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Sign In to Continue
        </h2>
        <p className="text-gray-400">
          Connect your wallet to start autonomous AI trading
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Trading Dashboard
        </h1>
        <p className="text-gray-400">
          Welcome back, {user.email?.address}
        </p>
      </div>

      {/* Strategy Selection */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Start New Trading Session
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trading Strategy
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              {strategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Initial Capital (USDC)
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder="1000"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={startTradingSession}
              disabled={isLoading || !selectedStrategy}
              className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : 'Start Trading Session'}
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Active Trading Sessions
        </h2>
        
        {activeSessions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No active trading sessions. Start a new session to begin.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th className="px-6 py-3">Strategy</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Total Trades</th>
                  <th className="px-6 py-3">Total Profit</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map((session) => (
                  <tr key={session.id} className="border-b border-gray-700">
                    <td className="px-6 py-4">{session.strategy.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.status === 'active' ? 'bg-green-600 text-white' :
                        session.status === 'paused' ? 'bg-yellow-600 text-white' :
                        'bg-red-600 text-white'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{session.totalTrades}</td>
                    <td className="px-6 py-4">
                      <span className={session.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        ${session.totalProfit.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => tradingService.pauseSession(session.id)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 mr-2"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => tradingService.stopSession(session.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Stop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Advanced Features

### 1. Gasless Transactions

#### Transaction Configuration
```typescript
// Enable gasless transactions
const privyConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    noPromptOnSignature: true,
    requireUserSignature: false,
  },
  
  // Gas sponsorship configuration
  gasSponsorship: {
    enabled: true,
    maxGasPerTransaction: '500000',
    maxGasPerDay: '5000000',
  },
};
```

### 2. Multi-Signature Support

#### Multi-Sig Configuration
```typescript
const multiSigConfig = {
  // Require multiple signatures for high-value transactions
  multiSignature: {
    enabled: true,
    threshold: 2, // Require 2 out of 3 signatures
    signers: [
      '0x...', // User wallet
      '0x...', // Guardian wallet
      '0x...', // Recovery wallet
    ],
  },
};
```

### 3. Social Recovery

#### Recovery Configuration
```typescript
const recoveryConfig = {
  // Social recovery for lost wallets
  socialRecovery: {
    enabled: true,
    guardians: [
      { type: 'email', value: 'guardian1@example.com' },
      { type: 'wallet', value: '0x...' },
      { type: 'phone', value: '+1234567890' },
    ],
    recoveryThreshold: 2, // Require 2 guardians to approve recovery
  },
};
```

## Security Considerations

### 1. Authentication Security
- **Multi-Factor Authentication**: Enable 2FA for enhanced security
- **Session Management**: Implement secure session handling
- **Rate Limiting**: Prevent brute force attacks
- **Audit Logging**: Track all authentication events

### 2. Wallet Security
- **Encryption**: Encrypt wallet data at rest
- **Access Control**: Implement role-based access control
- **Backup Recovery**: Secure backup and recovery procedures
- **Transaction Limits**: Set daily and per-transaction limits

### 3. Privacy Protection
- **Data Minimization**: Collect only necessary user data
- **Encryption**: Encrypt sensitive data in transit and at rest
- **GDPR Compliance**: Implement data protection measures
- **User Consent**: Obtain explicit user consent for data usage

## Monitoring and Analytics

### 1. User Analytics
```typescript
// Track user engagement and trading activity
const analytics = {
  trackUserLogin: (userId: string, method: string) => {
    // Track login method and frequency
  },
  
  trackTradingActivity: (userId: string, action: string, details: any) => {
    // Track trading actions and performance
  },
  
  trackWalletCreation: (userId: string, walletType: string) => {
    // Track wallet creation and usage
  },
};
```

### 2. Performance Monitoring
```typescript
// Monitor system performance and user experience
const monitoring = {
  trackTransactionSuccess: (txHash: string, gasUsed: string, executionTime: number) => {
    // Track transaction success rates and performance
  },
  
  trackError: (error: Error, context: string) => {
    // Track errors and their context
  },
  
  trackUserExperience: (metric: string, value: number) => {
    // Track user experience metrics
  },
};
```

## Troubleshooting

### Common Issues

#### 1. Authentication Problems
- **Check App ID**: Verify Privy App ID is correct
- **Network Issues**: Ensure stable internet connection
- **Browser Compatibility**: Check browser compatibility
- **Cache Issues**: Clear browser cache and cookies

#### 2. Wallet Connection Issues
- **Provider Errors**: Check Ethereum provider initialization
- **Network Mismatch**: Ensure correct network configuration
- **Permission Issues**: Check wallet permissions
- **Signature Errors**: Verify transaction signing

#### 3. Transaction Failures
- **Gas Issues**: Check gas estimation and limits
- **Contract Errors**: Verify contract addresses and ABIs
- **Network Congestion**: Check network status
- **User Balance**: Ensure sufficient token balance

### Debug Mode

```typescript
// Enable debug mode for troubleshooting
const debugConfig = {
  debug: true,
  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
  },
};
```

## Future Enhancements

### 1. Advanced Features
- **Cross-Chain Support**: Multi-chain wallet management
- **DeFi Integration**: Direct integration with more protocols
- **Advanced Analytics**: Enhanced trading performance metrics
- **Mobile Support**: Native mobile applications

### 2. Security Improvements
- **Hardware Wallet Support**: Integration with hardware wallets
- **Advanced Encryption**: Enhanced encryption algorithms
- **Threat Detection**: AI-powered threat detection
- **Compliance Tools**: Regulatory compliance features

### 3. User Experience
- **Onboarding Flow**: Improved user onboarding
- **Educational Content**: Trading education and guidance
- **Social Features**: Community and social trading
- **Personalization**: AI-powered personalization
