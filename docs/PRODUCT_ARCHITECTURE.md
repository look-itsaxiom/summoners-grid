# Summoner's Grid — Product Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PLAYER CLIENTS                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Godot   │  │   Web    │  │  Mobile (future)     │  │
│  │  Desktop │  │  Client  │  │  iOS / Android       │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
└───────┼──────────────┼───────────────────┼──────────────┘
        │              │                   │
        └──────────────┼───────────────────┘
                       │
              ┌────────▼────────┐
              │   API GATEWAY   │
              │  (Next.js API)  │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐  ┌──────▼──────┐  ┌───▼───┐
   │  Auth   │  │  Game API   │  │  Art  │
   │Passport │  │  Pack Open  │  │ Gen   │
   │  SSO    │  │  Card Data  │  │ComfyUI│
   └────┬────┘  │  Deck CRUD  │  └───┬───┘
        │       │  Match Hist │      │
        │       └──────┬──────┘      │
        │              │             │
   ┌────▼──────────────▼─────────────▼───┐
   │         DATABASE (PostgreSQL)        │
   │  Users, Decks, Match History,       │
   │  Art Jobs, Session Management       │
   └─────────────────┬───────────────────┘
                     │
   ┌─────────────────▼───────────────────┐
   │       BLOCKCHAIN (Immutable X)      │
   │  ERC-721 Cards, Ownership,          │
   │  Marketplace/Orderbook,             │
   │  Digital Signatures                 │
   └─────────────────────────────────────┘
```

## Revenue Streams

1. **Pack Sales** — Players purchase card packs with fiat/crypto
   - Packs contain randomly generated cards (DNA system)
   - Rarity distribution determines value
   - Primary revenue source

2. **Marketplace Fees** — Commission on peer-to-peer card trades
   - Auction House powered by Immutable Orderbook
   - Royalty on secondary sales (5-10%)
   
3. **Season Passes** — Premium content and rewards
   - Exclusive card art variants
   - Bonus pack rewards
   - Cosmetic board themes

## Component Status

### Game Client (Godot) — ACTIVE DEVELOPMENT
- Engine: Complete (stats, combat, cards, VP, territory, effect stack)
- UI: Functional (menu, deck preview, hand, board, game over, tutorial)
- Audio: 12 SFX + 4 BGM tracks (procedural)
- Art: Placeholder (text labels, colored shapes — needs real art)
- Tests: 107 passing

### Web Prototype (Next.js + React) — REFERENCE
- Engine: Complete (280 tests, reference implementation)
- UI: Complete (React components)
- API: Basic routes (pack open, card lookup, health)
- Auth: Immutable Passport started (SKI-157)
- DNA: 128-bit hex system complete with NFT metadata converter

### Backend — TODO
- [ ] PostgreSQL database (users, decks, match history, art jobs)
- [ ] Full auth flow with session management
- [ ] Pack store with payment processing
- [ ] Deck CRUD (save/load from server, not local)
- [ ] Match history API
- [ ] Matchmaking queue (PvP)

### Blockchain — TODO
- [ ] ERC-721 contract deployment on Immutable testnet
- [ ] NFT minting on pack open
- [ ] Ownership verification for deck building
- [ ] Marketplace integration (Immutable Orderbook)

### Art Pipeline — PARTIAL
- ComfyUI server running (RTX 4070, Flux Schnell + Animagine XL)
- DNA → art prompt mapping exists in web prototype
- Need: per-species sprites, card art templates, board textures

## Key Decisions Needed

### Godot Client ↔ Backend Communication
The Godot client currently runs entirely locally. For the full product:
- Auth: Godot needs to support Immutable Passport login (web-based OAuth flow)
- Card Data: Fetch owned cards from backend API, not hardcoded decks
- Deck Management: Save/load decks via API
- Matchmaking: WebSocket connection for PvP
- Pack Opening: API call → mint NFTs → return card data

### Payment Processing
- Fiat: Stripe or similar for pack purchases
- Crypto: Immutable Checkout for direct crypto payments
- In-game currency: Optional intermediate token?

### Deck Building from Owned Cards
Current: Hardcoded deck A and deck B
Target: Player builds deck from cards they actually own (verified on-chain)
Bridge: Random deck mode works without ownership for free play

## File Map

| Path | Purpose |
|------|---------|
| `Summoner's Grid GDD.md` | Game mechanics (authoritative) |
| `Summoner's Grid Play Example.md` | 10-turn verification scenario |
| `docs/PRODUCT_ARCHITECTURE.md` | This file — full system overview |
| `godot/` | Godot 4 game client |
| `src/` | Web prototype (reference implementation) |
| `src/engine/dna.ts` | Card DNA system |
| `src/engine/nftMetadata.ts` | DNA → ERC-721 converter |
| `src/engine/artPrompt.ts` | DNA → ComfyUI prompt mapping |
