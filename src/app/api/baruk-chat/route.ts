/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "langchain/agents";
import { AgentExecutor } from "langchain/agents";
import { DynamicTool } from "langchain/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import * as barukTools from "../../lib/barukTools";
import { NextRequest, NextResponse } from "next/server";
import { BARUK_CONTRACTS } from "../../lib/types";

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

const contextManager = new ContextManager();

class TokenResolver {
  static async resolveTokenIdentifier(
    identifier: string,
    holdings: TokenInfo[]
  ): Promise<string> {
    if (identifier.startsWith("0x") && identifier.length === 42) {
      return identifier;
    }

    const fromHoldings = holdings.find(
      (t) =>
        t.symbol?.toLowerCase() === identifier.toLowerCase() ||
        t.name?.toLowerCase() === identifier.toLowerCase()
    );
    if (fromHoldings) return fromHoldings.address;

    const knownToken = Object.entries(BARUK_CONTRACTS).find(
      ([key]) => key.toLowerCase() === identifier.toLowerCase()
    )?.[1];
    if (knownToken) return knownToken;

    throw new Error(`Token ${identifier} not found in wallet or known tokens`);
  }

  static parseAmountInput(input: string, tokenInfo?: TokenInfo): string {
    if (!tokenInfo) return input;

    if (input.toLowerCase() === "all") {
      return tokenInfo.balance;
    }

    if (input.endsWith("%")) {
      const percent = parseFloat(input.replace("%", "")) / 100;
      const balance = BigInt(tokenInfo.balance);
      return (
        (balance * BigInt(Math.floor(percent * 10000))) /
        BigInt(10000)
      ).toString();
    }

    return input;
  }
}

async function enhanceSwapParameters(
  params: any,
  userId: string
): Promise<any> {
  const session = contextManager.getUserSession(userId);
  let holdings: TokenInfo[] = [];

  if (session.wallet.status === "connected" && session.wallet.address) {
    try {
      const holdingsResponse = await barukTools.getWalletTokenHoldings(
        session.wallet.address
      );
      holdings = holdingsResponse.map((t: any) => ({
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        balance: t.balance,
        decimals: t.decimals || 18,
        priceUSD: t.priceUSD,
      }));
    } catch (error) {
      console.error("Failed to fetch wallet holdings:", error);
    }
  }

  // Resolve token identifiers
  if (params.tokenIn) {
    params.tokenIn = await TokenResolver.resolveTokenIdentifier(
      params.tokenIn,
      holdings
    );
  }
  if (params.tokenOut) {
    params.tokenOut = await TokenResolver.resolveTokenIdentifier(
      params.tokenOut,
      holdings
    );
  }

  // Parse amount input
  if (params.amountIn) {
    const tokenInInfo = holdings.find((t) => t.address === params.tokenIn);
    params.amountIn = TokenResolver.parseAmountInput(
      params.amountIn,
      tokenInInfo
    );
  }

  // Set defaults
  if (!params.to && session.wallet.status === "connected") {
    params.to = session.wallet.address;
  }

  if (!params.deadline && session.settings.autoDeadline) {
    params.deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
  }

  if (
    !params.minAmountOut &&
    params.amountIn &&
    params.tokenIn &&
    params.tokenOut
  ) {
    try {
      const quote = await barukTools.getSwapQuote(
        params.tokenIn,
        params.tokenOut,
        params.amountIn
      );
      const slippage = session.settings.defaultSlippage;
      // params.minAmountOut = Math.floor(Number(quote.expectedOutput) * (1 - slippage / 100)).toString();
    } catch (error) {
      console.error(
        "Failed to get swap quote for slippage calculation:",
        error
      );
    }
  }

  return params;
}

