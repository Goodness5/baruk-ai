"use client";

import { timeStamp } from 'console';
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type AIMessage = {
  role: 'user' | 'ai';
  content: string;
  action?: string;
  data?: unknown;
  timestamp: number;
  context?: {
    marketState?: 'bull' | 'bear' | 'neutral';
    riskProfile?: 'conservative' | 'moderate' | 'aggressive';
    relevantMetrics?: {
      [key: string]: number;
    };
    suggestedActions?: Array<{
      type: string;
      description: string;
      priority: number;
    }>;
  };
};

interface AIState {
  chat: AIMessage[];
  input: string;
  pendingAction?: { action: string; data?: unknown };
  marketContext?: {
    lastUpdate: number;
    prices: Record<string, number>;
    trends: Record<string, 'up' | 'down' | 'stable'>;
    opportunities: Array<{
      type: string;
      description: string;
      score: number;
    }>;
  };
  userContext?: {
    riskProfile: {
      score: number;
      category: 'conservative' | 'moderate' | 'aggressive';
    };
    portfolio: {
      totalValue: number;
      changes24h: number;
      topPositions: Array<{
        type: string;
        value: number;
        change: number;
      }>;
    };
  };
}

const initialState: AIState = {
  chat: [
    
    {
      role: 'ai',
      content: 'I can assist with DeFi strategies, Sei blockchain insights, and personalized portfolio management.',
      timestamp: Date.now(),
    },
  ],
  input: '',
  pendingAction: undefined,
};

type AIAction =
  | { type: 'SEND_MESSAGE'; message: AIMessage }
  | { type: 'SET_INPUT'; input: string }
  | { type: 'TRIGGER_ACTION'; action: string; data?: unknown }
  | { type: 'CLEAR_ACTION' };

function aiReducer(state: AIState, action: AIAction): AIState {
  switch (action.type) {
    case 'SEND_MESSAGE':
      return { ...state, chat: [...state.chat, action.message], input: '' };
    case 'SET_INPUT':
      return { ...state, input: action.input };
    case 'TRIGGER_ACTION':
      return { ...state, pendingAction: { action: action.action, data: action.data } };
    case 'CLEAR_ACTION':
      return { ...state, pendingAction: undefined };
    default:
      return state;
  }
}

const AIContext = createContext<{
  state: AIState;
  dispatch: React.Dispatch<AIAction>;
}>({ state: initialState, dispatch: () => {} });

export function useAI() {
  return useContext(AIContext);
}

export function AIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  return (
    <AIContext.Provider value={{ state, dispatch }}>
      {children}
    </AIContext.Provider>
  );
}