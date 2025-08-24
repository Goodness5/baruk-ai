# Setup & Installation

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or yarn)
- **Git**: Version 2.0.0 or higher
- **Operating System**: macOS, Linux, or Windows (WSL recommended for Windows)

### Development Tools
- **Code Editor**: VS Code (recommended) with TypeScript support
- **Browser**: Chrome, Firefox, or Safari with developer tools
- **Terminal**: Terminal.app (macOS), bash/zsh (Linux), or PowerShell (Windows)

### Blockchain Requirements
- **Sei Network Access**: Testnet or mainnet RPC endpoint
- **Wallet**: MetaMask, Keplr, or other Web3 wallet
- **Test Tokens**: For testing on testnet

## Installation Steps

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/your-org/baruk-ai.git

# Navigate to project directory
cd baruk-ai

# Check out the latest release
git checkout main
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install additional development dependencies (optional)
npm install -D @types/node @types/react @types/react-dom
```

### 3. Environment Configuration

#### Create Environment File
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit the environment file with your configuration
nano .env.local
```

#### Required Environment Variables
```bash
# Sei Network Configuration
SEI_RPC_URL=https://evm-rpc.sei-apis.com
SEI_CHAIN_ID=1328

# Baruk Protocol Contract Addresses
BARUK_ROUTER_ADDRESS=0xe605be74ba68fc255dB0156ab63c31b50b336D6B
BARUK_AMM_ADDRESS=0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1
BARUK_FACTORY_ADDRESS=0xCEeC70dF7bC3aEB57F078A1b1BeEa2c6320d8957

# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# OpenAI Configuration (for AI trading)
OPENAI_API_KEY=your-openai-api-key

# Covalent API (for price data)
COVALENT_API_KEY=your-covalent-api-key

# Optional: Database Configuration
DATABASE_URL=your-database-connection-string
REDIS_URL=your-redis-connection-string
```

#### Optional Environment Variables
```bash
# Biconomy Account Abstraction (alternative to Privy)
BICONOMY_BUNDLER_URL=https://bundler.biconomy.io/api/v2/1328/YOUR_BUNDLER_KEY
BICONOMY_PAYMASTER_URL=https://paymaster.biconomy.io/api/v1/1328/YOUR_PAYMASTER_KEY
BICONOMY_API_KEY=your-biconomy-api-key

# Particle Network (alternative to Biconomy)
PARTICLE_APP_ID=your-particle-app-id
PARTICLE_CLIENT_KEY=your-particle-client-key
PARTICLE_SERVER_KEY=your-particle-server-key

# Security Configuration
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key

# Monitoring and Analytics
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

### 4. Blockchain Configuration

#### Sei Network Setup
```typescript
// src/app/lib/seiConfig.ts
export const seiConfig = {
  chainId: 1328, // Mainnet
  rpcUrl: process.env.SEI_RPC_URL || 'https://evm-rpc.sei-apis.com',
  explorer: 'https://sei.io/explorer',
  nativeCurrency: {
    name: 'SEI',
    symbol: 'SEI',
    decimals: 18,
  },
  contracts: {
    router: process.env.BARUK_ROUTER_ADDRESS,
    amm: process.env.BARUK_AMM_ADDRESS,
    factory: process.env.BARUK_FACTORY_ADDRESS,
  },
};
```

#### Testnet Configuration
```typescript
// For testnet development
export const seiTestnetConfig = {
  chainId: 713715, // Testnet
  rpcUrl: 'https://testnet-rpc.sei-apis.com',
  explorer: 'https://testnet.sei.io/explorer',
  nativeCurrency: {
    name: 'SEI',
    symbol: 'SEI',
    decimals: 18,
  },
  contracts: {
    // Testnet contract addresses
    router: '0x...',
    amm: '0x...',
    factory: '0x...',
  },
};
```

### 5. Wallet Configuration

#### MetaMask Setup
1. Install MetaMask browser extension
2. Add Sei Network to MetaMask:
   - Network Name: Sei Network
   - RPC URL: https://evm-rpc.sei-apis.com
   - Chain ID: 1328
   - Currency Symbol: SEI
   - Block Explorer: https://sei.io/explorer

#### Keplr Setup (Alternative)
1. Install Keplr browser extension
2. Create or import wallet
3. Add Sei Network to Keplr
4. Configure for EVM compatibility

### 6. AI Service Configuration

#### OpenAI Setup
```typescript
// src/app/lib/aiTradingService.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AITradingService {
  async generateTradingSignal(marketData: MarketData): Promise<TradingSignal> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert DeFi trading analyst. Analyze the market data and provide trading recommendations.',
        },
        {
          role: 'user',
          content: `Analyze this market data: ${JSON.stringify(marketData)}`,
        },
      ],
    });

    return this.parseTradingSignal(completion.choices[0].message.content);
  }
}
```

#### Covalent API Setup
```typescript
// src/app/lib/prices.ts
import axios from 'axios';

