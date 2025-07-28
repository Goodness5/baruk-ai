/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { useAI } from "../components/AIContext";

export default function ScryerPage() {
  const [input, setInput] = useState("");
  const [watching, setWatching] = useState<string | null>(null);
  const { state, dispatch } = useAI();
  const chat = state.chat;
  const [loading, setLoading] = useState(false);
  const sendMessage = async (msg: { role: 'user' | 'ai'; content: string }) => {
    dispatch({ type: 'SEND_MESSAGE', message: { ...msg, timestamp: Date.now() } });
    if (msg.role === 'user') {
      setLoading(true);
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: msg.content }),
        });
        const data = await res.json();
        dispatch({ type: 'SEND_MESSAGE', message: { role: 'ai', content: data.message, timestamp: Date.now() } });
      } catch (e) {
        dispatch({ type: 'SEND_MESSAGE', message: { role: 'ai', content: 'Sorry, Baruk could not answer right now.', timestamp: Date.now() } });
      }
      setLoading(false);
    }
  };

  // TODO: Integrate Sei MCP Kit for live data
  // TODO: Add trending assets, NFT, meme coin suggestions
  // TODO: Add visualizations (charts, flows, etc)

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-8">
      <h1 className="text-3xl text-accent-foreground font-bold flex items-center gap-2">
        <span role="img" aria-label="crystal ball">🔮</span> Scryer: AI On-Chain Watcher
      </h1>
      <p className="text-muted text-lg">
        Enter a wallet, NFT, or token address to let the AI Orb narrate its story. Or pick a trending asset below!
      </p>
      <form
        className="flex gap-2"
        onSubmit={event => {
          event.preventDefault();
          setWatching(input);
          sendMessage({ role: "user", content: `Watch and narrate: ${input}` });
        }}
      >
        <input
          className="flex-1 px-4 py-2 rounded-l-lg bg-surface text-accent-foreground border-2 border-accent focus:outline-none"
          placeholder="Wallet, NFT, or Token address..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-accent text-accent-foreground rounded-r-lg hover:opacity-90 transition"
        >
          Watch
        </button>
      </form>
      {watching && (
        <div className="bg-surface border-2 border-accent p-6 rounded-xl mt-6">
          <div className="text-lg text-accent-foreground mb-2">Now Watching:</div>
          <div className="text-accent-foreground font-mono break-all mb-4">{watching}</div>
          <div className="text-muted mb-2">AI Orb says:</div>
          <div className="bg-primary p-4 rounded-lg min-h-[80px]">
            {loading ? (
              <span className="text-muted">Baruk is thinking...</span>
            ) : chat.length > 0 ? (
              chat.slice(-3).map((msg: { role: string; content: string }, i: number) => (
                <div key={i} className={msg.role === "ai" ? "text-accent-foreground" : "text-muted"}>
                  <b>{msg.role === "ai" ? "Baruk:" : "You:"}</b> {msg.content}
                </div>
              ))
            ) : (
              <span className="text-muted">Waiting for AI insight...</span>
            )}
          </div>
          {/* TODO: Add live charts, flows, and event feed here */}
        </div>
      )}
    </div>
  );
}