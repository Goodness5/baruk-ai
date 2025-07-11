"use client";
import { useState } from "react";
import { useAI } from "../components/AIContext";

export default function ScryerPage() {
  const [input, setInput] = useState("");
  const [watching, setWatching] = useState<string | null>(null);
  const { state, dispatch } = useAI();
  const chat = state.chat;
  const sendMessage = (msg: { role: 'user' | 'ai'; content: string }) => {
    dispatch({ type: 'SEND_MESSAGE', message: msg });
  };

  // TODO: Integrate Sei MCP Kit for live data
  // TODO: Add trending assets, NFT, meme coin suggestions
  // TODO: Add visualizations (charts, flows, etc)

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-8">
      <h1 className="text-3xl neon-text font-bold flex items-center gap-2">
        <span role="img" aria-label="crystal ball">🔮</span> Scryer: AI On-Chain Watcher
      </h1>
      <p className="text-white/80 text-lg">
        Enter a wallet, NFT, or token address to let the AI Orb narrate its story. Or pick a trending asset below!
      </p>
      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          setWatching(input);
          sendMessage({ role: "user", content: `Watch and narrate: ${input}` });
        }}
      >
        <input
          className="flex-1 px-4 py-2 rounded-l-lg bg-[#181c24] text-white border-2 border-purple-700 focus:outline-none"
          placeholder="Wallet, NFT, or Token address..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white rounded-r-lg hover:opacity-90 transition"
        >
          Watch
        </button>
      </form>
      {watching && (
        <div className="hud-glass neon-border p-6 rounded-xl mt-6">
          <div className="text-lg neon-text mb-2">Now Watching:</div>
          <div className="text-white font-mono break-all mb-4">{watching}</div>
          <div className="text-white/80 mb-2">AI Orb says:</div>
          <div className="bg-[#181c24] p-4 rounded-lg min-h-[80px]">
            {chat.length > 0 ? (
              chat.slice(-3).map((msg: { role: string; content: string }, i: number) => (
                <div key={i} className={msg.role === "ai" ? "neon-text" : "text-white/80"}>
                  <b>{msg.role === "ai" ? "AI Orb:" : "You:"}</b> {msg.content}
                </div>
              ))
            ) : (
              <span className="text-white/40">Waiting for AI insight...</span>
            )}
          </div>
          {/* TODO: Add live charts, flows, and event feed here */}
        </div>
      )}
    </div>
  );
}