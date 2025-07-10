# Quick Start

Follow these steps to run Baruk DeFi locally with the new UI.

## 1. Clone & Install
```bash
# Using pnpm (recommended)
pnpm i
```

## 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in RPC endpoints and API keys. We abstract all Web3 terms, so just think of these as “internet magic portals.”

```
RPC_URL="https://..."
NEXT_PUBLIC_ALCHEMY_KEY="..."
```

## 3. Start the Dev Server
```bash
pnpm dev
```
Visit http://localhost:3000 to see the neon holo interface.

## 4. Lint & Format
```bash
pnpm lint && pnpm format
```

## 5. Build for Production
```bash
pnpm build && pnpm start
```

Need help? Ping us in Discord or open an issue.