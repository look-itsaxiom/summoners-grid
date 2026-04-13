/**
 * Database layer — SQLite for local dev, schema compatible with PostgreSQL.
 *
 * Tables:
 * - users: wallet address, email, created_at
 * - cards: DNA, owner, rarity, species, minted status
 * - packs: purchase records (user, pack_type, price, status)
 * - decks: saved deck configurations
 * - matches: game history
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'summoners-grid.db');

let db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT UNIQUE NOT NULL,
      email TEXT,
      display_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dna TEXT UNIQUE NOT NULL,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      species TEXT NOT NULL,
      rarity TEXT NOT NULL,
      role TEXT,
      name TEXT NOT NULL,
      token_id TEXT,
      minted_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pack_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      pack_type TEXT NOT NULL DEFAULT 'standard',
      pack_size INTEGER NOT NULL DEFAULT 5,
      price_cents INTEGER NOT NULL,
      payment_id TEXT,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      cards_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL DEFAULT 'My Deck',
      summon_dnas TEXT NOT NULL,
      main_deck_dnas TEXT NOT NULL,
      advance_deck_dnas TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_a_id INTEGER REFERENCES users(id),
      player_b_id INTEGER REFERENCES users(id),
      winner_id INTEGER REFERENCES users(id),
      mode TEXT NOT NULL DEFAULT 'pve',
      turns INTEGER NOT NULL,
      player_a_vp INTEGER NOT NULL,
      player_b_vp INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS art_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_dna TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      prompt TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_cards_owner ON cards(owner_id);
    CREATE INDEX IF NOT EXISTS idx_cards_dna ON cards(dna);
    CREATE INDEX IF NOT EXISTS idx_packs_user ON pack_purchases(user_id);
    CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
  `);
}

// ─── User Operations ───

export function findOrCreateUser(walletAddress: string, email?: string) {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(walletAddress) as any;
  if (existing) {
    db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(existing.id);
    return existing;
  }
  const result = db.prepare('INSERT INTO users (wallet_address, email) VALUES (?, ?)').run(walletAddress, email ?? null);
  return { id: Number(result.lastInsertRowid), wallet_address: walletAddress, email: email ?? null };
}

// ─── Card Operations ───

export function createCard(ownerId: number, dna: string, species: string, rarity: string, name: string, role?: string) {
  const result = getDB().prepare(
    'INSERT INTO cards (owner_id, dna, species, rarity, name, role) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(ownerId, dna, species, rarity, name, role ?? null);
  return Number(result.lastInsertRowid);
}

export function getUserCards(userId: number) {
  return getDB().prepare('SELECT * FROM cards WHERE owner_id = ? ORDER BY created_at DESC').all(userId);
}

// ─── Pack Operations ───

export function createPackPurchase(userId: number, packType: string, packSize: number, priceCents: number) {
  const result = getDB().prepare(
    'INSERT INTO pack_purchases (user_id, pack_type, pack_size, price_cents) VALUES (?, ?, ?, ?)'
  ).run(userId, packType, packSize, priceCents);
  return Number(result.lastInsertRowid);
}

export function completePackPurchase(packId: number, paymentId: string, cardDNAs: string[]) {
  getDB().prepare(
    `UPDATE pack_purchases SET payment_status = 'completed', payment_id = ?, cards_json = ?, completed_at = datetime('now') WHERE id = ?`
  ).run(paymentId, JSON.stringify(cardDNAs), packId);
}

// ─── Deck Operations ───

export function saveDeck(userId: number, name: string, summonDNAs: string[], mainDeckDNAs: string[], advanceDeckDNAs: string[]) {
  const result = getDB().prepare(
    'INSERT INTO decks (user_id, name, summon_dnas, main_deck_dnas, advance_deck_dnas) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, name, JSON.stringify(summonDNAs), JSON.stringify(mainDeckDNAs), JSON.stringify(advanceDeckDNAs));
  return Number(result.lastInsertRowid);
}

export function getUserDecks(userId: number) {
  return getDB().prepare('SELECT * FROM decks WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
}

// ─── Match Operations ───

export function recordMatch(playerAId: number | null, playerBId: number | null, winnerId: number | null, mode: string, turns: number, aVP: number, bVP: number) {
  const result = getDB().prepare(
    'INSERT INTO matches (player_a_id, player_b_id, winner_id, mode, turns, player_a_vp, player_b_vp) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(playerAId, playerBId, winnerId, mode, turns, aVP, bVP);
  return Number(result.lastInsertRowid);
}
