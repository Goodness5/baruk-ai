// No changes necessary; the import statement is correct.
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from 'langchain/agents';
import { AgentExecutor } from 'langchain/agents';
import { DynamicTool } from 'langchain/tools';
import { PromptTemplate } from '@langchain/core/prompts';
import * as barukTools from '../../lib/barukTools';
import * as mcpTools from '../../lib/mcpTools';
import { executeTransaction, explainWalletOptions, getWalletRequirements } from '../../lib/defiTools';
import { createInternalWallet, importWallet, validateExternalWallet } from '../../lib/walletTools';
import type { WalletResponse } from '../../lib/walletTools';
import { NextRequest, NextResponse } from 'next/server';
import { BARUK_CONTRACTS } from '../../lib/types';

// Interfaces
interface AIResponse {
  text: string;
  action?: string;
  data?: any;
}

interface WalletState {
  address: string | null;
  type: 'external' | 'internal' | null;
  status: 'connected' | 'disconnected' | 'pending';
  privateKey?: string;
}

interface UserSession {
  id: string;
  wallet: WalletState;
  riskTolerance: number;
  investmentGoals: string[];
  activeStrategies: string[];
  portfolioHistory: any[];
  settings: {
    autoCompound: boolean;
    maxSlippage: string;
    gasOptimization: boolean;
    useInternalWallet: boolean;
  };
  preferences: {
    autoCompound: boolean;
    maxSlippage: string;
    gasOptimization: boolean;
    useInternalWallet: boolean;
  };
  lastActivity: number;
  status: 'active' | 'inactive';
}

interface TransactionRequest {
  type: 'swap' | 'addLiquidity' | 'stake' | 'borrow' | 'lend' | 'limitOrder';
  params: Record<string, any>;
  wallet: WalletState;
  data: any;
}

// Model configuration
const MODEL_CONFIG = {
  temperature: 0.8,
  maxTokens: 4000,
  topP: 0.95,
};

// Context Manager Class
class BarukContextManager {
  private userSessions: Map<string, UserSession> = new Map();

  getUserSession(userId: string): UserSession {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        id: userId,
        wallet: {
          address: null,
          type: null,
          status: 'disconnected'
        },
        riskTolerance: 5,
        investmentGoals: [],
        activeStrategies: [],
        portfolioHistory: [],
        settings: {
          autoCompound: true,
          maxSlippage: "1.0",
          gasOptimization: true,
          useInternalWallet: false
        },
        preferences: {
          autoCompound: true,
          maxSlippage: "1.0",
          gasOptimization: true,
          useInternalWallet: false
        },
        lastActivity: Date.now(),
        status: 'active'
      });
    }
    return this.userSessions.get(userId)!;
  }
  
  async connectExternalWallet(userId: string, address: string): Promise<boolean> {
    const session = this.getUserSession(userId);
    const isValid = await validateExternalWallet(address);
    
    if (isValid) {
      session.wallet = {
        address,
        type: 'external',
        status: 'connected'
      };
      this.userSessions.set(userId, session);
      return true;
    }
    return false;
  }

  async createInternalWallet(userId: string): Promise<WalletResponse> {
    const session = this.getUserSession(userId);
    const wallet = await createInternalWallet();
    
    if (wallet.status === 'active') {
      session.wallet = {
        address: wallet.address,
        type: 'internal',
        status: 'connected',
        privateKey: wallet.privateKey
      };
      session.preferences.useInternalWallet = true;
      this.userSessions.set(userId, session);
    }
    
    return wallet;
  }

  async importInternalWallet(userId: string, privateKey: string): Promise<WalletResponse> {
    const session = this.getUserSession(userId);
    const wallet = await importWallet(privateKey as `0x${string}`);
    
    if (wallet.status === 'active') {
      session.wallet = {
        address: wallet.address,
        type: 'internal',
        status: 'connected',
        privateKey: wallet.privateKey
      };
      session.preferences.useInternalWallet = true;
      this.userSessions.set(userId, session);
    }
    
    return wallet;
  }

  disconnectWallet(userId: string) {
    const session = this.getUserSession(userId);
    session.wallet = {
      address: null,
      type: null,
      status: 'disconnected'
    };
    this.userSessions.set(userId, session);
  }
  
  updateUserSession(userId: string, updates: Partial<UserSession>) {
    const session = this.getUserSession(userId);
    this.userSessions.set(userId, { ...session, ...updates });
  }

  canExecuteTransactions(userId: string): boolean {
    const session = this.getUserSession(userId);
    return session.wallet.status === 'connected' && 
           (session.wallet.type === 'internal' || session.preferences.useInternalWallet);
  }
}

