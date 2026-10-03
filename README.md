# Flipbox Builder

A small Vue 3 app for building a single flipbox: an interactive card that shows
front content and reveals back content when the learner flips it. The builder
and a live preview sit side by side, and the flipbox is saved automatically so
it survives a page refresh.

See [PROJECT_SUMMARY.pdf](./PROJECT_SUMMARY.pdf) for design decisions,
trade-offs, known gaps and notes on AI tool use.

## Requirements

- **Node.js** `^20.19.0` or `>=22.12.0` (required by Vite 8). Check with `node -v`.
- **npm** (comes with Node)
- A modern browser (latest Chrome, Safari, Firefox or Edge)

## Install and run

```bash
npm install
npm run dev
```

Then open the URL <http://localhost:5173>.

## Using the app

1. Format text with the toolbar: **Bold**, *Italic*, bulleted list, numbered
   list, Undo and Redo. Keyboard shortcuts work too (Ctrl/⌘+B, Ctrl/⌘+I,
   Ctrl/⌘+Z, Ctrl/⌘+Shift+Z).
3. The **preview** updates as you type. Use **Flip to back / Flip to front**
   to turn the card.
4. Changes save automatically. Refresh the page and your flipbox is still there.

### Resetting saved data

The flipbox is stored in your browser's localStorage under the key
`flipbox-builder:flipbox`. To start fresh, open DevTools → Application →
Local Storage → `localhost:5173`, delete that key, and refresh. Or run this in
the DevTools console:

```js
localStorage.removeItem('flipbox-builder:flipbox'); location.reload();
```

## Project structure

```
src/
├── components/
│   ├── FlipboxBuilder.vue   # Front/back editors + autosave and load
│   ├── FlipboxPreview.vue   # Flip card, side indicator, screen-reader announcements
│   └── RichTextEditor.vue   # TipTap editor with an accessible formatting toolbar
├── composables/
│   └── usePersistence.js    # localStorage helper (provided by the starter)
└── editor/
    ├── extensions.js        # Shared TipTap schema used by the editor and the preview
    └── sanitize.js          # Re-validates stored HTML against that schema before display
```

## Testing

Testing was manual; no automated test suite is included (see the project
summary for why). Checks performed:

- Keyboard-only walkthrough in Chrome
- VoiceOver walkthrough in Safari (macOS)
- Persistence across refresh, including a refresh immediately after typing
