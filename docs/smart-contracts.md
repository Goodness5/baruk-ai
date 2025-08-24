# Smart Contracts

## Overview

Baruk AI integrates with a comprehensive suite of smart contracts deployed on the Sei Network, providing a complete DeFi ecosystem for trading, liquidity provision, yield farming, lending, and limit orders.

## Contract Architecture

### High-Level Contract Structure
```
┌─────────────────────────────────────────────────────────────────┐
│                    Baruk Protocol Contracts                     │
├─────────────────────────────────────────────────────────────────┤
│  Router │  AMM Factory │  AMM │  Lending │  Limit Order │ Farm │
├─────────────────────────────────────────────────────────────────┤
│                    Core Infrastructure                          │
├─────────────────────────────────────────────────────────────────┤
│  ERC20 │  Access Control │  Pausable │  Upgradeable Patterns   │
└─────────────────────────────────────────────────────────────────┘
```

### Contract Dependencies
```
Router ← AMM Factory ← AMM
  ↓         ↓         ↓
Lending   Limit Order  Farm
  ↓         ↓         ↓
  └─────────┴─────────┘
      ERC20 Tokens
```

## Core Contracts

### 1. BarukRouter

**Purpose**: Central entry point for all DeFi operations
**Address**: `0xe605be74ba68fc255dB0156ab63c31b50b336D6B`

#### Key Functions
```solidity
// Token swapping
function swap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin,
    address to,
    uint256 deadline
) external returns (uint256 amountOut);

// Liquidity provision
function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

// Liquidity removal
function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB);
```

#### Security Features
- **Slippage Protection**: Configurable minimum output amounts
- **Deadline Enforcement**: Transaction expiration handling
- **Reentrancy Protection**: Guard against reentrancy attacks
- **Access Control**: Admin-only functions for critical operations

### 2. BarukAMMFactory

**Purpose**: Creates and manages AMM pairs
**Address**: `0xCEeC70dF7bC3aEB57F078A1b1BeEa2c6320d8957`

#### Key Functions
```solidity
// Create new AMM pair
function createPair(
    address tokenA,
    address tokenB
) external returns (address pair);

// Get existing pair
function getPair(
    address tokenA,
    address tokenB
) external view returns (address pair);

// Get all pairs for a token
function getPairsForToken(
    address token
) external view returns (address[] memory pairs);
```

#### Pair Management
- **Automatic Pair Creation**: New pairs created on first liquidity provision
- **Pair Registry**: Centralized tracking of all trading pairs
- **Fee Management**: Configurable trading fees per pair
- **Upgrade Support**: Upgradeable pair contracts

### 3. BarukAMM

**Purpose**: Automated market maker for token pairs
**Address**: `0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1`

#### Core AMM Functions
```solidity
// Get reserves for a pair
function getReserves() external view returns (
    uint112 reserve0,
    uint112 reserve1,
    uint32 blockTimestampLast
);

// Calculate swap output
function getAmountOut(
    uint256 amountIn,
    address tokenIn
) external view returns (uint256 amountOut);

// Execute swap
function swap(
    uint256 amount0Out,
    uint256 amount1Out,
    address to,
    bytes calldata data
) external;
```

#### AMM Features
- **Constant Product Formula**: x * y = k pricing model
- **Dynamic Fees**: Adjustable trading fees based on volume
- **Flash Loan Support**: Built-in flash loan functionality
- **Oracle Integration**: Price oracle integration for accurate pricing

### 4. BarukLending

**Purpose**: Lending and borrowing platform
**Address**: `0x5197d95B4336f1EF6dd0fd62180101021A88E27b`

#### Lending Functions
```solidity
// Deposit collateral
function deposit(
    address token,
    uint256 amount
) external;

// Borrow tokens
function borrow(
    address token,
    uint256 amount
) external;

// Repay loan
function repay(
    address token,
    uint256 amount
) external;

// Withdraw collateral
function withdraw(
    address token,
    uint256 amount
) external;
```