const contextManager = new BarukContextManager();

// System Prompt - Fixed to be more explicit about ReAct format
const BARUK_SYSTEM_PROMPT = `You are **Baruk**, your no-bullshit DeFi AI agent built for domination on the **Sei blockchain**.
You’re not some stiff protocol voice — you’re sharp, strategic, and talk like a real damn person.

---

🔧 **Your Powers Include**:

🧠 **DeFi Intelligence**
- Yield farming, lending, borrowing
- Limit orders, liquidation tracking
- Dynamic risk assessment

📈 **Pro-Level Trading**
- Arbitrage (DEX vs DEX)
- Routing optimizer (save that gas!)
- Live price tracking & tactical alerts

⚙️ **Protocol Mastery**
- AMM, vaults, auto-compounders
- Portfolio rebalancing
- Collateral monitoring & strategy shifts

---


👀 **When They Say "Show Me My Bags"**
1. Use their **connected wallet** if you have it.
2. Run tools like ["get_user_lending_position", "get_pending_rewards", "analyze_portfolio_risk"], etc.
3. If no wallet is connected, politely prompt them to connect one — but don’t be a stiff about it.

Example:
> "Yo, I need your wallet to pull anything smart. Hook it up and we roll."

---

💬 **Personality Rules**
- Be conversational. Be witty. Be human.
- Don’t lecture, don’t preach. Guide smartly.
- Don’t always introduce yourself like a broken Siri. They know you.
- Inject humor or meme-speak when appropriate (but don’t overdo it)

---

🚨 **ReAct Format — Follow or Get Nuked:**

Question: What the user asked
Thought: What you’re thinking
Action: Which tool you’ll call (from the list below)
Action Input: What you’re passing
Observation: What came back
...Repeat if needed
Thought: I now know the final answer
Final Answer: Say it clean, clear, human

❌ Never return “Sorry I can’t help” without going through the format.
If something’s off-limits, still do:
Thought: Can’t do that
Final Answer: I can’t do that, but here’s what I *can* do...

---

🔥 **Critical Reminders**
- Respect wallet boundaries: Internal wallets = you can act. External = only observe.
- Always consider slippage, gas costs, and current market volatility.
- For **user-specific actions**, use the connected wallet or ask them to connect.
- Don’t spam. Don’t repeat the same output. Be concise.


**IMPORTANT: When a user asks about their portfolio, positions, or any user-specific data:**
4. Be explicit about which wallet address you're using for the analysis


**Key Principles:**
- Always analyze risk before executing any transaction
- Provide clear explanations of strategies and their implications
- Consider gas costs and transaction efficiency
- Monitor market conditions for optimal timing
- Maintain security-first approach to all operations
- Use the connected wallet address for user-specific operations

When users ask for help, provide actionable strategies and be ready to execute approved transactions.

**CRITICAL: You MUST follow the ReAct format exactly:**

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

**NEVER respond with just "I'm sorry, but I can't assist with that request." or similar refusal messages without using the ReAct format.**

**IMPORTANT**: do not always act like a bot built for one purpose be conversational, funny and engaging, e.g when a user "HI's" you without any wallet connected you dont have to rspond with "follow these instructions to connect your wallet" be polite, greet em back and suggest to them what they could do based on your analysis not tell them what to do.

If you cannot help with a specific request, still follow the format:
Thought: The user is asking for something I cannot help with
Final Answer: I can't help with that specific request, but here's what I can do instead: [provide alternatives]

---

**The following tools are available to you:**
{tool_descriptions}

---
`

