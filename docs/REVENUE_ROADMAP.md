# Revenue Roadmap — Path to First Dollar

## Current State (2026-04-13)

### What Works
- **Game Client (Godot)**: Complete single-player game (vs AI, random deck, spectator), 107 tests, 7 species sprites, procedural audio, full UI
- **Web Prototype**: Complete reference engine (280 tests), DNA system, NFT metadata, art prompt builder
- **Auth Code**: Immutable Passport service written (`src/services/passport.ts`), needs testing
- **Art Pipeline**: ComfyUI running (RTX 4070), 7 species sprites generated
- **Card DNA**: 128-bit hex encoding, deterministic reconstruction, round-trip verified

### What's Missing for Revenue
1. **No live auth** — Passport code exists but untested, no Immutable Hub app registered
2. **No backend server** — API routes exist in reference but no deployed server
3. **No database** — No persistent user accounts, decks, or purchase history
4. **No payment processing** — Can't accept money
5. **No NFT minting** — Contract not deployed, no on-chain cards
6. **No marketplace** — No way to trade cards
7. **Godot client is offline-only** — Doesn't talk to any server

## Revenue MVP — Minimum for First Dollar

The smallest slice that generates revenue:

### Phase 1: Web-Based Pack Store (fastest path)
**Goal: Players can buy and open card packs via web browser**

1. Deploy the web client to a public URL
2. Register Immutable Passport app (needs Axiom — Immutable Hub account)
3. Wire auth flow: login → wallet creation → session
4. Deploy ERC-721 contract on Immutable testnet
5. Implement pack purchase flow:
   - Stripe checkout → payment confirmed
   - Server generates DNA for N cards
   - Mint NFTs on Immutable
   - Show pack opening animation with new cards
6. Card gallery: view your owned cards (read from chain)

**Revenue: Pack sales (primary)**

### Phase 2: Deck Building + Play
**Goal: Play the game with cards you own**

1. Deck builder UI: select from owned cards, save deck
2. Godot client fetches deck from server (not hardcoded)
3. Login via Immutable Passport in Godot (OAuth web flow)
4. Play vs AI with your own deck

### Phase 3: Marketplace
**Goal: Players can trade cards**

1. Integrate Immutable Orderbook for listing/buying
2. Marketplace UI (web first, then Godot)
3. Royalty configuration (5-10% on secondary sales)

### Phase 4: PvP
**Goal: Play against other humans**

1. Matchmaking queue
2. WebSocket real-time sync
3. Server-authoritative game state
4. ELO rating system

## Decisions for Axiom

These require human input (potential BLOCKED items):

1. **Immutable Hub registration** — Need an account to register Passport app and deploy contracts
2. **Stripe account** — For fiat payment processing
3. **Domain/hosting** — Where to deploy the web client and API
4. **Pack pricing** — How much to charge per pack
5. **Card rarity distribution** — Odds of getting rare/legendary cards
6. **Testnet vs mainnet timeline** — When to go live with real money

## Immediate Next Steps

1. ✅ Product architecture doc
2. ✅ Revenue roadmap (this file)
3. Integrate species sprites into Godot board
4. Create pack store spec document
5. Set up PostgreSQL schema for users/cards/purchases
6. Test Immutable Passport auth flow (may need Axiom to register app)
