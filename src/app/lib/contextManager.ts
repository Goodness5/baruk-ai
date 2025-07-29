interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  priceUSD?: number;
}

interface WalletState {
  address: string | null;
  type: "external" | "internal" | null;
  status: "connected" | "disconnected" | "pending";
  privateKey?: string;
}

interface UserSession {
  id: string;
  wallet: WalletState;
  riskTolerance: number;
  lastActivity: number;
  activeStrategies: string[];
  settings: {
    defaultSlippage: number;
    autoDeadline: boolean;
  };
}

class ContextManager {
  private userSessions: Map<string, UserSession> = new Map();

  getUserSession(userId: string): UserSession {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        id: userId,
        wallet: {
          address: null,
          type: null,
          status: "disconnected",
        },
        riskTolerance: 5,
        lastActivity: Date.now(),
        activeStrategies: [],
        settings: {
          defaultSlippage: 1.0,
          autoDeadline: true,
        },
      });
    }
    return this.userSessions.get(userId)!;
  }

  async connectWallet(
    userId: string,
    address: string,
    type: "external" | "internal"
  ): Promise<boolean> {
    const session = this.getUserSession(userId);
    session.wallet = {
      address,
      type,
      status: "connected",
    };
    session.lastActivity = Date.now();
    return true;
  }

  async autoConnectWallet(userId: string): Promise<boolean> {
    const session = this.getUserSession(userId);
    if (session.wallet.address && session.wallet.status === "disconnected") {
      return this.connectWallet(userId, session.wallet.address, "external");
    }
    return session.wallet.status === "connected";
  }

  disconnectWallet(userId: string): void {
    const session = this.getUserSession(userId);
    session.wallet = {
      address: null,
      type: null,
      status: "disconnected",
    };
  }

  updateSettings(
    userId: string,
    settings: Partial<UserSession["settings"]>
  ): void {
    const session = this.getUserSession(userId);
    session.settings = { ...session.settings, ...settings };
  }
}

// Export a singleton instance
export const contextManager = new ContextManager();
export type { UserSession, WalletState, TokenInfo };
