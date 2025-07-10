"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type AIMessage = {
  role: 'user' | 'ai';
  content: string;
  action?: string;
  data?: unknown;
};

interface AIState {
  chat: AIMessage[];
  input: string;
  pendingAction?: { action: string; data?: unknown };
}

const initialState: AIState = {
  chat: [
    { role: 'ai', content: "Hi! I'm your AI Agent. Ask me anything or let me help you with DeFi magic!" }
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