const covalentApi = axios.create({
  baseURL: 'https://api.covalenthq.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.COVALENT_API_KEY}`,
  },
});

export async function getTokenPrice(chainId: number, tokenAddress: string): Promise<number> {
  try {
    const response = await covalentApi.get(`/${chainId}/pricing/historical_by_addresses_v2_24_hr/${tokenAddress}/`);
    return response.data.data[0].prices[0].price;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}
```

## Development Setup

### 1. Start Development Server

```bash
# Start the development server
npm run dev

# The application will be available at http://localhost:3000
```

### 2. Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 4. Linting and Code Quality

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Run TypeScript type checking
npx tsc --noEmit
```

## Database Setup (Optional)

### 1. PostgreSQL Setup

```bash
# Install PostgreSQL
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Create database
createdb baruk_ai
```

#### Database Configuration
```typescript
// src/app/lib/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;
```

### 2. Redis Setup (Optional)

```bash
# Install Redis
# macOS
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-server

# Start Redis service
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

#### Redis Configuration
```typescript
// src/app/lib/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export default redis;
```

## Docker Setup (Alternative)

### 1. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: baruk_ai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 2. Docker Commands

```bash
# Build and start services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f app
```

## Troubleshooting

### Common Issues

#### 1. Node Version Issues
```bash
# Check Node.js version
node --version

# Use nvm to manage Node.js versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### 2. Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Environment Variable Issues
```bash
# Check if environment variables are loaded
echo $NEXT_PUBLIC_PRIVY_APP_ID

# Restart development server after changing environment variables
npm run dev
```

#### 4. Blockchain Connection Issues
```bash
# Test RPC connection
curl -X POST https://evm-rpc.sei-apis.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### 5. Wallet Connection Issues
- Ensure MetaMask is unlocked
- Check if Sei Network is added to MetaMask
- Verify contract addresses are correct
- Check browser console for error messages

### Performance Optimization

#### 1. Development Mode
```bash
# Use Turbopack for faster builds
npm run dev

# Enable React Fast Refresh
# This is enabled by default in Next.js 13+
```

#### 2. Production Build
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Optimize images
# Next.js Image component automatically optimizes images
```

#### 3. Caching
```typescript
// Enable React Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

## Deployment

### 1. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
vercel env add NEXT_PUBLIC_PRIVY_APP_ID
vercel env add OPENAI_API_KEY
vercel env add COVALENT_API_KEY
```

### 2. Docker Deployment

```bash
# Build production image
docker build -t baruk-ai .

# Run production container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID \
  baruk-ai
```

### 3. Manual Deployment

```bash
# Build the application
npm run build

# Copy build files to server
scp -r .next user@server:/path/to/app/

# Start the application
npm start
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use different API keys for development and production
- Rotate API keys regularly
- Use strong, unique secrets

### 2. Network Security
- Use HTTPS in production
- Implement rate limiting
- Validate all user inputs
- Use CORS policies appropriately

### 3. Blockchain Security
- Verify contract addresses before use
- Implement transaction signing validation
- Use secure RPC endpoints
- Monitor for suspicious activity

## Next Steps

After completing the setup:

1. **Test Basic Functionality**: Verify wallet connection and basic DeFi operations
2. **Configure AI Trading**: Set up OpenAI API and test AI trading signals
3. **Deploy Smart Contracts**: Deploy or verify contract addresses on Sei Network
4. **Set Up Monitoring**: Configure logging and monitoring tools
5. **Security Audit**: Review security configurations and conduct testing
6. **Performance Testing**: Load test the application and optimize performance

For additional help, refer to:
- [Architecture Documentation](architecture.md)
- [AI Trading Guide](ai-trading.md)
- [Smart Contracts Documentation](smart-contracts.md)
- [API Reference](api-reference.md)