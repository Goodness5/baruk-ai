import { ethers } from 'ethers';
import { IBundler, Bundler } from '@biconomy/bundler';
import { BiconomyPaymaster } from '@biconomy/paymaster';
import { BiconomyAccount } from '@biconomy/account';
import { DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account';
import { ChainId } from '@biconomy/core-types';
import { ParticleNetwork } from '@particle-network/react';
import { ParticleProvider } from '@particle-network/provider';

export interface AATradingConfig {
  bundlerUrl: string;
  paymasterUrl: string;
  entryPointAddress: string;
  chainId: ChainId;
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface AATradeRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  userAddress: string;
  deadline: number;
  slippageTolerance: number;
}

export class AccountAbstractionManager {
  private bundler: IBundler;
  private paymaster: BiconomyPaymaster;
  private account: BiconomyAccount | null = null;
  private config: AATradingConfig;

  constructor(config: AATradingConfig) {
    this.config = config;
    this.bundler = new Bundler({
      bundlerUrl: config.bundlerUrl,
      entryPointAddress: config.entryPointAddress,
      chainId: config.chainId,
    });

    this.paymaster = new BiconomyPaymaster({
      paymasterUrl: config.paymasterUrl,
    });
  }

  async initializeAccount(userAddress: string, privateKey?: string): Promise<void> {
    try {
      if (privateKey) {
        // For development/testing - in production, use secure key management
        const provider = new ethers.JsonRpcProvider(process.env.SEI_RPC_URL);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        this.account = new BiconomyAccount({
          signer: wallet,
          chainId: this.config.chainId,
          bundler: this.bundler,
          paymaster: this.paymaster,
          entryPointAddress: this.config.entryPointAddress,
        });
      } else {
        // For production - integrate with Particle Network or other auth providers
        throw new Error('Secure key management required for production');
      }
    } catch (error) {
      throw new Error(`Failed to initialize AA account: ${error}`);
    }
  }

  async executeAutonomousTrade(tradeRequest: AATradeRequest): Promise<string> {
    if (!this.account) {
      throw new Error('Account not initialized');
    }

    try {
      // Create the transaction data for the swap
      const swapData = this.createSwapTransactionData(tradeRequest);
      
      // Build the user operation
      const userOp = await this.buildUserOperation(swapData);
      
      // Send the user operation
      const userOpResponse = await this.bundler.sendUserOp(userOp);
      
      // Wait for the transaction to be mined
      const transactionDetails = await userOpResponse.wait();
      
      return transactionDetails.receipt.transactionHash;
    } catch (error) {
      throw new Error(`Failed to execute autonomous trade: ${error}`);
    }
  }

  private createSwapTransactionData(tradeRequest: AATradeRequest): string {
    // This would contain the encoded function call to your swap contract
    // You'll need to implement this based on your specific contract ABI
    const routerInterface = new ethers.Interface([
      'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint256 deadline, address to)'
    ]);

    return routerInterface.encodeFunctionData('swap', [
      tradeRequest.tokenIn,
      tradeRequest.tokenOut,
      tradeRequest.amountIn,
      tradeRequest.minAmountOut,
      tradeRequest.deadline,
      tradeRequest.userAddress
    ]);
  }

  private async buildUserOperation(swapData: string) {
    if (!this.account) {
      throw new Error('Account not initialized');
    }

    const userOp = await this.account.buildUserOp([{
      to: process.env.BARUK_ROUTER_ADDRESS || '', // Your router contract address
      data: swapData,
      value: '0x0',
    }]);

    // Set gas parameters
    userOp.maxFeePerGas = this.config.maxFeePerGas;
    userOp.maxPriorityFeePerGas = this.config.maxPriorityFeePerGas;
    userOp.callGasLimit = this.config.gasLimit;
    userOp.verificationGasLimit = this.config.gasLimit;
    userOp.preVerificationGas = this.config.gasLimit;

    return userOp;
  }

  async estimateGas(tradeRequest: AATradeRequest): Promise<string> {
    if (!this.account) {
      throw new Error('Account not initialized');
    }

    try {
      const swapData = this.createSwapTransactionData(tradeRequest);
      const userOp = await this.buildUserOperation(swapData);
      
      // Estimate gas using the bundler
      const gasEstimate = await this.bundler.estimateUserOpGas(userOp);
      
      return gasEstimate.callGasLimit;
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${error}`);
    }
  }

  async getAccountAddress(): Promise<string> {
    if (!this.account) {
      throw new Error('Account not initialized');
    }
    return await this.account.getAccountAddress();
  }
}

// Default configuration for Sei Network
export const defaultAAConfig: AATradingConfig = {
  bundlerUrl: process.env.BICONOMY_BUNDLER_URL || 'https://bundler.biconomy.io/api/v2/1328/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44',
  paymasterUrl: process.env.BICONOMY_PAYMASTER_URL || 'https://paymaster.biconomy.io/api/v1/1328/TT8NgHYiA.fce62d8f-9b10-4eff-95aa-fc6e5dac4bc8',
  entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  chainId: ChainId.SEI_DEVNET, // Adjust based on your network
  gasLimit: '500000',
  maxFeePerGas: '20000000000', // 20 gwei
  maxPriorityFeePerGas: '2000000000', // 2 gwei
};