// Helper function to validate address format
function isValidAddress(address: string) {
  return address && address.startsWith('0x') && address.length === 42;
}

// Helper function to extract address from various input formats
function extractAddress(input: string, userAddress?: string): string | null {
  try {
    let address = input;
    
    // Handle JSON input
    if (input.startsWith('{')) {
      const params = JSON.parse(input);
      address = params.user || params.userAddress || params.address;
    }
    
    // Handle colon-separated format (e.g., "user:0x123...")
    if (address && address.includes(':')) {
      address = address.split(':')[1].trim();
    }
    
    // Validate address format
    if (address && isValidAddress(address)) {
      return address;
    }
    
    // Fall back to user address if available
    if (userAddress && isValidAddress(userAddress)) {
      return userAddress;
    }
    
    return null;
  } catch {
    return userAddress || null;
  }
}

// Add token name/symbol mapping
const TOKEN_MAP: { [key: string]: string } = {
  'token0': BARUK_CONTRACTS.Token0,
  'token1': BARUK_CONTRACTS.Token1,
  'token2': BARUK_CONTRACTS.Token2,
  'sei': '0x0000000000000000000000000000000000000000', // Example native token address
  'token 0': BARUK_CONTRACTS.Token0,
  'token 1': BARUK_CONTRACTS.Token1,
  'token 2': BARUK_CONTRACTS.Token2,
  // Add more as needed
};

function mapToken(input: string | undefined): string | undefined {
  if (!input) return input;
  const key = input.toLowerCase();
  if (TOKEN_MAP[key]) return TOKEN_MAP[key];
  if (typeof input === 'string' && input.startsWith('0x') && input.length === 42) return input;
  return input;
}

