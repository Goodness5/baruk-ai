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
          body: JSON.stringify({ message: msg.content }),
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
    <div className="max-w-4xl mx-auto mt-10 space-y-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-5xl text-white font-bold flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          <span role="img" aria-label="crystal ball" className="text-6xl">🔮</span> 
          <span>Scryer</span>
        </h1>
        <h2 className="text-2xl text-gray-300 font-medium">AI On-Chain Watcher</h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Enter a wallet, NFT, or token address to let the AI Orb narrate its story. 
          <br />Discover the hidden patterns in blockchain data with mystical precision.
        </p>
      </div>
      <div className="max-w-2xl mx-auto">
        <form
          className="flex gap-0 shadow-2xl rounded-xl overflow-hidden border border-gray-700"
          onSubmit={event => {
            event.preventDefault();
            setWatching(input);
            sendMessage({ role: "user", content: `Watch and narrate: ${input}` });
          }}
        >
          <input
            className="flex-1 px-6 py-4 bg-gray-800 text-white border-0 focus:outline-none placeholder-gray-400 text-lg"
            placeholder="🔍 Enter wallet, NFT, or token address..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-r-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          🔮 Watch
        </button>
      </form>
      </div>
      {watching && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 p-8 rounded-2xl mt-8 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div className="text-lg text-white font-semibold">🔮 Now Watching</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-xl mb-6 border border-gray-600">
              <div className="text-gray-400 text-sm mb-2">Address</div>
              <div className="text-white font-mono break-all text-lg">{watching}</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">B</div>
                <div className="text-white font-semibold">Baruk AI Analysis</div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 min-h-[120px]">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    <span className="text-white">Baruk is analyzing the blockchain...</span>
                  </div>
                ) : chat.length > 0 ? (
                  <div className="space-y-4">
                    {chat.slice(-3).map((msg: { role: string; content: string }, i: number) => (
                      <div key={i} className={`p-4 rounded-lg ${msg.role === "ai" ? "bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30" : "bg-gray-700/50 border border-gray-600"}`}>
                        <div className={`font-semibold mb-2 ${msg.role === "ai" ? "text-purple-300" : "text-gray-300"}`}>
                          {msg.role === "ai" ? "🤖 Baruk" : "👤 You"}
                        </div>
                        <div className={`${msg.role === "ai" ? "text-white" : "text-gray-300"}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    <div className="text-4xl mb-4">🔮</div>
                    <div>Waiting for mystical insights...</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* TODO: Add live charts, flows, and event feed here */}
          </div>
        </div>
      )}
    </div>
  );
}