#### Risk Management
- **Collateralization Ratios**: Dynamic collateral requirements
- **Liquidation Engine**: Automatic liquidation of undercollateralized positions
- **Interest Rate Models**: Dynamic interest rate calculation
- **Health Factor Monitoring**: Real-time position health tracking

### 5. BarukLimitOrder

**Purpose**: Advanced order management system
**Address**: `0x3bDdc3fAbf58fDaA6fF62c95b944819cF625c0F4`

#### Order Management
```solidity
// Place limit order
function placeOrder(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin,
    uint256 deadline,
    bool isBuy
) external returns (uint256 orderId);

// Cancel order
function cancelOrder(uint256 orderId) external;

// Execute order
function executeOrder(uint256 orderId) external;

// Get order details
function getOrder(uint256 orderId) external view returns (Order memory);
```

#### Order Features
- **Multiple Order Types**: Market, limit, stop-loss, take-profit
- **Order Matching**: Automated order execution engine
- **Partial Fills**: Support for partial order execution
- **Order Expiration**: Automatic order cancellation

### 6. BarukYieldFarm

**Purpose**: Yield farming and staking platform
**Address**: `0x1Ae8eC370795FCF21862Ba486fb44a5219Dea7Ce`

#### Farming Functions
```solidity
// Stake tokens
function stake(
    uint256 poolId,
    uint256 amount
) external;

// Unstake tokens
function unstake(
    uint256 poolId,
    uint256 amount
) external;

// Claim rewards
function claimReward(uint256 poolId) external;

// Get pool info
function getPoolInfo(uint256 poolId) external view returns (PoolInfo memory);
```

#### Farming Features
- **Multiple Pools**: Support for various token pairs and strategies
- **Dynamic Rewards**: Adjustable reward distribution
- **Lock Periods**: Configurable staking lock periods
- **Reward Multipliers**: Bonus rewards for longer staking

## Contract Integration

### 1. Frontend Integration

#### Contract Initialization
```typescript
import { createPublicClient, http } from 'viem';
import { sei } from 'viem/chains';

const client = createPublicClient({
  chain: sei,
  transport: http('https://evm-rpc.sei-apis.com'),
});

// Initialize contracts
const router = getContract({
  address: contractAddresses.router,
  abi: contractABIs.router,
  client,
});
```

#### Transaction Execution
```typescript
// Execute swap
const swapTx = await router.write.swap({
  args: [tokenIn, tokenOut, amountIn, amountOutMin, userAddress, deadline],
  account: userAddress,
});

// Wait for confirmation
const receipt = await client.waitForTransactionReceipt({ hash: swapTx });
```

### 2. AI Trading Integration

#### Automated Trading
```typescript
class AITradingService {
  async executeTrade(signal: TradingSignal): Promise<TransactionResult> {
    // Validate signal
    if (!this.validateSignal(signal)) {
      throw new Error('Invalid trading signal');
    }

    // Calculate optimal parameters
    const params = await this.calculateTradeParams(signal);

    // Execute trade
    const tx = await this.router.write.swap({
      args: [params.tokenIn, params.tokenOut, params.amountIn, params.amountOutMin, params.to, params.deadline],
      account: this.userAddress,
    });

    return { hash: tx, status: 'pending' };
  }
}
```

### 3. Event Handling

#### Event Listeners
```typescript
// Listen for swap events
router.watchEvent.Swap({
  onLogs: (logs) => {
    logs.forEach((log) => {
      const { tokenIn, tokenOut, amountIn, amountOut, to } = log.args;
      this.handleSwapEvent({ tokenIn, tokenOut, amountIn, amountOut, to });
    });
  },
});

// Listen for liquidity events
factory.watchEvent.PairCreated({
  onLogs: (logs) => {
    logs.forEach((log) => {
      const { token0, token1, pair } = log.args;
      this.handleNewPair({ token0, token1, pair });
    });
  },
});
```

## Security Considerations

