export default function Home() {
  return (
    <>
      <div className="bg-surface border-2 border-accent p-6 rounded-xl flex flex-col items-center gap-2 mt-8">
        <span className="text-3xl">🔮</span>
        <h2 className="text-accent-foreground text-xl font-bold">Scryer: Watch Wallets, Coins & NFTs</h2>
        <p className="text-muted text-sm mb-2">Let the AI Orb narrate the story of any wallet, meme coin, or NFT on Sei. See the magic unfold in real time!</p>
        <a href="/scryer" className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition">Try Scryer</a>
      </div>
    </>
  );
}
