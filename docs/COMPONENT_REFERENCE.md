# Component Reference

Below is the key file map for UI components. All paths are relative to `src/app`.

| Component | Location | Purpose |
|-----------|----------|---------|
| Sidebar          | `components/Sidebar.tsx` | Global navigation anchored left. Uses `holo-surface` & neon accent border. |
| Topbar           | `components/Topbar.tsx`  | Wallet connect & page title bar. |
| ConnectWallet    | `components/ConnectWallet.tsx` | Unified provider modal (abstracts MetaMask, WalletConnect, etc.). |
| TokenSelector    | `components/TokenSelector.tsx` | Glass card; large touch targets; emoji fallback if icon missing. |
| BalanceWatcher   | `components/BalanceWatcher.tsx` | Polls user balances; shows skeleton loader while fetching. |
| TokenPriceWatcher| `components/TokenPriceWatcher.tsx` | Streams live prices; emits toast on 5%+ movement. |

## Custom CSS Utilities Used

* `.neon-glow` – Applied to primary buttons & headings.  
* `.glass-card` – Wrapping containers for forms.  
* `.holo-surface` – Background for side/top bars.

Combine these with Tailwind:

```tsx
<button className="glass-card neon-glow px-6 py-3 font-semibold">Swap Now</button>
```

## Extending Components

1. Import the utility classes: `import '../globals.css'`
2. Use Tailwind’s `@apply` for repeated patterns.
3. Keep all business logic outside UI components — use hooks in `lib/` or `store/`.