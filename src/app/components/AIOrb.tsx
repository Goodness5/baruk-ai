"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function AIOrb() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Floating AI Orb Button */}
      <motion.button
        className="fixed bottom-8 right-8 z-50 hud-glass neon-border w-20 h-20 flex items-center justify-center shadow-xl"
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
              className="hud-glass neon-border w-full max-w-md mx-auto p-6 rounded-2xl relative flex flex-col gap-4"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="absolute top-3 right-3" onClick={() => setOpen(false)} aria-label="Close">
                <XMarkIcon className="w-6 h-6 text-white/80 hover:text-neon-cyan" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <SparklesIcon className="w-8 h-8 neon-text" />
                <div className="text-lg font-bold neon-text">AI Agent</div>
              </div>
              <div className="text-white/80 text-sm mb-2">Hi! I’m your AI Agent. Ask me anything about DeFi, trading, or this app. I’ll keep it simple!</div>
              <input
                className="w-full p-3 rounded-lg bg-black/40 border border-neon-cyan text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan"
                placeholder="Type your question..."
                disabled
              />
              <div className="text-xs text-neon-cyan/80 mt-2">(AI chat coming soon!)</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}