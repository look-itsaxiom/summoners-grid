# Summoner's Grid — Platform Game Design Document

> This document extends the core Game Design Document with platform-level systems: blockchain integration, card provenance, AI-generated art, marketplace, and economy design. The core GDD remains authoritative for gameplay mechanics and formulas.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Card DNA System](#card-dna-system)
3. [NFT Metadata Schema](#nft-metadata-schema)
4. [Card Provenance & Ownership](#card-provenance--ownership)
5. [Marketplace / Auction House](#marketplace--auction-house)
6. [AI Art Generation Pipeline](#ai-art-generation-pipeline)
7. [Card Visual DNA](#card-visual-dna)
8. [Authentication & User System](#authentication--user-system)
9. [Economy Design](#economy-design)
10. [Technical Architecture](#technical-architecture)

---

## Platform Overview

Summoner's Grid evolves from a standalone browser game into a blockchain-integrated collectible card game platform. Every summon card is a unique NFT on the Immutable X blockchain with AI-generated art, tradeable through a shared marketplace.

### Core Principles

- **True Ownership**: Players own their cards as ERC-721 NFTs. Cards persist beyond any single game session.
- **Deterministic Identity**: Every card's stats, growth rates, and appearance are encoded in a compact DNA string. The same DNA always produces the same card — verifiable by anyone.
- **Gasless Trading**: All marketplace operations (listing, buying, trading) are gasless for players. The platform sponsors gas costs.
- **Seamless Onboarding**: Players authenticate via Google, Apple, or email. No MetaMask, no seed phrases, no crypto knowledge required.
- **Play First, Collect Later**: Guest mode allows full gameplay with local cards. Blockchain features enhance but don't gate the core experience.

---

## Card DNA System

### Purpose

Card DNA is a compact, immutable identifier that deterministically encodes every random decision made during card generation. Given a DNA string, any machine can reconstruct the exact same `SummonCard` without a database lookup. DNA is the **source of truth** for a card's identity.

### DNA Format

128-bit value represented as a 32-character hexadecimal string.

```
Position:  0123 4567 89AB CDEF 0123 4567 89AB CDEF
DNA:       VVSS RRRN NNNG GGGG AAAB BBCC CDDD EEEF

Fields:
  VV    = Version (8 bits) — Schema version. Current: 0x01
  SS    = Species (8 bits) — Species index (0x00-0x06 maps to 7 species)
  RRR   = Rarity (4 bits) + Reserved (8 bits)
            Rarity: 0=common, 1=uncommon, 2=rare, 3=legend, 4=myth
  NNN   = Name Seed (12 bits) — Determines generated name
  GGGGG = Growth Seed (20 bits) — Seeds all 9 growth rate rolls
  AAA   = Stat Seed A (12 bits) — Seeds STR, END, DEF base stats
  BBB   = Stat Seed B (12 bits) — Seeds INT, SPI, MDF base stats
  CCC   = Stat Seed C (12 bits) — Seeds SPD, ACC, LCK base stats
  DDD   = Equipment Seed (12 bits) — Determines weapon, armor, accessory
  EEE   = Visual Flair Seed (12 bits) — Unique visual characteristics for AI art
  F     = Checksum (4 bits) — XOR of all preceding nibbles
```

### Deterministic Reconstruction

The reconstruction function uses a seeded PRNG (mulberry32) to replay the exact sequence of random decisions:

```
reconstructCardFromDNA(dna: string) → SummonCard
  1. Parse DNA into field values
  2. Validate checksum
  3. Map species index → SpeciesId
  4. Map rarity index → Rarity
  5. Seed name PRNG → select prefix + suffix
  6. Seed growth PRNG → roll 9 growth rates (using rarity weights)
  7. Seed stat PRNGs → roll 9 base stats (within species ranges + rarity floor)
  8. Seed equipment PRNG → select weapon, armor, accessory
  9. Return complete SummonCard
```

### DNA Properties

- **Immutable**: DNA never changes after minting. It is stored on-chain as an NFT attribute.
- **Deterministic**: Same DNA always produces the same card. Verified by reconstruction.
- **Versioned**: The version byte allows schema evolution without breaking existing cards. V2 cards can coexist with V1 cards; the reconstruction function switches behavior based on version.
- **Compact**: 32 hex characters fits in a single metadata attribute, URL parameter, or QR code.
- **Self-Validating**: The checksum nibble detects transcription errors.

### Species Index Mapping

| Index | Species     |
|-------|-------------|
| 0x00  | Gignen      |
| 0x01  | Fae         |
| 0x02  | Stoneheart  |
| 0x03  | Wilderling  |
| 0x04  | Angar       |
| 0x05  | Demar       |
| 0x06  | Creptilis   |

### Rarity Index Mapping

| Index | Rarity   |
|-------|----------|
| 0     | Common   |
| 1     | Uncommon |
| 2     | Rare     |
| 3     | Legend   |
| 4     | Myth     |

---

## NFT Metadata Schema

Each summon card is an ERC-721 token on Immutable's zkEVM chain. The metadata follows the standard with game-specific attributes for marketplace filtering.

### Metadata JSON Structure

```json
{
  "name": "Aelstone",
  "description": "A versatile Gignen warrior. Rare rarity. STR-focused with exceptional LCK growth.",
  "image": "ipfs://Qm.../card-art.png",
  "animation_url": "ipfs://Qm.../sprite.webp",
  "external_url": "https://summonersgrid.com/card/{tokenId}",
  "attributes": [
    { "trait_type": "DNA", "value": "01023a4bf8c2d1e09a7b3c4d5e6f7a8b" },
    { "trait_type": "Species", "value": "Gignen" },
    { "trait_type": "Rarity", "value": "Rare" },
    { "trait_type": "STR", "value": 12, "display_type": "number" },
    { "trait_type": "END", "value": 10, "display_type": "number" },
    { "trait_type": "DEF", "value": 11, "display_type": "number" },
    { "trait_type": "INT", "value": 9, "display_type": "number" },
    { "trait_type": "SPI", "value": 8, "display_type": "number" },
    { "trait_type": "MDF", "value": 7, "display_type": "number" },
    { "trait_type": "SPD", "value": 8, "display_type": "number" },
    { "trait_type": "ACC", "value": 9, "display_type": "number" },
    { "trait_type": "LCK", "value": 11, "display_type": "number" },
    { "trait_type": "STR Growth", "value": "Gradual (+)" },
    { "trait_type": "END Growth", "value": "Normal (_)" },
    { "trait_type": "DEF Growth", "value": "Accelerated (++)" },
    { "trait_type": "INT Growth", "value": "Steady (-)" },
    { "trait_type": "SPI Growth", "value": "Normal (_)" },
    { "trait_type": "MDF Growth", "value": "Steady (-)" },
    { "trait_type": "SPD Growth", "value": "Normal (_)" },
    { "trait_type": "ACC Growth", "value": "Gradual (+)" },
    { "trait_type": "LCK Growth", "value": "Exceptional (*)" },
    { "trait_type": "Weapon", "value": "Flame Blade" },
    { "trait_type": "Armor", "value": "Iron Plate" },
    { "trait_type": "Accessory", "value": "Lucky Charm" },
    { "trait_type": "Stat Total", "value": 85, "display_type": "number" },
    { "trait_type": "Growth Score", "value": 72, "display_type": "number" }
  ]
}
```

### Attribute Design Rationale

- **DNA**: The immutable truth. All other attributes are derived from DNA and included for marketplace filter/sort convenience.
- **Individual Stats**: Enables marketplace filtering (e.g., "show all Rare Fae with STR > 14").
- **Growth Rates**: Displayed with symbol notation for quick recognition.
- **Stat Total**: Sum of all 9 base stats. Quick power comparison.
- **Growth Score**: Weighted sum of growth rates (exceptional=6, accelerated=5, gradual=4, normal=3, steady=2, minimal=1). Higher = better overall growth potential.
- **Equipment**: Filterable by specific weapon/armor type.

### Metadata Update Policy

- **At Mint**: DNA, species, rarity, all stats, growth rates, equipment, stat total, growth score
- **After Art Generation**: `image` and `animation_url` updated via Immutable metadata refresh API
- **Never Changes**: DNA, stats, growth rates, equipment (these are immutable card properties)

---

## Card Provenance & Ownership

### Minting Flow

```
Player requests pack open
        │
        ▼
Server generates cryptographic random entropy
        │
        ▼
Server constructs DNA strings (one per card)
        │
        ▼
Server reconstructs full SummonCard from each DNA (verification)
        │
        ▼
Server calls Immutable Minting API
  - Batch mint ERC-721 tokens
  - Include metadata with DNA + derived attributes
  - reference_id for idempotency
        │
        ▼
Server queues art generation jobs (async)
        │
        ▼
Client receives token IDs + DNA strings
        │
        ▼
Client reconstructs SummonCards locally (same function, same result)
        │
        ▼
Player sees their new cards (with CSS art placeholder until AI art ready)
```

### Key Security Properties

- **Server-Side Randomness**: Rarity rolls happen server-side with cryptographic entropy (`crypto.getRandomValues`). The client never decides rarity.
- **Idempotent Minting**: Each pack open has a unique `reference_id`. Retries don't create duplicate cards.
- **Verifiable Cards**: Anyone can reconstruct a card from its DNA and verify it matches the on-chain metadata.
- **Ownership = Blockchain**: The Immutable Indexer is the source of truth for who owns what. No separate database of ownership.

### Digital Signature Field Migration

The existing `SummonCard.digitalSignature` field transitions from a dummy string to the on-chain token ID:

| Before | After |
|--------|-------|
| `"sig-gen-gignen-42-1680000000"` | `"0x1234...abcd"` (ERC-721 token ID) |

For offline/guest cards, `digitalSignature` remains a local identifier. The `tokenId` field (new) is `undefined` for non-NFT cards.

---

## Marketplace / Auction House

### Built on Immutable Orderbook

The marketplace uses Immutable's Orderbook for peer-to-peer trading with shared liquidity across the entire Immutable ecosystem.

### Listing a Card for Sale

1. Player selects a card from their collection
2. Player sets a price in IMX (native token)
3. Player signs a gasless message (no transaction fee)
4. Listing appears on our marketplace AND all Immutable-compatible marketplaces
5. Card is locked from deck use while listed

### Buying a Card

1. Buyer browses listings, filters by species/rarity/stats/price
2. Buyer clicks "Buy" and confirms via Passport wallet
3. Transaction executes on-chain (gas sponsored)
4. Card ownership transfers immediately
5. Seller receives payment minus royalty

### Bidding (Collection Bids)

1. Buyer can bid on a specific card OR any card matching criteria
2. Collection bids: "I'll pay X IMX for any Rare Fae with STR > 14"
3. Sellers can accept matching bids

### Royalty Structure

- **Primary Sales** (pack purchases): Revenue to the game
- **Secondary Sales** (marketplace trades): Configurable royalty percentage (recommend 5%)
- **Royalties enforced at protocol level** — cannot be bypassed

### Marketplace Filters

| Filter | Type | Example |
|--------|------|---------|
| Species | Enum | Fae, Stoneheart |
| Rarity | Enum | Rare, Legend, Myth |
| Stat (any) | Range | STR > 14, LCK > 10 |
| Growth Rate | Enum | STR Growth = Exceptional |
| Stat Total | Range | > 90 |
| Growth Score | Range | > 60 |
| Weapon | Enum | Flame Blade |
| Price | Range | 0.1 - 10 IMX |

---

## AI Art Generation Pipeline

### Infrastructure

- **ComfyUI** running on `home.skib` (accessible via SSH: `axiom@home.skib`)
- **Stable Diffusion XL** model for card art generation
- Async job queue (BullMQ) for processing

### Generation Flow

```
NFT minted with DNA
        │
        ▼
Art job queued (BullMQ)
        │
        ▼
DNA → Prompt Builder
  - Parse species, rarity, stats, equipment
  - Map to visual descriptors
  - Construct structured prompt
        │
        ▼
SSH to home.skib → ComfyUI API
  - Submit workflow with prompt
  - Wait for generation (10-30 seconds)
  - Download result
        │
        ▼
Post-Processing
  - Card art: 512x512 PNG (full card illustration)
  - Board sprite: 64x64 PNG (in-game unit icon)
  - Sprite sheet: idle animation frames
        │
        ▼
IPFS Upload (Pinata)
  - Pin card art
  - Pin sprite/animation
  - Get CIDs
        │
        ▼
Update NFT Metadata
  - Set image = ipfs://Qm.../card-art.png
  - Set animation_url = ipfs://Qm.../sprite.webp
  - Call Immutable metadata refresh API
```

### Prompt Building Rules

The prompt is deterministically derived from card DNA so the same card always generates visually consistent art.

#### Base Prompt Template

```
"Fantasy TCG card art, portrait composition, {species_description},
{rarity_aura}, {body_type}, wearing {armor_description},
wielding {weapon_description}, {accessory_detail},
{element_palette}, {unique_flair}, detailed illustration,
game card style, dark fantasy theme"
```

#### Species → Visual Description

| Species | Description |
|---------|-------------|
| Gignen | "human-like adventurer, versatile build, neutral expression" |
| Fae | "ethereal elf with pointed ears, graceful features, luminous skin" |
| Stoneheart | "stout dwarf, broad shoulders, stone-like skin texture, craftsman build" |
| Wilderling | "bestial humanoid, fur-covered, primal features, keen eyes" |
| Angar | "celestial being, radiant features, wings of light, wise expression" |
| Demar | "devilish figure, horns, clever expression, arcane markings" |
| Creptilis | "reptilian humanoid, scales, calculating eyes, armored tail" |

#### Rarity → Aura Effects

| Rarity | Aura |
|--------|------|
| Common | "no special aura, plain background" |
| Uncommon | "faint green shimmer around the figure" |
| Rare | "blue magical aura, glowing edges" |
| Legend | "golden radiant aura, ornate frame elements" |
| Myth | "prismatic rainbow aura, divine light, cosmic energy swirling" |

#### Highest Stat → Body Archetype

| Highest Stat | Archetype |
|-------------|-----------|
| STR | "muscular build, powerful stance, imposing physique" |
| END | "scarred and weathered, thick-skinned, enduring posture" |
| DEF | "heavily armored, shield-bearing, defensive stance" |
| INT | "scholarly appearance, glowing runes, mystical implements" |
| SPI | "serene expression, holy symbols, gentle radiance" |
| MDF | "warded appearance, protective glyphs, barrier shimmer" |
| SPD | "lean and agile, wind-swept, dynamic pose" |
| ACC | "sharp-eyed, precise stance, focused expression" |
| LCK | "charmed appearance, four-leaf motifs, dice/coin accessories" |

#### Unique Flair (from Visual Flair Seed)

The 12-bit visual flair seed selects from a pool of unique visual modifiers:

- Scar patterns, hair color/style, eye color
- Background scene (forest, ruins, battlefield, mountain)
- Pose variation (battle-ready, meditative, commanding, sneaking)
- Weather/time (dawn, storm, moonlight, sunny)

---

## Card Visual DNA

### Purpose

Every card's visual appearance is deterministically derived from its DNA, ensuring consistency between card art and in-game sprites.

### Visual Trait Derivation

```
DNA → {
  species       → body type, skin, features
  rarity        → aura, border, glow
  highest stat  → build/archetype
  weapon seed   → held weapon appearance
  armor seed    → worn armor appearance
  accessory seed → visible accessory
  element       → color palette accent
  flair seed    → unique details (hair, scars, pose, background)
}
```

### Sprite Generation

Board sprites (64x64) are derived from the card art:

1. **Crop**: Extract the character's upper body from card art
2. **Resize**: Scale to 64x64 with sharp pixel edges
3. **Palette**: Apply team color tint (blue for Player A, red for Player B)
4. **Animation**: Generate 2-4 frame idle animation (subtle breathing/glow)

### Fallback System

Until AI art is generated:
1. Use existing CSS-based `SpeciesArt` component (colored gradient + species symbol)
2. This is instantaneous and works offline
3. Art status tracked per card: `pending` → `generating` → `ready`
4. UI auto-updates when art becomes available

---

## Authentication & User System

### Immutable Passport

- **Login Methods**: Google, Apple, email (no crypto wallet required)
- **Embedded Wallet**: Created automatically on first login, non-custodial
- **Cross-Device**: Same wallet accessible from any device
- **Pre-Approved Transactions**: Whitelisted game actions execute without popup confirmation

### User Progression

| Level | Features |
|-------|----------|
| **Guest** | Full gameplay with local cards. No blockchain. No trading. |
| **Authenticated** | Passport login. Free starter pack (minted NFTs). Can trade. |
| **Collector** | Opens additional packs. Builds collection. Marketplace access. |
| **Competitive** | Deck building from NFT collection. Ranked play (future). |

### Guest → Authenticated Migration

When a guest player logs in for the first time:
1. Receive a free starter pack (3 summons + starter action cards)
2. Local save data preserved (match history transfers)
3. Existing local cards remain playable but are not NFTs
4. Clear visual distinction between local cards and NFT cards in collection

---

## Economy Design

### Currency

- **IMX**: Immutable's native token, used for marketplace transactions
- **Gameplay Currency (future)**: Earned through wins, quests, daily play — used for pack purchases

### Pack Tiers

| Pack | Contents | Cost |
|------|----------|------|
| **Starter Pack** | 3 Common summons + 5 basic action cards | Free (one per account) |
| **Standard Pack** | 5 summons (guaranteed 1 Uncommon+) | TBD IMX |
| **Premium Pack** | 5 summons (guaranteed 1 Rare+) | TBD IMX |
| **Legendary Pack** | 5 summons (guaranteed 1 Legend+) | TBD IMX |

### Revenue Streams

1. **Pack Sales**: Primary revenue from selling card packs
2. **Marketplace Royalties**: 5% on all secondary sales
3. **Premium Content**: Cosmetic items, board skins (future)

### Anti-Inflation Design

- **Rarity Scarcity**: Myth cards have < 0.1% drop rate
- **Burn Mechanics (future)**: Sacrifice cards for crafting materials
- **Season Rotations (future)**: New card sets with different themes/meta

---

## Technical Architecture

### Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js (migrated from Vite), React, Zustand, TypeScript |
| **API** | Next.js API Routes |
| **Blockchain** | Immutable zkEVM (ERC-721), @imtbl/sdk |
| **Auth** | Immutable Passport (embedded wallet) |
| **Database** | PostgreSQL (decks, pack history, art job status) |
| **Art Generation** | ComfyUI on home.skib via SSH |
| **Image Storage** | IPFS via Pinata |
| **Job Queue** | BullMQ + Redis (art generation pipeline) |
| **Shared Code** | `shared/` package — DNA engine, PRNG, constants |

### Deployment Architecture

```
Next.js App (Vercel / self-hosted)
  ├── /app          — React pages + components
  ├── /app/api      — API routes (auth, packs, collection, marketplace)
  └── /shared       — DNA engine (imported by both client + API)

PostgreSQL (managed)
  └── Tables: users, decks, pack_opens, art_jobs

Redis (managed)
  └── BullMQ queues: art-generation

ComfyUI (home.skib)
  └── Stable Diffusion XL workflows via SSH/API

Immutable zkEVM
  └── ERC-721 contract (summon cards)
  └── Orderbook (marketplace)
  └── Indexer (ownership queries)

IPFS (Pinata)
  └── Card art + sprite assets
```

### Key Constraint

**The game engine (`src/engine/`) must remain pure TypeScript with zero blockchain dependencies.** It accepts `SummonCard` objects and plays the game — it doesn't care if the card came from a local generator, a DNA reconstruction, or an NFT query. This preserves the 121 existing tests and allows offline play.

---

_This Platform GDD is a living document. It will be updated as implementation progresses and design decisions are refined._
