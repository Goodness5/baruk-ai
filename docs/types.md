# TypeScript Types

## Overview

This document provides a comprehensive reference for all TypeScript types, interfaces, and enums used throughout the Baruk AI project. These types ensure type safety and provide clear contracts for data structures.

## Core Types

### User and Authentication

#### User Interface
```typescript
export interface User {
  id: string;
  email: EmailAddress;
  walletAddress?: string;
  createdAt: number;
  updatedAt: number;
  preferences: UserPreferences;
  tradingProfile: TradingProfile;
}

export interface EmailAddress {
  address: string;
  verified: boolean;
  verificationDate?: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface TradingProfile {
  riskTolerance: 'low' | 'medium' | 'high';
  investmentGoals: InvestmentGoal[];
  preferredStrategies: string[];
  maxPortfolioValue: number;
  autoRebalancing: boolean;
}
```

#### Authentication Types
```typescript
export interface AuthState {
  isAuthenticated: boolean;
  isReady: boolean;
  isLoading: boolean;
  user: User | null;
  userAddress: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  method: 'email' | 'wallet' | 'social';
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  token?: string;
}
```

### Blockchain and DeFi

#### Token Types
```typescript
export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  logoUrl?: string;
  chainId: number;
}

export interface TokenBalance {
  tokenAddress: string;
  walletAddress: string;
  balance: string;
  decimals: number;
  symbol: string;
  name: string;
  price?: number;
  value?: number;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  price?: string;
  marketCap?: string;
  volume24h?: string;
}
```

#### Transaction Types
```typescript
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  confirmations: number;
  input: string;
  nonce: number;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  gasUsed: bigint;
  cumulativeGasUsed: bigint;
  effectiveGasPrice: bigint;
  contractAddress: string | null;
  logs: Log[];
  status: 'success' | 'failed';
  type: number;
}

export interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: bigint;
  transactionHash: string;
  transactionIndex: bigint;
  blockHash: string;
  logIndex: bigint;
  removed: boolean;
}
```

#### Contract Types
```typescript
export interface ContractConfig {
  address: string;
  abi: any[];
  chainId: number;
  name: string;
  version: string;
}

export interface ContractCall {
  address: string;
  abi: any[];
  functionName: string;
  args: any[];
  value?: bigint;
}

export interface ContractReadResult<T = any> {
  data: T;
  error?: string;
  isLoading: boolean;
  refetch: () => void;
}
```

### Trading and AI

#### Trading Strategy Types
```typescript
export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  maxSlippage: number;
  maxTradeSize: string;
  minProfitThreshold: number;
  enabled: boolean;
  parameters: StrategyParameters;
  performance: StrategyPerformance;
}

export interface StrategyParameters {
  lookbackPeriod: number;
  entryThreshold: number;
  exitThreshold: number;
  stopLoss: number;
  takeProfit: number;
  maxPositions: number;
  rebalanceInterval: number;
}

export interface StrategyPerformance {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  averageTrade: number;
}
```

#### Trading Signal Types
```typescript
export interface TradingSignal {
  id: string;
  tokenIn: string;
  tokenOut: string;
  action: 'buy' | 'sell';
  confidence: number;
  expectedProfit: number;
  risk: number;
  timestamp: number;
  strategy: string;
  parameters: SignalParameters;
}

export interface SignalParameters {
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  positionSize: number;
  timeHorizon: number;
  riskRewardRatio: number;
}

export interface ArbitrageOpportunity {
  buyFrom: string;
  sellTo: string;
  token: string;
  expectedProfit: number;
  risk: number;
  executionTime: number;
  requiredCapital: number;
  gasEstimate: number;
}
```

#### AI Trading Session Types
```typescript
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
  positions: Position[];
  performance: SessionPerformance;
}

export interface Position {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  status: 'open' | 'closed';
  openTime: number;
  closeTime?: number;
}

export interface SessionPerformance {
  startValue: number;
  currentValue: number;
  totalReturn: number;
  dailyReturns: DailyReturn[];
  riskMetrics: RiskMetrics;
}
```

### Market Data

