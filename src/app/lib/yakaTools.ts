import { parseUnits } from 'viem';
import { YakaContractHook } from './useYakaContract';

export async function callYakaSwap({
  from,
  to,
  amount,
  address,
  callContract,
  callTokenContract,
}: {
  from: string;
  to: string;
  amount: string;
  address: string;
  callContract: YakaContractHook["callContract"];
  callTokenContract: YakaContractHook["callTokenContract"];
}) {
  try {
    const amountInWei = parseUnits(amount, 18);
    const minOutWei = parseUnits((parseFloat(amount) * 0.99).toFixed(18), 18);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

    const YAKARouterAddress = '0xd45dAff288075952822d5323F1d571e73435E929';

    // Approve Yaka Router
    await callTokenContract(from, 'approve', [YAKARouterAddress, amountInWei]);

    // Swap
    await callContract(
      'swapExactTokensForTokens',
      [amountInWei, minOutWei, [from, to], address, deadline],
      { account: address as `0x${string}` }
    );

    return true;
  } catch (err) {
    console.error('Yaka swap failed:', err);
    throw err;
  }
}
