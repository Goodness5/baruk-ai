import { createWalletClient, createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as barukTools from './barukTools';

export interface WalletState {
  address: string | null;
  type: 'external' | 'internal' | null;
  status: 'connected' | 'disconnected' | 'pending';
}

export interface TransactionRequest {
  type: 'swap' | 'addLiquidity' | 'stake' | 'lend' | 'borrow' | 'limitOrder';
  wallet: WalletState;
  data: any;
}

export async function executeTransaction(request: TransactionRequest) {
  const { type, wallet, data } = request;
  
  if (!wallet.address || wallet.status !== 'connected') {
    throw new Error('No wallet connected');
  }

  // For external wallets, return transaction data for user to sign
  if (wallet.type === 'external') {
    return {
      type: 'external',
      status: 'requires_signature',
      transaction: data
    };
  }

  // For internal wallets, execute automatically
  try {
    switch (type) {
      case 'swap':
        return await barukTools.swapTokens(data);
      case 'addLiquidity':
        return await barukTools.addLiquidity(data);
      case 'stake':
        return await barukTools.getPendingRewards(data.poolId, wallet.address);
      case 'lend':
      case 'borrow':
        const lendingPosition = await barukTools.getUserLendingPosition(wallet.address);
        return lendingPosition;
      case 'limitOrder':
        return await barukTools.getUserLimitOrders(wallet.address);
      default:
        throw new Error(`Unsupported transaction type: ${type}`);
    }
  } catch (error) {
    console.error(`Failed to execute ${type} transaction:`, error);
    throw error;
  }
}

export function explainWalletOptions() {
  return {
    external: {
      description: "Connect your existing wallet (MetaMask, WalletConnect, etc.)",
      benefits: [
        "Use your existing wallet and funds",
        "Full control over transactions",
        "Compatible with other DeFi protocols"
      ],
      limitations: [
        "Requires manual transaction approval",
        "Need to have funds for gas fees",
        "Must manage your own private keys"
      ]
    },
    internal: {
      description: "Let Baruk create a new wallet for you",
      benefits: [
        "Automatic transaction execution",
        "Seamless DeFi operations",
        "No need to approve each transaction",
        "AI can execute strategies automatically"
      ],
      limitations: [
        "New wallet starts with zero balance",
        "Need to transfer funds to use",
        "Limited to Baruk protocol operations"
      ]
    }
  };
}

export function getWalletRequirements(operation: string) {
  const requirements = {
    view: {
      needsWallet: false,
      canUseExternal: true,
      canUseInternal: true,
      description: "No wallet needed for viewing public data"
    },
    swap: {
      needsWallet: true,
      canUseExternal: true,
      canUseInternal: true,
      description: "Requires connected wallet with sufficient balance"
    },
    farm: {
      needsWallet: true,
      canUseExternal: true,
      canUseInternal: true,
      description: "Requires connected wallet with LP tokens"
    },
    lend: {
      needsWallet: true,
      canUseExternal: true,
      canUseInternal: true,
      description: "Requires connected wallet with tokens to lend"
    },
    borrow: {
      needsWallet: true,
      canUseExternal: true,
      canUseInternal: true,
      description: "Requires connected wallet with collateral"
    },
    autoCompound: {
      needsWallet: true,
      canUseExternal: false,
      canUseInternal: true,
      description: "Requires internal wallet for automatic operations"
    }
  };

  return requirements[operation as keyof typeof requirements] || {
    needsWallet: true,
    canUseExternal: true,
    canUseInternal: true,
    description: "Operation requires a connected wallet"
  };
}