#### Price and Market Types
```typescript
export interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
  change24h: number;
  change7d: number;
  high24h: number;
  low24h: number;
}

export interface MarketData {
  token: string;
  prices: PriceData[];
  volumes: VolumeData[];
  indicators: TechnicalIndicators;
  sentiment: SentimentData;
  news: NewsItem[];
}

export interface VolumeData {
  timestamp: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  netFlow: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: MACDData;
  bollingerBands: BollingerBands;
  movingAverages: MovingAverages;
  supportResistance: SupportResistance;
}

export interface MACDData {
  macd: number;
  signal: number;
  histogram: number;
  divergence: 'bullish' | 'bearish' | 'neutral';
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
}

export interface MovingAverages {
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
}
```

#### Sentiment and News Types
```typescript
export interface SentimentData {
  score: number;
  confidence: number;
  emotions: EmotionBreakdown;
  keywords: KeywordSentiment[];
  sources: SentimentSource[];
  timestamp: number;
}

export interface EmotionBreakdown {
  positive: number;
  negative: number;
  neutral: number;
  fear: number;
  greed: number;
  excitement: number;
}

export interface KeywordSentiment {
  keyword: string;
  sentiment: number;
  frequency: number;
  impact: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: number;
  sentiment: number;
  relevance: number;
  impact: 'low' | 'medium' | 'high';
}
```

### Portfolio and Risk

#### Portfolio Types
```typescript
export interface Portfolio {
  id: string;
  userId: string;
  totalValue: number;
  totalValue24h: number;
  change24h: number;
  change24hPercentage: number;
  assets: PortfolioAsset[];
  allocations: AssetAllocation[];
  performance: PortfolioPerformance;
  risk: PortfolioRisk;
}

export interface PortfolioAsset {
  token: string;
  balance: number;
  value: number;
  allocation: number;
  pnl: number;
  pnlPercentage: number;
  lastUpdated: number;
}

export interface AssetAllocation {
  asset: string;
  currentWeight: number;
  targetWeight: number;
  difference: number;
  rebalanceAction: 'buy' | 'sell' | 'hold';
  priority: number;
}

export interface PortfolioPerformance {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  timeSeries: PerformancePoint[];
}

export interface PerformancePoint {
  timestamp: number;
  value: number;
  return: number;
  cumulativeReturn: number;
}
```

#### Risk Management Types
```typescript
export interface PortfolioRisk {
  totalRisk: number;
  systematicRisk: number;
  unsystematicRisk: number;
  var95: number;
  var99: number;
  expectedShortfall: number;
  beta: number;
  correlation: number;
  diversification: number;
}

export interface RiskMetrics {
  volatility: number;
  downsideDeviation: number;
  valueAtRisk: number;
  conditionalVaR: number;
  expectedShortfall: number;
  maximumDrawdown: number;
  ulcerIndex: number;
  gainToPainRatio: number;
}

export interface RiskLimits {
  maxPositionSize: number;
  maxPortfolioRisk: number;
  maxDrawdown: number;
  maxLeverage: number;
  stopLossLevel: number;
  takeProfitLevel: number;
}
```

### UI and Components

#### Component Props Types
```typescript
export interface BaseComponentProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export interface InputProps extends BaseComponentProps {
  type: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

#### Chart and Visualization Types
```typescript
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: ChartPlugins;
  scales: ChartScales;
  interaction: ChartInteraction;
}

export interface ChartPlugins {
  legend: LegendOptions;
  tooltip: TooltipOptions;
  zoom: ZoomOptions;
}

export interface LegendOptions {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  labels: LabelOptions;
}
```

### API and Network

#### API Response Types
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
  requestId: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: number;
  requestId: string;
}
```

#### WebSocket Types
```typescript
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: number;
  id?: string;
}

export interface WebSocketConnection {
  id: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastPing: number;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface WebSocketSubscription {
  id: string;
  channel: string;
  params: any;
  active: boolean;
  lastMessage: number;
}
```

### Utility Types

#### Generic and Helper Types
```typescript
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ValueOf<T> = T[keyof T];

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : any;

export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;
```

#### Enum Types
```typescript
export enum ChainId {
  ETHEREUM = 1,
  POLYGON = 137,
  BSC = 56,
  SEI = 1328,
  SEI_TESTNET = 713715,
}

export enum TokenStandard {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  NATIVE = 'NATIVE',
}

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP_LOSS = 'stop_loss',
  TAKE_PROFIT = 'take_profit',
  STOP_LIMIT = 'stop_limit',
}

export enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open',
  FILLED = 'filled',
  PARTIALLY_FILLED = 'partially_filled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
}

export enum TradingPairStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DELISTED = 'delisted',
}
```

