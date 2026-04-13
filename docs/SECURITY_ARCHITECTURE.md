# Security Architecture

## Threat Model

A digital card game with real-money transactions faces these threats:

| Threat | Impact | Mitigation |
|--------|--------|-----------|
| Card duplication/forgery | Economy collapse | Server-authoritative card generation, DNA signed server-side |
| Payment fraud | Revenue loss | Stripe handles PCI compliance, webhook signature verification |
| Account takeover | Player loss, reputation | Supabase Auth with MFA, session management, rate limiting |
| Pack manipulation | Unfair advantage | Server-side RNG (crypto.getRandomValues), no client-side pack gen |
| Replay attacks | Duplicate transactions | Idempotency keys on all pack purchases |
| Data breach | Legal liability, trust loss | Encryption at rest, minimal PII, Supabase RLS policies |
| Deck hacking | Unfair gameplay | Server validates deck composition against owned cards |
| Man-in-middle | Data theft | HTTPS everywhere, certificate pinning in Godot client |

## Architecture Principles

1. **Server-authoritative** — The client is untrusted. Every card, pack, and transaction is validated server-side.
2. **Defense in depth** — Multiple layers: auth → authorization → validation → rate limiting → logging.
3. **Minimal data** — Collect only what's needed. No passwords stored (Supabase handles auth).
4. **Audit trail** — Every transaction logged with timestamps, user IDs, and IP addresses.

## Authentication (Supabase Auth)

- Email + password with email verification
- OAuth providers: Google, Apple, Discord
- JWT tokens with short expiry (1 hour) + refresh tokens
- Row Level Security (RLS) on all database tables
- Rate limiting: 5 login attempts per minute per IP

## Card Generation Security

**Critical: Cards must ONLY be generated server-side.**

```
Client: "I want to buy a Standard Pack" →
Server: Verify payment → Generate DNA with crypto.getRandomValues() →
        Sign DNA with server secret → Store in DB → Return to client
```

The DNA signature prevents:
- Client-generated fake cards
- Modified card stats/rarity
- Duplicated cards across accounts

Each card's DNA includes a HMAC signature:
```
card_dna = 128-bit hex (species, stats, rarity, visual traits)
card_sig = HMAC-SHA256(card_dna, SERVER_SECRET)
card_id  = UUID v4 (database primary key)
```

## Payment Security (Stripe)

- PCI DSS compliance handled by Stripe (card data never touches our server)
- Stripe Checkout Sessions for payment UI
- Webhook signature verification for payment confirmations
- Idempotency keys prevent duplicate pack openings
- Refund handling through Stripe Dashboard

## Database Security (Supabase PostgreSQL)

Row Level Security policies:
```sql
-- Users can only read their own cards
CREATE POLICY "Users see own cards" ON cards
  FOR SELECT USING (auth.uid() = user_id);

-- Only the server (service role) can insert cards
CREATE POLICY "Server inserts cards" ON cards
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Users cannot modify cards
-- (no UPDATE or DELETE policies = no modification allowed)
```

## API Security

- All endpoints require authentication (JWT in Authorization header)
- Rate limiting: 10 requests/second per user, 100/second global
- Input validation with Zod schemas on all endpoints
- CORS restricted to game client origins
- Request logging with user ID, IP, timestamp
- API keys rotated quarterly

## Client-Side Security

- HTTPS certificate pinning for API requests
- No sensitive data in client-side storage (only JWT refresh token)
- Anti-cheat: game state validated server-side for PvP matches
- Card ownership verified before deck building
- Obfuscated GDScript in release builds (Godot export encryption)

## Incident Response

1. Suspicious activity triggers alerts (unusual pack purchase volume, impossible card combinations)
2. Account suspension capability for fraud cases
3. Transaction rollback for payment disputes
4. Database point-in-time recovery (Supabase built-in)
