# Platform Options — Alternatives to Immutable

## What We Need

| Capability | Purpose |
|-----------|---------|
| **User Auth** | Players create accounts, login |
| **Digital Ownership** | Cards are provably owned, tradeable |
| **Payments** | Accept money for pack purchases |
| **Marketplace** | Players buy/sell/trade cards |
| **Distribution** | Get the game to players |

## Option A: Steam + Self-Hosted (Fastest to Revenue)

| Capability | Solution | Setup Time |
|-----------|----------|-----------|
| Auth | Steam Auth (via Steamworks) | Built into Godot |
| Digital Ownership | Server-side database (our DNA system) | Already built |
| Payments | Steam Wallet (Steam handles it) | Built into Steamworks |
| Marketplace | Steam Community Market OR in-game | Medium |
| Distribution | Steam Store | Need Steamworks account ($100) |

**Pros:** Steam handles auth + payments + distribution. Massive audience. No blockchain complexity.
**Cons:** Steam takes 30% cut. No true digital sovereignty (Steam controls the items). No secondary market royalties.
**Time to revenue:** 2-4 weeks (need Steamworks account + store page + review)

## Option B: Self-Sovereign (Own Everything)

| Capability | Solution | Setup Time |
|-----------|----------|-----------|
| Auth | Supabase Auth (email, Google, Apple) | 1 day |
| Digital Ownership | Own ERC-721 on Base/Polygon | 1 week |
| Payments | Stripe (fiat) + onchain (crypto) | 2-3 days |
| Marketplace | Custom marketplace OR OpenSea/Blur | 1-2 weeks |
| Distribution | Steam + itch.io + direct download | 1 week |

**Pros:** Full control. True digital sovereignty. Royalties on secondary sales. Multi-platform.
**Cons:** More work. Need to handle auth, payments, blockchain ourselves.
**Time to revenue:** 3-5 weeks

## Option C: Hybrid (Steam First, Blockchain Later)

| Phase | What |
|-------|------|
| **Phase 1 (Week 1-2)** | Launch on Steam with in-game currency. Pack store uses Steam Wallet. Cards stored server-side. |
| **Phase 2 (Week 3-6)** | Add blockchain bridge: players can export cards to NFTs. Deploy ERC-721 on Base (low fees). |
| **Phase 3 (Week 7+)** | Marketplace: trade cards as NFTs. Royalties on secondary sales. |

**Pros:** Revenue from day 1 via Steam. Blockchain adds value later without blocking launch.
**Cons:** Requires migrating from server-side to on-chain later.
**This is the recommended approach.**

## Option D: Immutable (If They Unblock)

Continue with original plan if Immutable Hub access is granted. Their SDK handles auth + payments + minting + marketplace in one package. But currently blocked on their onboarding flow.

## Recommendation

**Go with Option C (Hybrid).** Get on Steam immediately, start generating revenue through pack sales via Steam Wallet, and add blockchain/NFT features as a v2 enhancement. This gives us:

1. Revenue from day 1
2. Steam's massive audience
3. No blockchain complexity blocking launch
4. Path to digital sovereignty later

### Immediate Action Items
1. Create Steamworks developer account ($100 one-time fee)
2. Create Steam store page (screenshots, description, trailer)
3. Set up Steam Wallet integration in Godot (DLC or microtransaction model)
4. Launch in Early Access
