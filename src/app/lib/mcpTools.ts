/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from 'ethers';
import type { 
  WalletBalance, 
  TokenBalance, 
  TokenInfo, 
  NFTInfo, 
  TransactionInfo, 
  BlockInfo, 
  ChainInfo, 
  FlowAnalysis 
} from './types';

// Import actual ABIs from abi/ directory
import BarukLendingABI from '../../abi/BarukLending.json'; // BarukLending
import BarukLimitOrderABI from '../../abi/BarukLimitOrder.json'; // BarukLimitOrder
import BarukYieldFarmABI from '../../abi/BarukYieldFarm.json'; // BarukYieldFarm
import BarukRouterABI from '../../abi/BarukRouter.json'; // BarukRouter
import BarukAMMFactoryABI from '../../abi/BarukAMMFactory.json'; // BarukAMMFactory
import BarukAMMABI from '../../abi/BarukAMM.json'; // BarukAMM

// Initialize provider for Sei network
const SEI_RPC_URL = process.env.SEI_RPC_URL || 'https://evm-rpc-testnet.sei-apis.com';
const provider = new ethers.JsonRpcProvider(SEI_RPC_URL);

// ERC20 ABI for token operations
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
];

// ERC721 ABI for NFT operations
const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

export async function getBalance(address: string): Promise<WalletBalance> {
  try {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    const balance = await provider.getBalance(address);
    const formatted = ethers.formatEther(balance);

    return {
      address,
      balance: balance.toString(),
      formatted: `${formatted} SEI`,
    };
  } catch (error) {
    console.error('Error getting balance:', error);
    throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTokenBalance(tokenAddress: string, walletAddress: string): Promise<TokenBalance> {
  try {
    if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(walletAddress)) {
      throw new Error('Invalid token or wallet address');
    }

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [balance, decimals, symbol, name] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals(),
      contract.symbol(),
      contract.name(),
    ]);

    return {
      tokenAddress,
      walletAddress,
      balance: balance.toString(),
      decimals: Number(decimals),
      symbol,
      name,
    };
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw new Error(`Failed to get token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
  try {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString(),
    };
  } catch (error) {
    console.error('Error getting token info:', error);
    throw new Error(`Failed to get token info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getNftInfo(nftAddress: string, tokenId: string): Promise<NFTInfo> {
  try {
    if (!ethers.isAddress(nftAddress)) {
      throw new Error('Invalid NFT address');
    }

    const contract = new ethers.Contract(nftAddress, ERC721_ABI, provider);
    
    const [owner, tokenURI] = await Promise.all([
      contract.ownerOf(tokenId),
      contract.tokenURI(tokenId),
    ]);

    // Fetch metadata from tokenURI
    let metadata: Record<string, any> = {};
    let name = '';
    let description = '';
    let image = '';

    try {
      const response = await fetch(tokenURI);
      if (response.ok) {
        metadata = await response.json();
        name = metadata.name || `Token #${tokenId}`;
        description = metadata.description || '';
        image = metadata.image || '';
      }
    } catch (metadataError) {
      console.warn('Failed to fetch NFT metadata:', metadataError);
    }

    return {
      address: nftAddress,
      tokenId,
      name,
      description,
      image,
      owner,
      metadata,
    };
  } catch (error) {
    console.error('Error getting NFT info:', error);
    throw new Error(`Failed to get NFT info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function checkNftOwnership(nftAddress: string, tokenId: string, owner: string): Promise<{ isOwner: boolean; actualOwner: string }> {
  try {
    if (!ethers.isAddress(nftAddress) || !ethers.isAddress(owner)) {
      throw new Error('Invalid NFT or owner address');
    }

    const contract = new ethers.Contract(nftAddress, ERC721_ABI, provider);
    const actualOwner = await contract.ownerOf(tokenId);
    
    return {
      isOwner: actualOwner.toLowerCase() === owner.toLowerCase(),
      actualOwner,
    };
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    throw new Error(`Failed to check NFT ownership: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getChainInfo(): Promise<ChainInfo> {
  try {
    const [network, blockNumber, feeData] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
      provider.getFeeData(),
    ]);

    return {
      chainId: Number(network.chainId),
      name: typeof network.name === 'string' && network.name ? network.name : 'Sei Network',
      blockNumber,
      gasPrice: feeData.gasPrice?.toString() || '0',
      nativeCurrency: {
        name: 'Sei',
        symbol: 'SEI',
        decimals: 18,
      },
    };
  } catch (error) {
    console.error('Error getting chain info:', error);
    throw new Error(`Failed to get chain info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getBlock(blockNumber: number): Promise<BlockInfo> {
  try {
    const block = await provider.getBlock(blockNumber, false);
    
    if (!block) {
      throw new Error(`Block ${blockNumber} not found`);
    }

    return {
      number: block.number,
      hash: block.hash || '',
      timestamp: block.timestamp,
      transactions: [...block.transactions],
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
    };
  } catch (error) {
    console.error('Error getting block:', error);
    throw new Error(`Failed to get block: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTransaction(txHash: string): Promise<TransactionInfo> {
  try {
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
    ]);

    if (!tx || !receipt) {
      throw new Error(`Transaction ${txHash} not found`);
    }

    const block = await provider.getBlock(receipt.blockNumber);

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? '',
      value: tx.value.toString(),
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber,
      timestamp: block?.timestamp || 0,
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw new Error(`Failed to get transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAddressFromPrivateKey(privateKey: string): Promise<{ address: string; publicKey: string }> {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return {
      address: wallet.address,
      publicKey: wallet.address, // Using address as fallback since publicKey doesn't exist
    };
  } catch (error) {
    console.error('Error getting address from private key:', error);
    throw new Error(`Invalid private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function watchWalletFlows(address: string, fromBlock: number = 0): Promise<FlowAnalysis> {
  try {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    const currentBlock = await provider.getBlockNumber();
    const startBlock = Math.max(fromBlock, currentBlock - 1000); // Limit to last 1000 blocks for performance

    // Get all transactions involving this address
    const filter = {
      fromBlock: startBlock,
      toBlock: currentBlock,
    };

    // This is a simplified implementation - in production, you'd want to use event logs
    // and potentially index transactions for better performance
    const inflows: Array<{
      from: string;
      amount: string;
      timestamp: number;
      txHash: string;
    }> = [];
    const outflows: Array<{
      to: string;
      amount: string;
      timestamp: number;
      txHash: string;
    }> = [];

    // Note: This is a placeholder implementation
    // In a real scenario, you'd need to iterate through blocks and check transactions
    // or use a more sophisticated indexing solution

    return {
      address,
      inflows,
      outflows,
      totalInflow: '0',
      totalOutflow: '0',
      netFlow: '0',
    };
  } catch (error) {
    console.error('Error analyzing wallet flows:', error);
    throw new Error(`Failed to analyze wallet flows: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeMemeCoinFlows(tokenAddress: string): Promise<FlowAnalysis & { tokenInfo: TokenInfo }> {
  try {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }

    const tokenInfo = await getTokenInfo(tokenAddress);
    
    // This would involve analyzing token transfer events
    // For now, returning a placeholder structure
    return {
      address: tokenAddress,
      inflows: [],
      outflows: [],
      totalInflow: '0',
      totalOutflow: '0',
      netFlow: '0',
      tokenInfo,
    };
  } catch (error) {
    console.error('Error analyzing meme coin flows:', error);
    throw new Error(`Failed to analyze meme coin flows: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

 