const createSwapTool = () => {
  return new DynamicTool({
    name: "swap_tokens",
    description: `Execute token swap with automatic parameter resolution. Parameters:
    {
      "tokenIn": "address|symbol",  // Token to swap from (required)
      "tokenOut": "address|symbol", // Token to swap to (required)
      "amountIn": "number|all|X%",  // Amount or percentage (required)
      "minAmountOut": "number",     // Optional (auto-calculated)
      "to": "address",              // Optional (default: user's wallet)
      "deadline": "timestamp",      // Optional (default: now + 5m)
      "userId": "string"            // Required for context
    }`,
    func: async (input: string) => {
      try {
        console.log("[swap_tokens] Tool called with input:", input);
        // Trim and clean the input first
        let cleanedInput = input.trim();
        if (!cleanedInput.startsWith("{")) {
          // Try to extract JSON from markdown-style input
          const jsonMatch = cleanedInput.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanedInput = jsonMatch[0];
          }
        }
        let params;
        try {
          params = JSON.parse(cleanedInput);
        } catch (e) {
          return JSON.stringify({
            error: "Invalid JSON input",
            details: "Please provide parameters in exact JSON format",
            example: {
              tokenIn: "token1",
              tokenOut: "token2",
              amountIn: "100",
              userId: "user123"
            }
          });
        }

        if (!params.userId) {
          return JSON.stringify({
            error: "userId is required for swap operations",
          });
        }

        const enhancedParams = await enhanceSwapParameters(
          params,
          params.userId
        );

        // Validate required parameters
        const required = ["tokenIn", "tokenOut", "amountIn"];
        const missing = required.filter((key) => !enhancedParams[key]);
        if (missing.length > 0) {
          return JSON.stringify({
            error: `Missing required parameters: ${missing.join(", ")}`,
            suggestion: "Please specify all required swap parameters",
          });
        }

        // Execute the swap
        const session = contextManager.getUserSession(params.userId);
        if (session.wallet.type === "internal" && session.wallet.privateKey) {
          // Execute directly with internal wallet
          console.log("[swap_tokens] Executing swap with internal wallet");
          const result = await barukTools.swapTokens({
            ...enhancedParams,
            privateKey: session.wallet.privateKey,
          });
          return JSON.stringify(result);
        } else {
          // Return transaction data for user to sign
          console.log("[swap_tokens] Returning transaction for signature");
          return JSON.stringify({
            status: "requires_signature",
            transaction: enhancedParams,
            message: "Please sign this transaction in your wallet",
          });
        }
      } catch (error) {
        console.error("[swap_tokens] Error:", error);
        return JSON.stringify({
          error:
            error instanceof Error ? error.message : "Invalid swap request",
          details: "Please check your parameters and try again",
        });
      }
    },
  });
};

const createPortfolioTools = (userId: string) => {
  return [
    new DynamicTool({
      name: "get_wallet_holdings",
      description:
        "Get detailed token holdings for the current wallet including balances and prices",
      func: async () => {
        console.log("[get_wallet_holdings] Tool called for user:", userId);
        const session = contextManager.getUserSession(userId);

        // Auto-connect if address exists but status is disconnected
        if (session.wallet.address && session.wallet.status === "disconnected") {
          await contextManager.connectWallet(
            userId,
            session.wallet.address,
            session.wallet.type || "external"
          );
        }

        if (!session.wallet.address) {
          return JSON.stringify({ error: "No wallet address found. Please provide or connect your wallet address." });
        }

        if (session.wallet.status !== "connected") {
          return JSON.stringify({
            error: "No wallet connected",
            suggestion: `To check your wallet tokens, please first connect your wallet. Your address is ${session.wallet.address}. Would you like to connect it now?`,
            actions: [
              {
                type: "connect_wallet",
                address: session.wallet.address
              }
            ]
          });
        }
        return JSON.stringify(
          await barukTools.getWalletTokenHoldings(session.wallet.address!)
        );
      },
    }),
    new DynamicTool({
      name: "get_token_info",
      description:
        "Get detailed information about a specific token by address or symbol",
      func: async (input: string) => {
        try {
          console.log("[get_token_info] Tool called with input:", input);
          const session = contextManager.getUserSession(userId);
          let holdings: TokenInfo[] = [];

          if (session.wallet.status === "connected") {
            holdings = await barukTools.getWalletTokenHoldings(
              session.wallet.address!
            );
          }

          const tokenAddress = await TokenResolver.resolveTokenIdentifier(
            input,
            holdings
          );
          return JSON.stringify(await barukTools.getTokenInfo(tokenAddress));
        } catch (error) {
          console.error("[get_token_info] Error:", error);
          return JSON.stringify({ error: "Failed to get token info" });
        }
      },
    }),
  ];
};

const SYSTEM_PROMPT = `You are Baruk, a DeFi assistant. Follow these rules:

1. For swap requests:
   - Always resolve token symbols to addresses
   - Use wallet holdings to determine available amounts
   - Calculate slippage based on user settings
   - Set reasonable defaults for missing parameters

2. When parameters are missing:
   - Check wallet holdings first
   - Ask for specific missing information
   - Never proceed without required parameters

3. Tool calling format:
Action: tool_name
Action Input: {"param1":"value","param2":"value"}

4. Swap parameters must include:
   - tokenIn (address or symbol)
   - tokenOut (address or symbol)
   - amountIn (number, "all", or "X%")
   - userId (always required)`;

