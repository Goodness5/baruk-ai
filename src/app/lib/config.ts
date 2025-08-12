export const config = {
  // Sei Network Configuration
  sei: {
    rpcUrl: process.env.SEI_RPC_URL || 'https://evm-rpc.sei-apis.com',
    chainId: Number(process.env.SEI_CHAIN_ID) || 1328,
  },

  // Baruk Protocol Contract Addresses
  baruk: {
    routerAddress: process.env.BARUK_ROUTER_ADDRESS || '0x...',
    ammAddress: process.env.BARUK_AMM_ADDRESS || '0x...',
    factoryAddress: process.env.BARUK_FACTORY_ADDRESS || '0x...',
  },

  // Privy Configuration
  privy: {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id',
  },

  // Particle Network Configuration (Alternative to Biconomy)
  particle: {
    appId: process.env.PARTICLE_APP_ID || 'your_particle_app_id',
    clientKey: process.env.PARTICLE_CLIENT_KEY || 'your_particle_client_key',
    serverKey: process.env.PARTICLE_SERVER_KEY || 'your_particle_server_key',
  },

  // OpenAI Configuration for AI Trading
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key',
  },

  // Covalent API for price data
  covalent: {
    apiKey: process.env.COVALENT_API_KEY || 'your_covalent_api_key',
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your_encryption_key',
  },

  // Database Configuration (if using persistent storage)
  database: {
    url: process.env.DATABASE_URL || 'your_database_connection_string',
  },

  // Redis Configuration (for session management)
  redis: {
    url: process.env.REDIS_URL || 'your_redis_connection_string',
  },

  // Trading Configuration
  trading: {
    defaultGasLimit: '500000',
    defaultMaxFeePerGas: '20000000000', // 20 gwei
    defaultMaxPriorityFeePerGas: '2000000000', // 2 gwei
    defaultSlippageTolerance: 0.5, // 0.5%
    minConfidenceThreshold: 0.7, // 70%
    tradingIntervalMs: 30000, // 30 seconds
    maxConcurrentSessions: 5,
  },

  // AI Trading Strategies
  strategies: {
    momentum: {
      riskLevel: 'medium',
      maxSlippage: 0.5,
      maxTradeSize: '1000',
      minProfitThreshold: 0.3,
    },
    arbitrage: {
      riskLevel: 'low',
      maxSlippage: 0.1,
      maxTradeSize: '5000',
      minProfitThreshold: 0.1,
    },
    trend: {
      riskLevel: 'medium',
      maxSlippage: 0.3,
      maxTradeSize: '2000',
      minProfitThreshold: 0.5,
    },
  },
};

// Environment validation
export function validateConfig() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_PRIVY_APP_ID',
    'BARUK_ROUTER_ADDRESS',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work correctly');
  }

  return missing.length === 0;
}

// Get configuration for specific environment
export function getConfig(environment: 'development' | 'staging' | 'production' = 'development') {
  const baseConfig = { ...config };
  
  if (environment === 'production') {
    // Override with production-specific settings
    baseConfig.trading.tradingIntervalMs = 60000; // 1 minute in production
    baseConfig.trading.maxConcurrentSessions = 10;
  }
  
  return baseConfig;
}
