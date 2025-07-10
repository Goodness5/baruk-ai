# UI Design Philosophy

The new interface marries **neon-glow minimalism** with **child-friendly clarity**.

## Visual Language

| Element | Role | Example |
|---------|------|---------|
| Neon Accent | Directs attention to the primary action | Swap button glowing cyan |
| Glass Card  | Visual grouping without heavy borders | Token selector container |
| Holo Surface | Backgrounds for full-width sections | Sidebar & topbar |

### Colour Palette

```
Primary  : #22d3ee  (Cyan)
Secondary: #a855f7  (Purple)
Success  : #4ade80  (Mint)
Error    : #f87171  (Coral)
Background-Dark: #0a0a0a
```

All interactive states have a glow that increases luminance by 20%.

### Typography

* **Oxanium** – sci-fi sans for headings & body.  
* **Share Tech Mono** – console-style monospace for code & numeric values.

## Layout Rules

1. **One Screen, One Action** – Each page focuses on a single decision. Additional options live behind accordions.
2. **Edge-Anchored Navigation** – Sticky sidebar & topbar; leave the rest for content.
3. **Motion for Feedback, Not Flair** – Elements animate only on state changes (success, error, loading).

## Interaction Patterns

* Drag-&-drop token rearrange (mobile friendly).  
* Big toggle switches instead of checkboxes.  
* Contextual help icons open inline tool-tips rather than modals.

## Accessibility

* Tested at WCAG 2.1 AA contrast ratios.  
* All buttons have aria-labels and keyboard focus rings.

---

Implement these guidelines via the utility classes in `globals.css` and Tailwind’s `@apply` syntax.