## Type Guards and Validation

### Type Guard Functions
```typescript
export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.email === 'object' &&
    typeof obj.createdAt === 'number';
}

export function isToken(obj: any): obj is Token {
  return obj && 
    typeof obj.address === 'string' && 
    typeof obj.symbol === 'string' &&
    typeof obj.decimals === 'number';
}

export function isTradingSignal(obj: any): obj is TradingSignal {
  return obj && 
    typeof obj.action === 'string' &&
    ['buy', 'sell'].includes(obj.action) &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 && obj.confidence <= 1;
}

export function isPortfolio(obj: any): obj is Portfolio {
  return obj && 
    typeof obj.totalValue === 'number' &&
    Array.isArray(obj.assets) &&
    typeof obj.performance === 'object';
}
```

### Validation Functions
```typescript
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateAddress(address: string): boolean {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
}

export function validateAmount(amount: string): boolean {
  const amountRegex = /^\d+(\.\d+)?$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
}

export function validatePercentage(value: number): boolean {
  return value >= 0 && value <= 100;
}
```

## Usage Examples

### Component Props
```typescript
// Using the defined types in React components
interface TradingCardProps {
  token: Token;
  balance: TokenBalance;
  onTrade: (action: 'buy' | 'sell', amount: number) => void;
  className?: string;
}

export function TradingCard({ token, balance, onTrade, className }: TradingCardProps) {
  const handleBuy = () => onTrade('buy', 100);
  const handleSell = () => onTrade('sell', 100);

  return (
    <div className={className}>
      <h3>{token.name}</h3>
      <p>Balance: {balance.balance}</p>
      <p>Value: ${balance.value?.toFixed(2)}</p>
      <button onClick={handleBuy}>Buy</button>
      <button onClick={handleSell}>Sell</button>
    </div>
  );
}
```

### API Functions
```typescript
// Using types in API functions
export async function fetchUserPortfolio(userId: string): Promise<Portfolio> {
  const response = await fetch(`/api/users/${userId}/portfolio`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio');
  }
  
  const data: ApiResponse<Portfolio> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Unknown error');
  }
  
  return data.data;
}

export async function executeTrade(tradeData: TradingSignal): Promise<Transaction> {
  const response = await fetch('/api/trading/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tradeData),
  });
  
  if (!response.ok) {
    throw new Error('Trade execution failed');
  }
  
  const data: ApiResponse<Transaction> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Trade execution failed');
  }
  
  return data.data;
}
```

### State Management
```typescript
// Using types in Zustand store
interface TradingState {
  activeSessions: AITradingSession[];
  strategies: TradingStrategy[];
  signals: TradingSignal[];
  
  // Actions
  addSession: (session: AITradingSession) => void;
  updateSession: (id: string, updates: Partial<AITradingSession>) => void;
  removeSession: (id: string) => void;
  addSignal: (signal: TradingSignal) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  activeSessions: [],
  strategies: [],
  signals: [],
  
  addSession: (session) => set((state) => ({
    activeSessions: [...state.activeSessions, session]
  })),
  
  updateSession: (id, updates) => set((state) => ({
    activeSessions: state.activeSessions.map(session =>
      session.id === id ? { ...session, ...updates } : session
    )
  })),
  
  removeSession: (id) => set((state) => ({
    activeSessions: state.activeSessions.filter(session => session.id !== id)
  })),
  
  addSignal: (signal) => set((state) => ({
    signals: [...state.signals, signal]
  })),
}));
```

## Best Practices

### Type Safety
1. **Always define interfaces** for complex objects
2. **Use strict typing** instead of `any`
3. **Implement type guards** for runtime validation
4. **Leverage TypeScript's utility types** for common patterns

### Interface Design
1. **Keep interfaces focused** and single-purpose
2. **Use composition** over inheritance
3. **Make optional properties explicit** with `?`
4. **Use union types** for mutually exclusive values

### Performance
1. **Avoid complex nested types** in frequently accessed data
2. **Use readonly** for immutable data
3. **Consider branded types** for domain-specific values
4. **Leverage type inference** where appropriate

### Maintenance
1. **Document complex types** with JSDoc comments
2. **Use consistent naming conventions** across the project
3. **Group related types** in logical modules
4. **Version types** when making breaking changes
