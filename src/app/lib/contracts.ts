import { getContract } from 'viem';
import { client } from './web3';

import abi from '../../abi/BarukRouter.json';

export const router = getContract({
  address: '0xROUTER', // TODO: Replace with actual deployed router address
  abi: abi as any,
  client
});
