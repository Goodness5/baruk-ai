import BarukAMMFactoryABI from '../../abi/BarukAMMFactory.json';
import BarukAMMABI from '../../abi/BarukAMM.json';
import BarukLendingABI from '../../abi/BarukLending.json';
import BarukLimitOrderABI from '../../abi/BarukLimitOrder.json';
import BarukRouterABI from '../../abi/BarukRouter.json';
import BarukYieldFarmABI from '../../abi/BarukYieldFarm.json';
import ERC20ABI from '../../abi/ERC20.json';

// Contract addresses from BARUK_CONTRACTS
export const contractAddresses = {
  ammFactory: '0xCEeC70dF7bC3aEB57F078A1b1BeEa2c6320d8957',
  amm: '0x7FE1358Fd97946fCC8f07eb18331aC8Bfe37b7B1',
  router: '0xe605be74ba68fc255dB0156ab63c31b50b336D6B',
  lending: '0x5197d95B4336f1EF6dd0fd62180101021A88E27b',
  limitOrder: '0x3bDdc3fAbf58fDaA6fF62c95b944819cF625c0F4',
  yieldFarm: '0x1Ae8eC370795FCF21862Ba486fb44a5219Dea7Ce',
  erc20: '0x0000000000000000000000000000000000000000', 
} as const;

export const contractABIs = {
  ammFactory: BarukAMMFactoryABI,
  amm: BarukAMMABI,
  lending: BarukLendingABI,
  limitOrder: BarukLimitOrderABI,
  router: BarukRouterABI,
  yieldFarm: BarukYieldFarmABI,
  erc20: ERC20ABI,
} as const;

export type ContractNames = keyof typeof contractAddresses;
