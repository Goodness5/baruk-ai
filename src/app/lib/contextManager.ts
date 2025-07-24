interface WalletState {
  address: string | null;
  type: 'external' | 'internal' | null;
  status: 'connected' | 'disconnected' | 'pending';
  privateKey?: string;
}

interface UserSession {
  wallet: WalletState;
  riskTolerance: number;
  investmentGoals: string[];
  activeStrategies: any[];
  portfolioHistory: any[];
  preferences: {
    autoCompound: boolean;
    maxSlippage: string;
    gasOptimization: boolean;
    useInternalWallet: boolean;
  };
  lastActivity: number;
}

export class BarukContextManager {
  private userSessions = new Map<string, UserSession>();

  getUserSession(userId: string): UserSession {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        wallet: {
          address: null,
          type: null,
          status: 'disconnected'
        },
        riskTolerance: 5,
        investmentGoals: [],
        activeStrategies: [],
        portfolioHistory: [],
        preferences: {
          autoCompound: true,
          maxSlippage: "1.0",
          gasOptimization: true,
          useInternalWallet: false
        },
        lastActivity: Date.now()
      });
    }
    return this.userSessions.get(userId)!;
  }

  async handleWalletConnection(userId: string, walletData: { address: string; type: 'external' | 'internal'; privateKey?: string }) {
    const session = this.getUserSession(userId);
    session.wallet = {
      address: walletData.address,
      type: walletData.type,
      status: 'connected',
      privateKey: walletData.privateKey
    };
    session.lastActivity = Date.now();
    this.userSessions.set(userId, session);
  }

  disconnectWallet(userId: string) {
    const session = this.getUserSession(userId);
    session.wallet = {
      address: null,
      type: null,
      status: 'disconnected'
    };
    session.lastActivity = Date.now();
    this.userSessions.set(userId, session);
  }

  updatePreferences(userId: string, preferences: Partial<{ 
    autoCompound: boolean; 
    maxSlippage: string; 
    gasOptimization: boolean; 
    useInternalWallet: boolean 
  }>) {
    const session = this.getUserSession(userId);
    session.preferences = { ...session.preferences, ...preferences };
    session.lastActivity = Date.now();
    this.userSessions.set(userId, session);
  }

  updateUserSession(userId: string, updates: Partial<UserSession>) {
    const session = this.getUserSession(userId);
    const updatedSession = { ...session, ...updates, lastActivity: Date.now() };
    this.userSessions.set(userId, updatedSession);
  }

  canExecuteTransactions(userId: string): boolean {
    const session = this.getUserSession(userId);
    return session.wallet.status === 'connected' && 
           (session.wallet.type === 'internal' || session.preferences.useInternalWallet);
  }
}
