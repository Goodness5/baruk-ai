/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useAppStore } from '../store/useAppStore';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { SEI_PROTOCOLS, getSeiProtocolById, SeiProtocol } from '../lib/seiProtocols';
import { useBarukYieldFarm } from '../lib/hooks';
import { usePrivy } from '@privy-io/react-auth';
import { formatUnits } from 'viem';

// Pool configuration - in real app this would come from API/config
const POOL_CONFIGS = [
  {
    id: 0,
    name: 'ETH/USDC',
    tokens: ['0x8923889697C9467548ABe8E815105993EBC785b6', '0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7'],
  },
  {
    id: 1,
    name: 'ETH/DAI',
    tokens: ['0x8923889697C9467548ABe8E815105993EBC785b6', '0xD6383ef8A67E929274cE9ca05b694f782A5070D7'],
  },
  {
    id: 2,
    name: 'USDC/DAI',
    tokens: ['0xF2C653e2a1F21ef409d0489c7c1d754d9f2905F7', '0xD6383ef8A67E929274cE9ca05b694f782A5070D7'],
  },
];

const DEFAULT_PROTOCOL_ID = 'baruk';

// Individual Pool Component
function PoolCard({ poolConfig, userAddress }: { 
  poolConfig: typeof POOL_CONFIGS[0], 
  userAddress?: `0x${string}` 
}) {
  const tokens = useAppStore(s => s.tokens);
  const tokenPrices = useAppStore(s => s.tokenPrices);
  const tokenPricesLoading = useAppStore(s => s.tokenPricesLoading);
  const tokenPricesError = useAppStore(s => s.tokenPricesError);
  
  const {
    userInfo,
    pendingReward,
    poolInfo,
    stakeTokens,
    unstakeTokens,
    harvestRewards,
    isStakePending,
    isUnstakePending,
    isClaimPending,
    stakeError,
    unstakeError,
    claimError,
    isUserInfoLoading,
    isPendingRewardLoading
  } = useBarukYieldFarm(userAddress, poolConfig.id);

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);

  const getSymbol = (address: string) => 
    tokens.find(t => t.address.toLowerCase() === address.toLowerCase())?.symbol || address.slice(0, 6);
  
  const getPrice = (address: string) => tokenPrices[address.toLowerCase()];

  const handleStake = async () => {
    if (!stakeAmount || !userAddress) return;
    
    try {
      await stakeTokens({
        poolId: poolConfig.id,
        amount: stakeAmount,
        decimals: 18
      });
      setStakeAmount('');
      setShowStakeModal(false);
    } catch (error) {
      console.error('Stake failed:', error);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || !userAddress) return;
    
    try {
      await unstakeTokens({
        poolId: poolConfig.id,
        amount: unstakeAmount,
        decimals: 18
      });
      setUnstakeAmount('');
    } catch (error) {
      console.error('Unstake failed:', error);
    }
  };

  const handleHarvest = async () => {
    if (!userAddress) return;
    
    try {
      await harvestRewards({ poolId: poolConfig.id });
    } catch (error) {
      console.error('Harvest failed:', error);
    }
  };

  // Format values for display
  const stakedAmount = userInfo?.amount ? formatUnits(userInfo.amount, 18) : '0';
  const pendingRewards = pendingReward ? formatUnits(pendingReward, 18) : '0';
  const totalStaked = poolInfo?.totalStaked ? formatUnits(poolInfo.totalStaked, 18) : '0';

  return (
    <div className="rounded-2xl p-6 hud-glass neon-border">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold neon-text">{poolConfig.name}</div>
        <div className="text-xs text-white/60">Pool #{poolConfig.id}</div>
      </div>
      
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex gap-2 text-xs neon-text">
          {poolConfig.tokens.map(addr => (
            <span key={addr} className="flex-1">
              {getSymbol(addr)}: {tokenPricesLoading ? 'Loading...' : 
                tokenPricesError ? <span className="text-red-400">{tokenPricesError}</span> : 
                getPrice(addr) ? `$${getPrice(addr).toFixed(4)}` : 'No price'}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between neon-text">
          <span>Your Stake</span>
          <span className="text-white font-bold">
            {isUserInfoLoading ? 'Loading...' : `${parseFloat(stakedAmount).toFixed(4)} LP`}
          </span>
        </div>
        
        <div className="flex justify-between neon-text">
          <span>Magic Rewards</span>
          <span className="text-white font-bold">
            {isPendingRewardLoading ? 'Loading...' : `${parseFloat(pendingRewards).toFixed(4)} BAR`}
          </span>
        </div>
        
        <div className="flex justify-between neon-text text-xs">
          <span>Total Pool TVL</span>
          <span className="text-white/80">{parseFloat(totalStaked).toFixed(2)} LP</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-2">
        {!showStakeModal ? (
          <button 
            onClick={() => setShowStakeModal(true)}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple neon-text font-bold shadow-lg hover:opacity-90 transition"
          >
            Stake / Unstake
          </button>
        ) : (
          <div className="space-y-3">
            {/* Stake Section */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Stake amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/40 border border-neon-cyan text-white rounded-lg text-sm focus:outline-none"
                />
                <button
                  onClick={handleStake}
                  disabled={isStakePending || !stakeAmount}
                  className="px-4 py-2 bg-neon-green text-black rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  {isStakePending ? 'Staking...' : 'Stake'}
                </button>
              </div>
              {stakeError && (
                <p className="text-red-400 text-xs">{stakeError.message}</p>
              )}
            </div>

            {/* Unstake Section */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Unstake amount"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/40 border border-neon-cyan text-white rounded-lg text-sm focus:outline-none"
                />
                <button
                  onClick={handleUnstake}
                  disabled={isUnstakePending || !unstakeAmount}
                  className="px-4 py-2 bg-neon-purple text-white rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  {isUnstakePending ? 'Unstaking...' : 'Unstake'}
                </button>
              </div>
              {unstakeError && (
                <p className="text-red-400 text-xs">{unstakeError.message}</p>
              )}
            </div>

            {/* Harvest and Close */}
            <div className="flex gap-2">
              <button
                onClick={handleHarvest}
                disabled={isClaimPending || parseFloat(pendingRewards) === 0}
                className="flex-1 py-2 bg-gradient-to-r from-neon-cyan to-neon-green text-black rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {isClaimPending ? 'Harvesting...' : 'Harvest'}
              </button>
              <button
                onClick={() => setShowStakeModal(false)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-bold text-sm hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
            {claimError && (
              <p className="text-red-400 text-xs">{claimError.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PoolsPage() {
  const { authenticated, user } = usePrivy();
  const [protocolId, setProtocolId] = useState<string>(DEFAULT_PROTOCOL_ID);
  const protocol = getSeiProtocolById(protocolId) as SeiProtocol;
  
  // Get user's wallet address from Privy
  let address: string | null = null;
  
  if (user?.wallet?.address) {
    // Handle case where address might be an object
    if (typeof user.wallet.address === 'string') {
      address = user.wallet.address;
    } else if (typeof user.wallet.address === 'object' && user.wallet.address !== null) {
      // If it's an object, try to extract the address string
      address = (user.wallet.address as any).address || null;
    }
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto mt-10 space-y-8"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* AI Agent Tip */}
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="h-7 w-7 neon-text animate-pulse" />
        <div className="text-lg neon-text font-bold">AI Tip:</div>
        <div className="text-white/80 text-sm">
          Stake your tokens in a pool to earn magic rewards! I&apos;ll help you find the best pools and keep track of your garden.
        </div>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold neon-text">Pools</h1>
        <div className="ml-auto">
          <select
            className="bg-black/40 border border-neon-cyan text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
            value={protocolId}
            onChange={e => setProtocolId(e.target.value)}
          >
            {SEI_PROTOCOLS.filter(p => p.services.includes('farm')).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="neon-text text-sm mb-2">
        Selected Magic Engine: <span className="font-bold">{protocol?.name}</span>
      </div>

      {!authenticated && (
        <div className="text-center py-8 text-white/60">
          Please sign in with Privy to view and interact with pools.
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        {POOL_CONFIGS.map((poolConfig) => (
          <PoolCard 
            key={poolConfig.id} 
            poolConfig={poolConfig} 
            userAddress={address as `0x${string}` || undefined} 
          />
        ))}
      </div>
    </motion.div>
  );
}