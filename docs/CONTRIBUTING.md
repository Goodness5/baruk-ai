# Contributing

Thank you for helping build Baruk DeFi’s next-gen interface!

## Pull Request Checklist

1. **Visual Tests** — Run the app, check light & dark modes.
2. **a11y Tests** — `pnpm run a11y` must pass.
3. **Storybook** — Add/update stories for any new component.

## Branch Naming

`feature/{short-desc}` — new feature  
`fix/{short-desc}` — bug fix  
`docs/{short-desc}` — documentation only

## Commit Style (Conventional Commits)

```
feat(sidebar): add glowing active state
fix(connect-wallet): handle ledger reconnect
```

## Design Tokens

If you need a new colour, add it to `globals.css` under `:root` then reference it from Tailwind config (run `pnpm tokens:sync`).

## Getting Help

* Discord #frontend  
* GitHub Issues  
* The docs folder you’re reading right now!