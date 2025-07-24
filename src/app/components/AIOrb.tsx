"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useAI } from "./AIContext";
import { useAccount } from "wagmi";
// Utility to strip inline styles from agent HTML
function stripAgentStyles(html: string) {
  // Remove all style="..." attributes
  return html.replace(/ style="[^"]*"/g, "");
}

const quickActions = [
  { label: "Go to Trade", action: "navigate", data: { page: "/swap" } },
  { label: "Go to Grow", action: "navigate", data: { page: "/liquidity" } },
  { label: "Go to Borrow", action: "navigate", data: { page: "/lending" } },
  { label: "Go to Triggers", action: "navigate", data: { page: "/limit-orders" } },
  { label: "Go to Insights", action: "navigate", data: { page: "/analytics" } },
  { label: "Go to Pools", action: "navigate", data: { page: "/pools" } },
];

export default function AIOrb() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { state, dispatch } = useAI();
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chat, open]);

  const handleSend = async () => {
    if (!state.input.trim()) return;
    dispatch({ type: "SEND_MESSAGE", message: { role: "user", content: state.input, timestamp: Date.now() } });
    setLoading(true);
    try {
      const res = await fetch('/api/baruk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: state.input, 
          userId: address || 'anonymous',
          walletAddress: address,
          sessionId: Date.now().toString()
        }),
      });
      const data = await res.json();
      // Always use data.text for the agent's answer
      if (data.text) {
        dispatch({ type: "SEND_MESSAGE", message: { role: "ai", content: data.text, timestamp: Date.now() } });
      } else {
        dispatch({ type: "SEND_MESSAGE", message: { role: "ai", content: 'Sorry, Baruk could not answer right now.', timestamp: Date.now() } });
      }
    } catch (e) {
      dispatch({ type: "SEND_MESSAGE", message: { role: "ai", content: 'Sorry, Baruk could not answer right now.', timestamp: Date.now() } });
    }
    setLoading(false);
  };

  const handleInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") handleSend();
  };

  const handleQuickAction = (action: string, data?: unknown) => {
    dispatch({ type: "TRIGGER_ACTION", action, data });
    setOpen(false);
    // For navigation, use window.location for now
    if (action === "navigate" && data) {
      const dataObj = data as { page: string };
      if (dataObj.page) {
        window.location.href = dataObj.page;
      }
    }
  };

  return (
    <>
      {/* Floating AI Orb Button */}
      <motion.button
        className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg border-2 border-accent bg-primary text-accent-foreground w-20 h-20 flex items-center justify-center"
        animate={{ scale: [1, 1.08, 1], boxShadow: ["0 0 32px #22d3ee", "0 0 64px #a855f7", "0 0 32px #22d3ee"] }}
        transition={{ repeat: Infinity, duration: 3 }}
        onClick={() => setOpen(true)}
        aria-label="Open AI Agent"
      >
        <SparklesIcon className="w-12 h-12 neon-text animate-pulse" />
      </motion.button>
      {/* Modal Chat Interface */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="bg-surface border-2 border-accent w-full max-w-md mx-auto p-6 rounded-2xl relative flex flex-col gap-4"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={event => event.stopPropagation()}
            >
              <button className="absolute top-3 right-3" onClick={() => setOpen(false)} aria-label="Close">
                <XMarkIcon className="w-6 h-6 text-white/80 hover:text-neon-cyan" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <SparklesIcon className="w-8 h-8 neon-text" />
                <div className="text-lg font-bold neon-text">AI Agent</div>
              </div>
              <div className="flex-1 min-h-[200px] max-h-72 overflow-y-auto bg-transparent rounded-lg p-2">
                {state.chat.map((msg, i) => (
                  <div key={i} className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' ? (
                      <div
                        className="px-4 py-3 rounded-2xl text-base max-w-[90%] bg-gradient-to-br from-black/70 via-black/80 to-black/90 border border-neon-cyan shadow-lg text-white"
                        dangerouslySetInnerHTML={{ __html: stripAgentStyles(msg.content) }}
                      />
                    ) : (
                      <div className="px-4 py-2 rounded-xl text-sm max-w-[80%] bg-neon-cyan/20 text-neon-cyan">{msg.content}</div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  ref={inputRef}
                  className="flex-1 p-3 rounded-lg bg-black/40 border border-neon-cyan text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan"
                  placeholder="Type your question..."
                  value={state.input}
                  onChange={event => dispatch({ type: "SET_INPUT", input: event.target.value })}
                  onKeyDown={handleInputKey}
                />
                <button
                  onClick={handleSend}
                  className="p-2 rounded-lg bg-neon-cyan/80 hover:bg-neon-cyan neon-text flex items-center justify-center"
                  disabled={loading}
                  aria-label="Send"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    className="px-3 py-1 rounded-lg bg-black/30 border border-neon-cyan text-neon-cyan text-xs hover:bg-neon-cyan/10 transition"
                    onClick={() => handleQuickAction(qa.action, qa.data)}
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}