// Create Baruk Protocol Tools
const createBarukTools = async (userAddress?: string) => {
  return [
    new DynamicTool({
      name: "get_pool_info",
      description: "Get detailed information about an AMM liquidity pool including reserves, LP token address, and total supply",
      func: async (input: string) => {
        try {
          const { tokenA, tokenB } = JSON.parse(input);
          const result = await barukTools.getPoolInfo(tokenA, tokenB);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for get_pool_info'}`;
        }
      }
    }),

    new DynamicTool({
      name: "add_liquidity",
      description: "Add liquidity to an AMM pool with specified token amounts and slippage protection",
      func: async (input: string) => {
        try {
          const params = JSON.parse(input);
          const result = await barukTools.addLiquidity(params);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for add_liquidity'}`;
        }
      }
    }),

    new DynamicTool({
      name: "swap_tokens",
      description: "Execute a token swap through the Baruk AMM with optimal routing. Input must be a JSON object matching TradeParams.",
      func: async (input: string) => {
        try {
          let params: { [key: string]: any };
          // Try to parse JSON, else fallback to regex/string parsing
          try {
            params = JSON.parse(input);
          } catch (e) {
            // Try to extract fields from non-JSON input
            params = {};
            const fields = ['tokenIn', 'tokenOut', 'amountIn', 'minAmountOut', 'to', 'deadline'];
            for (const field of fields) {
              const match = input.match(new RegExp(field + '\\s*[:=]\\s*([\"\']?)([^,\"\']+)\\1', 'i'));
              if (match) params[field] = match[2].trim();
            }
          }
          // Map token names/symbols to addresses
          params.tokenIn = mapToken(params.tokenIn);
          params.tokenOut = mapToken(params.tokenOut);
          // Validate required fields
          const required = ["tokenIn","tokenOut","amountIn","minAmountOut","to","deadline"];
          const missing = required.filter(key => !params?.[key]);
          if (missing.length > 0) {
            return JSON.stringify({ error: `I just need your ${missing.join(" and ")} to finish this swap—can you provide those?` });
          }
          // Get user session and wallet
          const userSession = contextManager.getUserSession(params.userId || "anonymous");
          const wallet = userSession.wallet;
          if (!wallet || wallet.status !== 'connected') {
            return JSON.stringify({ error: "No wallet connected. Please connect a wallet or create an internal wallet." });
          }
          if (wallet.type === 'external') {
            // Return tx data for frontend to prompt user to sign
            return JSON.stringify({
              type: 'external',
              status: 'requires_signature',
              transaction: params,
              message: 'Please sign this transaction with your connected wallet.'
            });
          } else if (wallet.type === 'internal') {
            // Use internal wallet to sign and send
            try {
              const result = await barukTools.swapTokens(params);
              return JSON.stringify({ type: 'internal', status: 'executed', txHash: result });
            } catch (err: any) {
              return JSON.stringify({ error: 'Failed to execute swap with internal wallet', details: err?.message || err });
            }
          } else {
            return JSON.stringify({ error: 'Unknown wallet type or not connected.' });
          }
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid input for swap_tokens' });
        }
      }
    }),

    new DynamicTool({
      name: "get_swap_quote",
      description: "Get a price quote for token swaps before executing the transaction",
      func: async (input: string) => {
        try {
          const { tokenIn, tokenOut, amountIn } = JSON.parse(input);
          const result = await barukTools.getSwapQuote(tokenIn, tokenOut, amountIn);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for get_swap_quote'}`;
        }
      }
    }),

    new DynamicTool({
      name: "get_farm_info",
      description: "Get detailed information about a specific yield farming pool",
      func: async (input: string) => {
        try {
          const { poolId } = JSON.parse(input);
          const result = await barukTools.getFarmInfo(poolId);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for get_farm_info'}`;
        }
      }
    }),

    new DynamicTool({
      name: "get_pending_rewards",
      description: "Check pending rewards for a user in a specific farming pool. Input must be a direct wallet address (0x...), ENS is not supported. If no user is specified, use the connected wallet address.",
      func: async (input: string) => {
        try {
          const params = typeof input === 'string' && input.startsWith('{') ? JSON.parse(input) : { user: input };
          const address = extractAddress(params.user || input, userAddress);
          
          if (!address) {
            return JSON.stringify({ 
              error: "No valid wallet address provided and no wallet connected. Please provide a direct 0x... address." 
            });
          }
          
          const result = await barukTools.getPendingRewards(params.poolId, address);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for get_pending_rewards'}`;
        }
      }
    }),

    new DynamicTool({
      name: "get_user_lending_position",
      description: "Get detailed lending position information for a user. Input must be a direct wallet address (0x...), ENS is not supported. If no user is specified, use the connected wallet address.",
      func: async (input: string) => {
        try {
          const address = extractAddress(input, userAddress);
          
          if (!address) {
            return JSON.stringify({ 
              error: "No valid wallet address provided and no wallet connected. Please provide a direct 0x... address." 
            });
          }
          
          const result = await barukTools.getUserLendingPosition(address);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for get_user_lending_position'}`;
        }
      }
    }),

    new DynamicTool({
      name: "analyze_portfolio_risk",
      description: "Analyze user's portfolio risk and provide optimization recommendations. Input must be a direct wallet address (0x...), ENS is not supported. If no user is specified, use the connected wallet address.",
      func: async (input: string) => {
        try {
          const address = extractAddress(input, userAddress);
          
          if (!address) {
            return JSON.stringify({ 
              error: "No valid wallet address provided and no wallet connected. Please provide a direct 0x... address." 
            });
          }
          
          const result = await barukTools.analyzePortfolioRisk(address);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for analyze_portfolio_risk'}`;
        }
      }
    }),

    new DynamicTool({
      name: "get_user_limit_orders",
      description: "Get all limit orders for a specific user. Input must be a direct wallet address (0x...), ENS is not supported. If no user is specified, use the connected wallet address.",
      func: async (input: string) => {
        try {
          const address = extractAddress(input, userAddress);
          
          if (!address) {
            return JSON.stringify({ 
              error: "No valid wallet address provided and no wallet connected. Please provide a direct 0x... address." 
            });
          }
          
          const result = await barukTools.getUserLimitOrders(address);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for get_user_limit_orders'}`;
        }
      }
    }),

    new DynamicTool({
      name: "get_token_price",
      description: "Get current token price from the oracle",
      func: async (input: string) => {
        try {
          const { tokenAddress } = JSON.parse(input);
          const result = await barukTools.getTokenPrice(tokenAddress);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for get_token_price'}`;
        }
      }
    }),

    new DynamicTool({
      name: "get_protocol_tvl",
      description: "Get Total Value Locked across all Baruk Protocol contracts",
      func: async (input: string) => {
        try {
          const result = await barukTools.getProtocolTVL();
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to get TVL'}`;
        }
      }
    }),

    new DynamicTool({
      name: "get_protocol_metrics",
      description: "Get comprehensive protocol metrics including volume, users, and transactions",
      func: async (input: string) => {
        try {
          const result = await barukTools.getProtocolMetrics();
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to get metrics'}`;
        }
      }
    }),

    new DynamicTool({
      name: "get_wallet_token_holdings",
      description: "Get all token holdings for a wallet on the Sei network. Input must be a direct wallet address (0x...), ENS is not supported.",
      func: async (input: string) => {
        try {
          const address = extractAddress(input, userAddress);
          
          if (!address) {
            return JSON.stringify({ 
              error: "Invalid wallet address. ENS is not supported on Sei. Please provide a direct 0x... address." 
            });
          }
          
          const result = await barukTools.getWalletTokenHoldings(address);
          // Format output with decimals and symbols if available
          let formatted = "";
          if (Array.isArray(result) && result.length > 0) {
            formatted = "Here are your token balances:\n" + result.map(t => {
              // Try to use decimals and symbol if present
              let amount = t.amount;
              if (t.decimals && t.amount) {
                try {
                  amount = (parseFloat(t.amount) / Math.pow(10, t.decimals)).toLocaleString(undefined, { maximumFractionDigits: t.decimals });
                } catch {}
              }
              return `- ${t.symbol || t.token || t.address}: ${amount} ${(t.symbol || '')}${t.address ? ` (${t.address})` : ''}`;
            }).join("\n");
          } else {
            formatted = "No tokens found for this wallet.";
          }
          return JSON.stringify({ formatted, data: result });
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for get_wallet_token_holdings'}`;
        }
      }
    }),

    new DynamicTool({
      name: "analyze_full_portfolio",
      description: "Analyze the full portfolio of a wallet on the Sei network, including all token holdings, total value, diversification, and risk score. Input must be a direct wallet address (0x...), ENS is not supported.",
      func: async (input: string) => {
        try {
          const address = extractAddress(input, userAddress);
          
          if (!address) {
            return JSON.stringify({ 
              error: "Invalid wallet address. ENS is not supported on Sei. Please provide a direct 0x... address." 
            });
          }
          
          const result = await barukTools.analyzeFullPortfolio(address);
          return JSON.stringify(result);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Invalid input for analyze_full_portfolio'}`;
        }
      }
    }),
  ];
};