async function initializeAgent(userId: string) {
  // Ensure wallet address is set if userId is a valid address
  const session = contextManager.getUserSession(userId);
  if (!session.wallet.address && /^0x[a-fA-F0-9]{40}$/.test(userId)) {
    session.wallet.address = userId;
  }

  const model = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    maxTokens: 1000,
  });

  // Dynamically expose all barukTools as tools
  const barukToolInstances = Object.entries(barukTools)
    .filter(([name, fn]) => typeof fn === "function")
    .map(
      ([name, fn]) =>
        new DynamicTool({
          name,
          description: `Call barukTools.${name} (auto-generated tool)`,
          func: async (input: string) => {
            try {
              console.log(`[barukTools.${name}] Tool called with input:`, input);
              let parsedInput;
              try {
                parsedInput = JSON.parse(input);
              } catch {
                parsedInput = input;
              }
              const argCount = fn.length;
              let args: any[] = [];
              if (Array.isArray(parsedInput)) {
                args = parsedInput;
              } else if (
                typeof parsedInput === "object" &&
                parsedInput !== null
              ) {
                args = Object.values(parsedInput);
              } else {
                args = [parsedInput];
              }
              // Pad args to match function arity
              while (args.length < argCount) {
                args.push(undefined);
              }
              return JSON.stringify(
                await (fn as any)(...args.slice(0, argCount))
              );
            } catch (error) {
              console.error(`[barukTools.${name}] Error:`, error);
              return JSON.stringify({
                error: `Failed to call barukTools.${name}`,
              });
            }
          },
        })
    );

  const tools = [
    createSwapTool(),
    ...createPortfolioTools(userId),
    ...barukToolInstances,
  ];
  const toolDescriptions = tools
    .map((tool) => `${tool.name}: ${tool.description}`)
    .join("\n");
  const toolStrings = tools.map((tool) => `${tool.name}: ${tool.description}`);
  const toolNames = tools.map(tool => tool.name).join(', ');

  const prompt = new PromptTemplate({
    template: `
    You are Baruk, a DeFi assistant. Follow these rules:

    1. Available Tools:
    {toolDescriptions}

    2. Always use this exact format:
    Question: the input question
    Thought: your reasoning
    Action: tool name (must be one of {toolNames})
    Action Input: JSON input for the tool
    Observation: tool response
    ... (repeat as needed)
    Thought: final reasoning
    Final Answer: final response to the user

    Begin!

    Question: {input}
    Thought:{agent_scratchpad}`,
    inputVariables: ["input", "agent_scratchpad", "tools", "toolDescriptions", "tool_names"],
    partialVariables: {
      toolDescriptions,
      toolNames,
    },
  });

  console.log("[Agent] Initializing agent for user:", userId);
  const agent = await createReactAgent({
    llm: model,
    tools,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools,
    maxIterations: 5,
    earlyStoppingMethod: "force", // Changed from "generate" to "force"
    handleParsingErrors: (error) => {
      console.error("[Agent] Parsing error:", error);
      return `Failed to parse input: ${error}. Please provide parameters in exact JSON format required by the tool.`;
    },
    callbacks: [
      {
        handleToolStart(tool, input) {
          console.log(`[Agent] Tool start: ${tool.name} with input:`, input);
        },
        handleToolEnd(output, tool) {
          console.log(`[Agent] Tool end: ${tool || "unknown"} output:`, output);
        },
        handleAgentAction(action) {
          console.log("[Agent] Agent action:", action);
        },
        handleAgentEnd(action) {
          console.log("[Agent] Agent end:", action);
        },
        handleChainStart(chain, inputs) {
          console.log("[Agent] Chain start:", chain, inputs);
        },
        handleChainEnd(outputs, chain) {
          console.log("[Agent] Chain end:", chain, outputs);
        },
        handleLLMStart(llm, prompts) {
          console.log("[Agent] LLM start:", llm, prompts);
        },
        handleLLMEnd(output, llm) {
          console.log("[Agent] LLM end:", llm, output);
        },
        handleLLMError(error, llm) {
          console.error("[Agent] LLM error:", error, llm);
        },
        handleToolError(error, tool) {
          console.error(`[Agent] Tool error in ${tool || "unknown"}:", error`);
        },
      },
    ],
  });
}

export async function POST(request: NextRequest) {
  console.log('first request:::', request);
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const agent = await initializeAgent(userId);
    const response = await agent.invoke({
      input: message,
      userId,
    });

    return NextResponse.json({
      text: response.output || response.text,
      data: {
        userId,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "operational",
    version: "2.1",
    timestamp: Date.now(),
  });
}
