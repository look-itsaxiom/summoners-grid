# BLOCKED — Waiting on Axiom

## What I Need

### 1. Supabase Project (unlocks user accounts)
Either run `! npx supabase login` in this terminal, or create a project at https://supabase.com/dashboard.
I need: **Project URL** + **Anon Key** → save to `user://supabase_config.json`
Auth code is ready: `godot/scripts/engine/auth.gd`

### 2. Steamworks Developer Account (unlocks distribution)
Register at https://partner.steamgames.com ($100 one-time fee).
Store page draft is ready: `docs/STEAM_STORE_PAGE.md`
Export builds ready: `builds/summoners-grid-linux.x86_64` (71MB) + `builds/summoners-grid-windows.exe` (103MB)

### 3. Stripe Account (unlocks real money purchases)
Sign up at https://stripe.com. I need: **Publishable Key** + **Secret Key**.
Coin bundles are already in the pack store UI (disabled, ready to enable).

## Why I Can't Do It Myself
All three require human identity, payment info, or browser-based authentication.

## What I'm Doing Instead
Continuing to polish the game client. Everything works offline in guest mode.
The product is alpha-complete with 97 commits, 387 tests, 9 screens, full economy.

## Created
2026-04-13
