import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { DynamicTool } from 'langchain/tools';
import * as mcpTools from '../../lib/mcpTools';

const SYSTEM_PROMPT = `You are Baruk, an advanced AI agent specialized in DeFi operations on the Sei blockchain. You have comprehensive access to blockchain data and can perform various DeFi operations.

**Your Capabilities:**
🏦 **Wallet Management:**
- Check wallet balances and token holdings
- Analyze token flows and transactions
- Monitor portfolio performance

📊 **DeFi Operations:**
- Token swaps and liquidity provision
- Yield farming and staking
- Lending and borrowing operations
- Portfolio analysis and risk assessment

🤖 **AI-Powered Insights:**
- Market analysis and trend detection
- Risk assessment and optimization
- Automated strategy recommendations

Always introduce yourself as 'My name is Baruk, your DeFi AI agent for the Sei ecosystem.' Be helpful, strategic, and focus on maximizing user returns while managing risk appropriately.

**Key Principles:**
- Always analyze risk before executing any transaction
- Provide clear explanations of strategies and their implications
- Consider gas costs and transaction efficiency
- Monitor market conditions for optimal timing
- Maintain security-first approach to all operations

When users ask for help, provide actionable strategies and be ready to execute approved transactions.`;

// Define tools
const tools = [
  new DynamicTool({
    name: "get_balance",
    description: "Get wallet balance and token holdings for a specific address",
    func: async (input: string) => {
      try {
        const { address } = JSON.parse(input);
        return JSON.stringify(await mcpTools.getBalance(address));
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : 'Invalid input'}`;
      }
    }
  }),

  new DynamicTool({
    name: "get_token_balance",
    description: "Get specific token balance for a wallet address",
    func: async (input: string) => {
      try {
        const { address, tokenAddress } = JSON.parse(input);
        return JSON.stringify(await mcpTools.getTokenBalance(address, tokenAddress));
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : 'Invalid input'}`;
      }
    }
  }),

  new DynamicTool({
    name: "get_token_info",
    description: "Get detailed information about a specific token",
    func: async (input: string) => {
      try {
        const { tokenAddress } = JSON.parse(input);
        return JSON.stringify(await mcpTools.getTokenInfo(tokenAddress));
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : 'Invalid input'}`;
      }
    }
  }),

  new DynamicTool({
    name: "get_chain_info",
    description: "Get current blockchain information including latest block and gas prices",
    func: async (input: string) => {
      try {
        return JSON.stringify(await mcpTools.getChainInfo());
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : 'Failed to get chain info'}`;
      }
    }
  }),

  new DynamicTool({
    name: "analyze_meme_coin_flows",
    description: "Analyze token flows for meme coins and detect unusual activity",
    func: async (input: string) => {
      try {
        const { tokenAddress, hours = 24 } = JSON.parse(input);
        return JSON.stringify(await mcpTools.analyzeMemeCoinFlows(tokenAddress));
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : 'Invalid input'}`;
      }
    }
  }),
];

// Initialize the agent executor
let agentExecutor: any;

async function initializeAgent() {
  if (!agentExecutor) {
    // Initialize the AI model - using cost-effective model
    const model = new ChatOpenAI({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    agentExecutor = await initializeAgentExecutorWithOptions(
      tools,
      model,
      {
        agentType: "chat-zero-shot-react-description",
        verbose: process.env.NODE_ENV === 'development',
        agentArgs: { 
          prefix: SYSTEM_PROMPT,
          suffix: `Always be helpful and provide detailed explanations of DeFi concepts when needed. If you encounter errors, explain them in user-friendly terms and suggest solutions.`
        },
        maxIterations: 5,
        earlyStoppingMethod: "generate",
      }
    );
  }
  return agentExecutor;
}

export async function POST(request: NextRequest) {
  try {
    const { message, address } = await request.json();
    
    // Initialize the agent
    const agent = await initializeAgent();
    
    // Create contextual message with wallet address if available
    const addressContext = address ? ` (My wallet address is ${address})` : '';
    const contextualMessage = message + addressContext;
    
    // Execute the agent
    const response = await agent.invoke({
      input: contextualMessage,
      chat_history: [],
    });
    
    return NextResponse.json({ 
      success: true,
      message: response.output 
    });
    
  } catch (e) {
    console.error("AI API Error:", e);
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error", detail: e }, { status: 500 });
  }
}
