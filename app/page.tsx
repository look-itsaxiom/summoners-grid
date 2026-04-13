'use client';

import { useState } from 'react';

type Card = {
  id: number;
  dna: string;
  name: string;
  species: string;
  rarity: string;
  role?: string;
};

type PackResult = {
  success: boolean;
  packId: number;
  packType: string;
  packSize: number;
  priceCents: number;
  cards: Card[];
};

const RARITY_COLORS: Record<string, string> = {
  common: '#8a8a8a',
  uncommon: '#4a9e4a',
  rare: '#4a7ab5',
  legend: '#b5a04a',
  myth: '#b54a9e',
};

const SPECIES_EMOJI: Record<string, string> = {
  gignen: '⚔️',
  fae: '✨',
  stoneheart: '🪨',
  wilderling: '🐺',
  angar: '👼',
  demar: '😈',
  creptilis: '🦎',
};

export default function PackStore() {
  const [wallet, setWallet] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [packResult, setPackResult] = useState<PackResult | null>(null);
  const [collection, setCollection] = useState<Card[]>([]);
  const [view, setView] = useState<'store' | 'collection' | 'result'>('store');

  const handleLogin = () => {
    // Dev mode: use a test wallet
    const testWallet = '0x' + Math.random().toString(16).slice(2, 42);
    setWallet(testWallet);
    setIsLoggedIn(true);
  };

  const openPack = async (packType: 'standard' | 'premium') => {
    setIsOpening(true);
    try {
      const res = await fetch('/api/packs/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packType, walletAddress: wallet }),
      });
      const data = await res.json();
      if (data.success) {
        setPackResult(data);
        setView('result');
      }
    } catch (err) {
      console.error('Pack open failed:', err);
    }
    setIsOpening(false);
  };

  const loadCollection = async () => {
    try {
      const res = await fetch(`/api/collection?walletAddress=${wallet}`);
      const data = await res.json();
      if (data.success) {
        setCollection(data.collection);
        setView('collection');
      }
    } catch (err) {
      console.error('Collection load failed:', err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 20 }}>
        <h1 style={{ fontSize: 48, color: '#ffd700', margin: 0 }}>Summoner&apos;s Grid</h1>
        <p style={{ color: '#888', fontSize: 14 }}>TACTICAL GRID-BASED RPG CARD GAME</p>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={handleLogin} style={btnStyle('#4a7ab5')}>
            Connect Wallet (Dev Mode)
          </button>
          <p style={{ color: '#666', fontSize: 11, textAlign: 'center' }}>
            Production: Immutable Passport login
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #2a2a3a', paddingBottom: 12 }}>
        <h1 style={{ fontSize: 24, color: '#ffd700', margin: 0 }}>Summoner&apos;s Grid</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setView('store')} style={navStyle(view === 'store')}>Pack Store</button>
          <button onClick={loadCollection} style={navStyle(view === 'collection')}>My Cards</button>
          <span style={{ color: '#666', fontSize: 11 }}>{wallet.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Pack Store */}
      {view === 'store' && (
        <div>
          <h2 style={{ color: '#ccc', marginBottom: 24 }}>Buy Card Packs</h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <PackCard
              name="Standard Pack"
              description="5 cards with guaranteed Uncommon+ and Rare+"
              price="$3.00"
              color="#4a7ab5"
              isLoading={isOpening}
              onBuy={() => openPack('standard')}
            />
            <PackCard
              name="Premium Pack"
              description="10 cards with guaranteed Rare+ and Legend+"
              price="$10.00"
              color="#b5a04a"
              isLoading={isOpening}
              onBuy={() => openPack('premium')}
            />
          </div>
        </div>
      )}

      {/* Pack Result */}
      {view === 'result' && packResult && (
        <div>
          <h2 style={{ color: '#ffd700', marginBottom: 8 }}>Pack Opened!</h2>
          <p style={{ color: '#888', marginBottom: 24 }}>{packResult.packSize} cards — {packResult.packType} pack</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {packResult.cards.map((card) => (
              <CardDisplay key={card.dna} card={card} />
            ))}
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button onClick={() => setView('store')} style={btnStyle('#4a7ab5')}>Buy More</button>
            <button onClick={loadCollection} style={btnStyle('#3a3a4a')}>View Collection</button>
          </div>
        </div>
      )}

      {/* Collection */}
      {view === 'collection' && (
        <div>
          <h2 style={{ color: '#ccc', marginBottom: 8 }}>My Cards ({collection.length})</h2>
          {collection.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <p>No cards yet. Buy a pack to get started!</p>
              <button onClick={() => setView('store')} style={btnStyle('#4a7ab5')}>Go to Pack Store</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {collection.map((card: any) => (
                <CardDisplay key={card.dna} card={card} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PackCard({ name, description, price, color, isLoading, onBuy }: {
  name: string; description: string; price: string; color: string; isLoading: boolean; onBuy: () => void;
}) {
  return (
    <div style={{
      background: '#12121e', border: `2px solid ${color}`, borderRadius: 12,
      padding: 24, width: 280, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <h3 style={{ color, margin: 0, fontSize: 20 }}>{name}</h3>
      <p style={{ color: '#999', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{description}</p>
      <div style={{ fontSize: 28, color: '#fff', fontWeight: 'bold' }}>{price}</div>
      <button onClick={onBuy} disabled={isLoading} style={{
        ...btnStyle(color),
        opacity: isLoading ? 0.6 : 1,
        cursor: isLoading ? 'wait' : 'pointer',
      }}>
        {isLoading ? 'Opening...' : 'Buy Pack'}
      </button>
    </div>
  );
}

function CardDisplay({ card }: { card: Card }) {
  const rarityColor = RARITY_COLORS[card.rarity] ?? '#888';
  const emoji = SPECIES_EMOJI[card.species] ?? '🃏';

  return (
    <div style={{
      background: '#12121e', border: `1px solid ${rarityColor}40`, borderRadius: 8,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 28, textAlign: 'center' }}>{emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#e0e0ee', textAlign: 'center' }}>{card.name}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: rarityColor, textTransform: 'uppercase', fontWeight: 'bold' }}>{card.rarity}</span>
        <span style={{ fontSize: 11, color: '#888' }}>{card.species}</span>
      </div>
      <div style={{ fontSize: 9, color: '#555', textAlign: 'center', fontFamily: 'monospace' }}>{card.dna.slice(0, 16)}...</div>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    background: color, color: '#fff', border: 'none', borderRadius: 8,
    padding: '12px 24px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
  };
}

function navStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? '#2a2a4a' : 'transparent', color: active ? '#fff' : '#888',
    border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
  };
}