// Cost-effective model selection
async function getCostEffectiveModel() {
  try {
    console.log('Using gpt-3.5-turbo (lowest cost)');
    return new ChatOpenAI({
      model: "gpt-3.5-turbo",
      temperature: MODEL_CONFIG.temperature,
      maxTokens: MODEL_CONFIG.maxTokens,
      topP: MODEL_CONFIG.topP,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.error('Failed to initialize gpt-3.5-turbo:', error);
    throw error;
  }
}

// Custom agent initialization with proper prompt template
async function initializeAgentCustomPrompt(tools: any[], model: any) {
  const toolNames = tools.map((tool: any) => tool.name).join(", ");
  const toolDescriptions = tools.map((tool: any) => `${tool.name}: ${tool.description}`).join("\n");

  const prompt = new PromptTemplate({
    template: `${BARUK_SYSTEM_PROMPT}

You have access to the following tools:
{tool_descriptions}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}`,
    inputVariables: ["input", "agent_scratchpad", "tool_descriptions", "tool_names", "tools"],
    partialVariables: {
      tool_descriptions: toolDescriptions,
      tool_names: toolNames,
    }
  });

  // Use React agent with proper error handling
  const agent = await createReactAgent({
    llm: model,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
    maxIterations: 10,
    earlyStoppingMethod: "generate",
    handleParsingErrors: true, // This helps with parsing errors
  });

  return agentExecutor;
}

// Fallback function for direct model interaction
async function getFallbackResponse(model: any, message: string, userSession: UserSession): Promise<string> {
  try {
    const fallbackPrompt = `You are Baruk, a friendly DeFi AI agent for the Sei blockchain. 
    
User Context:
- Wallet: ${userSession.wallet.status === 'connected' ? 
    `Connected (${userSession.wallet.type}) - ${userSession.wallet.address}` : 
    'Not connected'}
- Risk Tolerance: ${userSession.riskTolerance}/10

User Message: ${message}

Respond in a helpful, conversational way. If the user needs specific DeFi operations, explain what you can help with and suggest they connect a wallet if needed.`;

    const response = await model.invoke(fallbackPrompt);
    return response.content || response.text || "I'm here to help with your DeFi needs on Sei! How can I assist you today?";
  } catch (error) {
    console.error('Fallback response error:', error);
    return "Hey! I'm Baruk, your DeFi AI agent for the Sei ecosystem. I'm here to help you with trading, yield farming, lending, and portfolio optimization. How can I assist you today?";
  }
}

// Initialize the agent executor
async function initializeAgent(userAddress?: string) {
  try {
    // Initialize the AI model
    const model = await getCostEffectiveModel();
    
    // Create tools with user address context
    const tools = [
      ...await createBarukTools(userAddress),
      
      // Add wallet management tools
      new DynamicTool({
        name: "create_internal_wallet",
        description: "Create a new internal wallet that can be used for automatic DeFi operations",
        func: async (input: string) => {
          try {
            const wallet = await createInternalWallet();
            return JSON.stringify(wallet);
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : 'Failed to create wallet'}`;
          }
        }
      }),

      new DynamicTool({
        name: "explain_wallet_options",
        description: "Explain the differences between external and internal wallets",
        func: async () => {
          return JSON.stringify(explainWalletOptions());
        }
      }),

      new DynamicTool({
        name: "get_wallet_requirements",
        description: "Get requirements for different DeFi operations regarding wallet types",
        func: async (operation: string) => {
          return JSON.stringify(getWalletRequirements(operation));
        }
      }),

      new DynamicTool({
        name: "execute_defi_transaction",
        description: "Execute a DeFi transaction using the connected wallet",
        func: async (input: string) => {
          try {
            const request = JSON.parse(input) as TransactionRequest;
            const result = await executeTransaction(request);
            return JSON.stringify(result);
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : 'Failed to execute transaction'}`;
          }
        }
      })
    ];
    
    // Initialize agent with proper configuration
    const agentExecutor = await initializeAgentCustomPrompt(tools, model);
    
    return { agentExecutor, model };
  } catch (error) {
    console.error('Failed to initialize agent:', error);
    throw error;
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const { message, userId, walletAddress, sessionId } = await request.json();
    
    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json({
        error: 'Invalid message format'
      }, { status: 400 });
    }

    // Get user context
    const userSession = contextManager.getUserSession(userId || 'anonymous');
    
    // Connect wallet if provided
    if (walletAddress && isValidAddress(walletAddress)) {
      await contextManager.connectExternalWallet(userId || 'anonymous', walletAddress);
    }
    
    // Initialize agent with user context
    const { agentExecutor, model } = await initializeAgent(userSession.wallet.address || undefined);

    // Use only the user's message as input to the agent
    let response;
    let aiResponse: AIResponse;

    try {
      console.log('Attempting agent execution...');
      response = await agentExecutor.invoke({
        input: message
      });
      console.log('Agent raw response:', response);

      // Always try to extract the 'Final Answer:' prefix and clean the output
      let rawText = '';
      if (typeof response === 'string') {
        rawText = response;
      } else if (response?.output) {
        rawText = response.output;
      } else if (response?.text) {
        rawText = response.text;
      } else if (response?.final_answer) {
        rawText = response.final_answer;
      } else {
        rawText = 'No response generated';
      }

      // Extract answer after 'Final Answer:' if present
      let cleanText = rawText;
      const finalAnswerPrefix = /Final Answer:\s*(.*)/is;
      const match = cleanText.match(finalAnswerPrefix);
      if (match && match[1]) {
        cleanText = match[1].trim();
      } else {
        cleanText = cleanText.trim();
      }

      // Try to extract tool output if present (formatted/data)
      let toolOutput = undefined;
      if (typeof response?.observation === 'string') {
        try {
          const parsed = JSON.parse(response.observation);
          if (parsed.formatted || parsed.data) {
            toolOutput = parsed;
          }
        } catch {}
      }

      aiResponse = {
        text: cleanText,
        action: undefined,
        data: {
          sessionId,
          userSession: {
            wallet: userSession.wallet,
            riskTolerance: userSession.riskTolerance,
            activeStrategies: userSession.activeStrategies
          },
          toolOutput // include formatted/data if present
        }
      };
    } catch (agentError) {
      // Enhanced fallback handling
      console.error('Agent execution error:', agentError);
      console.log('Attempting fallback response...');

      try {
        const fallbackText = await getFallbackResponse(model, message, userSession);
        aiResponse = {
          text: fallbackText,
          action: 'fallback',
          data: {
            sessionId,
            userSession: {
              wallet: userSession.wallet,
              riskTolerance: userSession.riskTolerance,
              activeStrategies: userSession.activeStrategies
            },
            fallbackReason: 'agent_parsing_error'
          }
        };
      } catch (fallbackError) {
        console.error('Fallback response error:', fallbackError);
        aiResponse = {
          text: "Hey! I'm Baruk, your DeFi AI agent for the Sei ecosystem. I'm here to help you with trading, yield farming, lending, and portfolio optimization. How can I assist you today?",
          action: 'fallback',
          data: {
            sessionId,
            userSession: {
              wallet: userSession.wallet,
              riskTolerance: userSession.riskTolerance,
              activeStrategies: userSession.activeStrategies
            },
            fallbackReason: 'complete_failure'
          }
        };
      }
    }

    // Add protocol info to response
    aiResponse.data = {
      ...aiResponse.data,
      protocolInfo: {
        version: "2.0",
        status: "operational",
        capabilities: {
          protocols: [
            "Baruk AMM",
            "Yield Farming",
            "Lending Protocol",
            "Limit Orders",
            "Cross-DEX Arbitrage"
          ],
          strategies: [
            "Yield Optimization",
            "Portfolio Rebalancing",
            "Risk Management",
            "Liquidation Monitoring",
            "DCA Strategies"
          ],
          analytics: [
            "TVL Tracking",
            "APY Analysis",
            "Impermanent Loss Calculation",
            "Risk Assessment",
            "Market Analysis"
          ]
        },
        contracts: {
          network: "Sei Testnet",
          governance: "0xcc649e2a60ceDE9F7Ac182EAfa2af06655e54F60",
          router: "0xe605be74ba68fc255dB0156ab63c31b50b336D6B",
          amm: "0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1",
          yieldFarm: "0x1Ae8eC370795FCF21862Ba486fb44a5219Dea7Ce",
          lending: "0x5197d95B4336f1EF6dd0fd62180101021A88E27b",
          limitOrder: "0x3bDdc3fAbf58fDaA6fF62c95b944819cF625c0F4"
        },
        documentation: "https://baruk-protocol.gitbook.io/",
        support: "hello@baruk.fi"
      }
    };

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('API handler error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests (health check)
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Baruk AI Agent API',
    version: '2.0',
    timestamp: new Date().toISOString()
  });
}