### 1. Access Control
- **Role-Based Access**: Different roles for different operations
- **Multi-Signature**: Critical operations require multiple signatures
- **Timelock**: Delayed execution for administrative functions
- **Emergency Pause**: Ability to pause operations in emergencies

### 2. Reentrancy Protection
```solidity
modifier nonReentrant() {
    require(!_locked, "Reentrant call");
    _locked = true;
    _;
    _locked = false;
}
```

### 3. Slippage Protection
```solidity
// Ensure minimum output amount
require(amountOut >= amountOutMin, "Insufficient output amount");

// Deadline enforcement
require(block.timestamp <= deadline, "Transaction expired");
```

### 4. Oracle Security
- **Multiple Oracles**: Redundant price feeds
- **Oracle Validation**: Cross-reference multiple sources
- **Circuit Breakers**: Automatic pause on extreme price movements
- **Manipulation Detection**: Identify and prevent price manipulation

## Gas Optimization

### 1. Batch Operations
```solidity
// Batch multiple operations
function batchSwap(SwapParams[] calldata swaps) external {
    for (uint256 i = 0; i < swaps.length; i++) {
        _executeSwap(swaps[i]);
    }
}
```

### 2. Efficient Storage
- **Packed Structs**: Optimize storage layout
- **Storage Slots**: Minimize storage operations
- **Event Optimization**: Efficient event emission

### 3. Contract Size Optimization
- **Library Usage**: Extract common functions to libraries
- **Proxy Patterns**: Use upgradeable proxy contracts
- **Function Selection**: Optimize function selector usage

## Testing and Auditing

### 1. Testing Strategy
- **Unit Tests**: Individual function testing
- **Integration Tests**: Contract interaction testing
- **Fuzzing**: Automated input testing
- **Formal Verification**: Mathematical proof of correctness

### 2. Audit Process
- **Internal Review**: Team code review
- **External Audit**: Third-party security audit
- **Bug Bounty**: Public bug bounty program
- **Continuous Monitoring**: Ongoing security monitoring

### 3. Test Coverage
```typescript
describe('BarukRouter', () => {
  it('should execute swap correctly', async () => {
    // Test swap functionality
  });

  it('should handle edge cases', async () => {
    // Test edge cases
  });

  it('should revert on invalid inputs', async () => {
    // Test error conditions
  });
});
```

## Deployment and Upgrades

### 1. Deployment Process
```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy-testnet.ts --network sei-testnet

# Deploy to mainnet
npx hardhat run scripts/deploy-mainnet.ts --network sei-mainnet
```

### 2. Upgrade Strategy
- **Proxy Contracts**: Use OpenZeppelin upgradeable patterns
- **Storage Layout**: Maintain storage compatibility
- **Migration Scripts**: Automated upgrade procedures
- **Rollback Capability**: Ability to revert upgrades

### 3. Network Configuration
```typescript
export const networks = {
  sei: {
    chainId: 1328,
    rpcUrl: 'https://evm-rpc.sei-apis.com',
    explorer: 'https://sei.io/explorer',
  },
  seiTestnet: {
    chainId: 713715,
    rpcUrl: 'https://testnet-rpc.sei-apis.com',
    explorer: 'https://testnet.sei.io/explorer',
  },
};
```

## Future Enhancements

### 1. Advanced Features
- **Cross-Chain Bridges**: Multi-chain asset transfers
- **Options Trading**: Derivative trading capabilities
- **Synthetic Assets**: Tokenized real-world assets
- **Governance**: DAO governance mechanisms

### 2. Performance Improvements
- **Layer 2 Integration**: Optimistic rollups and sidechains
- **Parallel Processing**: Concurrent transaction execution
- **State Channels**: Off-chain transaction processing
- **Sharding**: Horizontal scaling solutions

### 3. Interoperability
- **IBC Integration**: Inter-blockchain communication
- **Cosmos Ecosystem**: Integration with Cosmos-based chains
- **Ethereum Compatibility**: Full EVM compatibility
- **Multi-Chain Support**: Support for multiple blockchains
