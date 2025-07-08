import { getContract, createWalletClient, custom, type WalletClient } from 'viem';
import { client } from './web3';
import { useUnifiedWallet } from './unifiedWallet';
import { SigningStargateClient } from '@cosmjs/stargate';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';

// Unified contract interaction utility
export function useContractInteraction() {
  const { type, chain, signer, signAndSend } = useUnifiedWallet();

  const executeEVMContract = async (contractAddress: string, abi: any, method: string, args: any[], options?: any) => {
    if (chain !== 'evm' || !signer) throw new Error('EVM wallet not connected');
    
    // For external wallets, use window.ethereum
    if (type === 'evm-external' && window.ethereum) {
      const walletClient = createWalletClient({
        transport: custom(window.ethereum)
      });
      
      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: abi as any,
        client: walletClient
      });

      return await contract.write[method](args, options);
    } else {
      // For internal wallets, use the signer directly with ethers
      // Since viem doesn't work well with ethers signers, we'll use ethers directly
      const { ethers } = await import('ethers');
      const contract = new ethers.Contract(contractAddress, abi, signer);
      return await contract[method](...args, options);
    }
  };

  const executeCosmosContract = async (contractAddress: string, msg: any, options?: any) => {
    if (chain !== 'cosmos' || !signer) throw new Error('Cosmos wallet not connected');
    
    const executeMsg = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        sender: options?.sender || '',
        contract: contractAddress,
        msg: Buffer.from(JSON.stringify(msg)),
        funds: options?.funds || []
      })
    };

    const client = await SigningStargateClient.connectWithSigner(
      options?.rpc || 'https://rpc.atlantic-2.seinetwork.io',
      signer
    );

    return await client.signAndBroadcast(
      options?.sender || '',
      [executeMsg],
      options?.fee || { amount: [{ denom: 'usei', amount: '1000' }], gas: '200000' },
      options?.memo || ''
    );
  };

  const executeContract = async (protocol: 'baruk' | 'astroport' | 'vortex', contractType: string, method: string, args: any[], options?: any) => {
    if (protocol === 'baruk') {
      // Baruk uses EVM
      const { getSeiProtocolById } = await import('./seiProtocols');
      const protocolConfig = getSeiProtocolById('baruk');
      const contract = protocolConfig?.contracts[contractType];
      
      if (!contract) throw new Error(`Contract ${contractType} not found for Baruk`);
      
      return await executeEVMContract(contract.address, contract.abi, method, args, options);
    } else {
      // Astroport/Vortex use Cosmos
      const { getSeiProtocolById } = await import('./seiProtocols');
      const protocolConfig = getSeiProtocolById(protocol);
      const contract = protocolConfig?.contracts[contractType];
      
      if (!contract) throw new Error(`Contract ${contractType} not found for ${protocol}`);
      
      return await executeCosmosContract(contract.address, { [method]: args }, options);
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
