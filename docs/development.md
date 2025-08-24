# Development Guide

## Development Environment Setup

### Prerequisites
- Node.js 18+ and npm
- Git for version control
- VS Code (recommended) with extensions
- Chrome DevTools for debugging

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

## Project Structure

### Directory Organization
```
src/
├── app/                    # Next.js 13+ app directory
│   ├── components/        # Reusable UI components
│   ├── lib/              # Core business logic
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Global state management
│   └── [feature]/        # Feature-based routing
├── abi/                   # Smart contract ABIs
├── chains/                # Blockchain configuration
└── types/                 # TypeScript type definitions
```

### Component Architecture
- **Atomic Design**: Components follow atomic design principles
- **Composition**: Heavy use of component composition
- **Props Interface**: Strict TypeScript interfaces for all props
- **Error Boundaries**: Comprehensive error handling

## Coding Standards

### TypeScript Guidelines
```typescript
// Always use strict typing
interface UserProps {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
}

// Use type guards for runtime validation
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

// Prefer interfaces over types for objects
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}
```

### React Best Practices
```typescript
// Use functional components with hooks
export default function UserProfile({ user }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateUser } = useUserActions();

  // Memoize expensive calculations
  const userStats = useMemo(() => calculateUserStats(user), [user]);

  // Use callback for event handlers
  const handleSave = useCallback(async (data: UserUpdateData) => {
    try {
      await updateUser(user.id, data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, [user.id, updateUser]);

  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
}
```

### State Management
```typescript
// Zustand store with TypeScript
interface AppState {
  user: User | null;
  wallet: WalletState;
  balances: TokenBalance[];
  positions: Position[];
  
  // Actions
  setUser: (user: User | null) => void;
  updateBalances: (balances: TokenBalance[]) => void;
  addPosition: (position: Position) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  wallet: { isConnected: false, address: null },
  balances: [],
  positions: [],
  
  setUser: (user) => set({ user }),
  updateBalances: (balances) => set({ balances }),
  addPosition: (position) => set((state) => ({
    positions: [...state.positions, position]
  })),
}));
```

## Testing Strategy

### Testing Framework
```typescript
// Jest configuration
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
};
```

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '../store/useAppStore';
import UserProfile from './UserProfile';

// Mock the store
jest.mock('../store/useAppStore');

describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  beforeEach(() => {
    (useAppStore as jest.Mock).mockReturnValue({
      user: mockUser,
      updateUser: jest.fn(),
    });
  });

  it('renders user information correctly', () => {
    render(<UserProfile />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('handles edit mode toggle', () => {
    render(<UserProfile />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import AITradingDashboard from './AITradingDashboard';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('AITradingDashboard Integration', () => {
  it('loads and displays trading strategies', async () => {
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <PrivyProvider appId="test-app-id">
          <AITradingDashboard />
        </PrivyProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Momentum Trader')).toBeInTheDocument();
      expect(screen.getByText('Arbitrage Bot')).toBeInTheDocument();
    });
  });
});
```

## API Development

### API Route Structure
```typescript
// src/app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const TradingSignalSchema = z.object({
  tokenIn: z.string().min(1),
  tokenOut: z.string().min(1),
  amountIn: z.string().min(1),
  strategy: z.enum(['momentum', 'arbitrage', 'trend']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = TradingSignalSchema.parse(body);
    
    // Process trading signal
    const result = await processTradingSignal(validatedData);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Error Handling
```typescript
// Centralized error handling
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { success: false, error: 'Unknown error occurred' },
    { status: 500 }
  );
}
```

## Blockchain Integration

### Contract Interaction
```typescript
// src/app/lib/contracts.ts
import { createPublicClient, http, getContract } from 'viem';
import { sei } from 'viem/chains';
import { contractAddresses, contractABIs } from './contractConfig';

const client = createPublicClient({
  chain: sei,
  transport: http(process.env.SEI_RPC_URL),
});

export class ContractService {
  private router = getContract({
    address: contractAddresses.router,
    abi: contractABIs.router,
    client,
  });

  async getSwapQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<bigint> {
    try {
      const quote = await this.router.read.getAmountsOut([
        amountIn,
        [tokenIn, tokenOut],
      ]);
      
      return quote[1];
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw new AppError('Failed to get swap quote', 400);
    }
  }

  async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOutMin: bigint,
    deadline: bigint
  ): Promise<string> {
    try {
      const hash = await this.router.write.swap([
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMin,
        deadline,
      ]);
      
      return hash;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new AppError('Failed to execute swap', 400);
    }
  }
}
```

### Event Handling
```typescript
// Listen for blockchain events
export function setupEventListeners() {
  // Listen for swap events
  client.watchEvent({
    address: contractAddresses.router,
    event: {
      type: 'event',
      name: 'Swap',
      inputs: [
        { type: 'address', name: 'sender', indexed: true },
        { type: 'uint256', name: 'amountIn' },
        { type: 'uint256', name: 'amountOut' },
      ],
    },
    onLogs: (logs) => {
      logs.forEach((log) => {
        handleSwapEvent(log);
      });
    },
  });
}

function handleSwapEvent(log: any) {
  // Process swap event
  console.log('Swap event:', log);
  
  // Update UI or trigger actions
  useAppStore.getState().updateBalances([]);
}
```

## Performance Optimization

### Code Splitting
```typescript
// Dynamic imports for code splitting
const AITradingDashboard = dynamic(() => import('./AITradingDashboard'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Disable SSR for components that need browser APIs
});

const TradingChart = dynamic(() => import('./TradingChart'), {
  loading: () => <div>Loading chart...</div>,
});
```

### Memoization
```typescript
// Memoize expensive calculations
const expensiveCalculation = useMemo(() => {
  return data.reduce((acc, item) => {
    // Complex calculation
    return acc + item.value * item.weight;
  }, 0);
}, [data]);

// Memoize callback functions
const handleTrade = useCallback(async (tradeData: TradeData) => {
  try {
    const result = await executeTrade(tradeData);
    updatePortfolio(result);
  } catch (error) {
    handleError(error);
  }
}, [executeTrade, updatePortfolio, handleError]);
```

### React Query Optimization
```typescript
// Optimize React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Use optimistic updates for better UX
const updateBalanceMutation = useMutation({
  mutationFn: updateBalance,
  onMutate: async (newBalance) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['balances']);
    
    // Snapshot previous value
    const previousBalances = queryClient.getQueryData(['balances']);
    
    // Optimistically update
    queryClient.setQueryData(['balances'], (old: any) => ({
      ...old,
      [newBalance.token]: newBalance.amount,
    }));
    
    return { previousBalances };
  },
  onError: (err, newBalance, context) => {
    // Rollback on error
    queryClient.setQueryData(['balances'], context?.previousBalances);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries(['balances']);
  },
});
```

## Security Best Practices

### Input Validation
```typescript
// Use Zod for runtime validation
import { z } from 'zod';

const TradeSchema = z.object({
  tokenIn: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenOut: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountIn: z.string().regex(/^\d+(\.\d+)?$/),
  slippageTolerance: z.number().min(0.1).max(50),
});

export function validateTradeInput(input: unknown): TradeInput {
  return TradeSchema.parse(input);
}
```

### Authentication & Authorization
```typescript
// Middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../lib/auth';

export async function middleware(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await verifyAuth(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Add user to request context
    request.headers.set('x-user-id', user.id);
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

export const config = {
  matcher: '/api/:path*',
};
```

### Rate Limiting
```typescript
// Implement rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to all requests
app.use(limiter);
```

## Debugging and Logging

### Debug Configuration
```typescript
// Debug configuration
const debugConfig = {
  enabled: process.env.NODE_ENV === 'development',
  level: process.env.DEBUG_LEVEL || 'info',
  includeTimestamp: true,
  includeContext: true,
};

export function debug(message: string, context?: any) {
  if (!debugConfig.enabled) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    level: debugConfig.level,
    message,
    context: debugConfig.includeContext ? context : undefined,
  };
  
  console.log(JSON.stringify(logMessage, null, 2));
}
```

### Error Tracking
```typescript
// Centralized error tracking
export function trackError(error: Error, context?: any) {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
  
  // Send to error tracking service (e.g., Sentry)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context });
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  trackError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  trackError(new Error(event.reason), {
    type: 'unhandledrejection',
  });
});
```

## Deployment

### Build Configuration
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Optimize bundle
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Environment Management
```bash
# Production environment
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_CHAIN_ID=1328
NEXT_PUBLIC_RPC_URL=https://evm-rpc.sei-apis.com

# Staging environment
NODE_ENV=staging
NEXT_PUBLIC_API_URL=https://api-staging.yourdomain.com
NEXT_PUBLIC_CHAIN_ID=713715
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.sei-apis.com
```

## Monitoring and Analytics

### Performance Monitoring
```typescript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to analytics service
  console.log('Web Vital:', metric);
}

// Monitor Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### User Analytics
```typescript
// Track user interactions
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties);
  }
}

// Track trading actions
export function trackTradingAction(action: string, details: any) {
  trackEvent('trading_action', {
    action,
    ...details,
    timestamp: Date.now(),
  });
}
```

## Contributing Guidelines

### Code Review Process
1. **Pull Request**: Create PR with descriptive title and description
2. **Code Review**: At least one approval required
3. **Testing**: All tests must pass
4. **Documentation**: Update relevant documentation
5. **Merge**: Squash and merge to main branch

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(trading): add momentum trading strategy
fix(auth): resolve wallet connection timeout
docs(api): update API endpoint documentation
```

### Development Workflow
1. **Feature Branch**: Create feature branch from main
2. **Development**: Implement feature with tests
3. **Testing**: Run tests and linting
4. **Documentation**: Update documentation
5. **Pull Request**: Create PR for review
6. **Deploy**: Deploy to staging for testing
7. **Merge**: Merge to main after approval
