import { getContract, createWalletClient, custom, Abi } from 'viem';
import { useUnifiedWallet } from './unifiedWallet';
import { SigningStargateClient } from '@cosmjs/stargate';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';

// Unified contract interaction utility
export function useContractInteraction() {
  const { type, chain, signer } = useUnifiedWallet();

  const executeEVMContract = async (contractAddress: string, abi: Abi, method: string, args: unknown[], options?: Record<string, unknown>) => {
    if (chain !== 'evm' || !signer) throw new Error('EVM wallet not connected');
    
    // For external wallets, use window.ethereum
    if (type === 'evm-external' && window.ethereum) {
      const walletClient = createWalletClient({
        transport: custom(window.ethereum as unknown)
      });
      
      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: abi,
        client: walletClient
      });

      return await (contract.write[method] as (...args: unknown[]) => Promise<unknown>)(...args, options);
    } else {
      // For internal wallets, use the signer directly with ethers
      // Since viem doesn't work well with ethers signers, we'll use ethers directly
      const { ethers } = await import('ethers');
      const contract = new ethers.Contract(contractAddress, abi as unknown, signer as { [key: string]: unknown });
      return await contract[method](...args, options);
    }
  };

  const executeCosmosContract = async (contractAddress: string, msg: Record<string, unknown>, options?: Record<string, unknown>) => {
    if (chain !== 'cosmos' || !signer) throw new Error('Cosmos wallet not connected');
    
    const executeMsg = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        sender: (options?.sender as string) || '',
        contract: contractAddress,
        msg: Buffer.from(JSON.stringify(msg)),
        funds: (options?.funds as { denom: string; amount: string }[]) || []
      })
    };

    const client = await SigningStargateClient.connectWithSigner(
      (options?.rpc as string) || 'https://rpc.atlantic-2.seinetwork.io',
      signer as unknown
    );

    return await client.signAndBroadcast(
      (options?.sender as string) || '',
      [executeMsg],
      (options?.fee as { amount: { denom: string; amount: string }[]; gas: string }) || { amount: [{ denom: 'usei', amount: '1000' }], gas: '200000' },
      (options?.memo as string) || ''
    );
  };

  const executeContract = async (protocol: 'baruk' | 'astroport' | 'vortex', contractType: string, method: string, args: unknown[], options?: Record<string, unknown>) => {
    if (protocol === 'baruk') {
      // Baruk uses EVM
      const { getSeiProtocolById } = await import('./seiProtocols');
      const protocolConfig = getSeiProtocolById('baruk');
      const contract = protocolConfig?.contracts[contractType];
      
      if (!contract) throw new Error(`Contract ${contractType} not found for Baruk`);
      
      return await executeEVMContract((contract as { address: string }).address, (contract as { abi: Abi }).abi, method, args, options);
    } else {
      // Astroport/Vortex use Cosmos
      const { getSeiProtocolById } = await import('./seiProtocols');
      const protocolConfig = getSeiProtocolById(protocol);
      const contract = protocolConfig?.contracts[contractType];
      
      if (!contract) throw new Error(`Contract ${contractType} not found for ${protocol}`);
      
      return await executeCosmosContract((contract as { address: string }).address, { [method]: args }, options);
    }
  };

  return {
    executeContract,
    executeEVMContract,
    executeCosmosContract,
    chain,
    type,
    isConnected: !!signer
  };
}
