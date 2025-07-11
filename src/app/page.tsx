export default function Home() {
  return (
    <>
      <div className="hud-glass neon-border p-6 rounded-xl flex flex-col items-center gap-2 mt-8">
        <span className="text-3xl">🔮</span>
        <h2 className="neon-text text-xl font-bold">Scryer: Watch Wallets, Coins & NFTs</h2>
        <p className="text-white/80 text-sm mb-2">Let the AI Orb narrate the story of any wallet, meme coin, or NFT on Sei. See the magic unfold in real time!</p>
        <a href="/scryer" className="px-4 py-2 bg-gradient-to-r from-purple-600 via-green-500 to-purple-700 text-white rounded-lg hover:opacity-90 transition">Try Scryer</a>
      </div>
    </>
  );
}
