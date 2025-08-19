'use client';

import React, { useState, useEffect } from 'react';
import { PrivyTradingService, TradingStrategy, AITradingSession } from '../lib/privyTrading';
import { usePrivyAuth } from '../hooks/usePrivyAuth';
import { motion } from 'framer-motion';

export default function AITradingDashboard() {
  const { isAuthenticated, user, userAddress } = usePrivyAuth();
  const [tradingService] = useState(() => new PrivyTradingService());
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [activeSessions, setActiveSessions] = useState<AITradingSession[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [initialCapital, setInitialCapital] = useState<string>('1000');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStrategies();
    loadActiveSessions();
    
    // Refresh sessions every 10 seconds
    const interval = setInterval(loadActiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStrategies = () => {
    const availableStrategies = tradingService.getTradingStrategies();
    setStrategies(availableStrategies);
    if (availableStrategies.length > 0) {
      setSelectedStrategy(availableStrategies[0].id);
    }
  };

  const loadActiveSessions = () => {
    const sessions = tradingService.getActiveSessions();
    setActiveSessions(sessions);
  };

  const startTradingSession = async () => {
    if (!selectedStrategy || !initialCapital || !user?.id) return;
    
    setIsLoading(true);
    try {
      const address = await userAddress();
      if (!address) {
        throw new Error('Failed to get user wallet address');
      }

      const sessionId = await tradingService.startTradingSession(
        user.id,
        address,
        selectedStrategy,
        initialCapital
      );
      
      console.log(`Trading session started: ${sessionId}`);
      loadActiveSessions();
      
      // Reset form
      setInitialCapital('1000');
    } catch (error) {
      console.error('Failed to start trading session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopTradingSession = async (sessionId: string) => {
    try {
      await tradingService.stopTradingSession(sessionId);
      loadActiveSessions();
    } catch (error) {
      console.error('Failed to stop trading session:', error);
    }
  };

  const pauseTradingSession = async (sessionId: string) => {
    try {
      await tradingService.pauseTradingSession(sessionId);
      loadActiveSessions();
    } catch (error) {
      console.error('Failed to pause trading session:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'stopped': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Trading Dashboard</h1>
          <p className="text-gray-600 mb-8">Sign in to start autonomous trading</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Trading Dashboard</h1>
        <p className="text-gray-600">Automate your trading with AI-powered strategies</p>
        {user && (
          <p className="text-sm text-gray-500 mt-2">
            Welcome, {user.email || user.wallet} | Wallet: {user.wallet?.slice(0, 6)}...{user.wallet?.slice(-4)}
          </p>
        )}
      </div>

      {/* Start New Trading Session */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Start New Trading Session</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trading Strategy
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {strategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name} ({strategy.riskLevel} risk)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Capital (USDC)
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1000"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={startTradingSession}
              disabled={isLoading || !selectedStrategy}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Start Trading Session'}
            </button>
          </div>
        </div>

        {selectedStrategy && (
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="font-medium text-gray-900 mb-2">Strategy Details</h3>
            {strategies.find(s => s.id === selectedStrategy) && (
              <div className="text-sm text-gray-600">
                <p>{strategies.find(s => s.id === selectedStrategy)?.description}</p>
                <div className="mt-2 flex gap-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(strategies.find(s => s.id === selectedStrategy)?.riskLevel || 'medium')}`}>
                    {strategies.find(s => s.id === selectedStrategy)?.riskLevel} Risk
                  </span>
                  <span className="text-gray-600">
                    Max Slippage: {strategies.find(s => s.id === selectedStrategy)?.maxSlippage}%
                  </span>
                  <span className="text-gray-600">
                    Min Profit: {strategies.find(s => s.id === selectedStrategy)?.minProfitThreshold}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Active Trading Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Trading Sessions</h2>
        
        {activeSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No active trading sessions</p>
            <p className="text-sm">Start a new session to begin autonomous trading</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strategy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Trades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Trade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.strategy.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.strategy.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.totalTrades}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${session.totalVolume.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.lastTradeTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {session.status === 'active' && (
                          <button
                            onClick={() => pauseTradingSession(session.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Pause
                          </button>
                        )}
                        {session.status === 'paused' && (
                          <button
                            onClick={() => startTradingSession()}
                            className="text-green-600 hover:text-green-900"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => stopTradingSession(session.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Stop
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
