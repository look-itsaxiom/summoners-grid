import { useState } from 'react';
import './DevProgress.css';

interface ProgressItem {
  category: string;
  label: string;
  status: 'done' | 'in-progress' | 'todo';
  detail?: string;
}

const PROGRESS: ProgressItem[] = [
  // ─── CORRECTNESS (every formula and mechanic verified) ───
  { category: 'Correctness', label: 'Stat calculation formulas', status: 'done', detail: '31 tests against Play Example' },
  { category: 'Correctness', label: 'Damage formulas (melee/ranged/magic/heal)', status: 'done', detail: 'Turn 2 Blast Bolt=52, Turn 5 Berserker=326' },
  { category: 'Correctness', label: 'HP Damage Retention on level-up', status: 'done', detail: 'Turn 3: 44/96 → 50/102 verified' },
  { category: 'Correctness', label: 'Elemental advantage cycle', status: 'done', detail: '12 tests: Fire>Wind>Earth>Water>Fire, Light<>Dark' },
  { category: 'Correctness', label: 'Critical hit chance formula', status: 'done', detail: 'LCK=13→6%, LCK=22→9%, LCK=33→12%' },
  { category: 'Correctness', label: 'Growth rate values (6 tiers)', status: 'done', detail: 'Minimal=0.5 through Exceptional=2.0' },
  { category: 'Correctness', label: 'Role system (27 roles, convergence)', status: 'done', detail: '8 role tests: tier structure, multi-path' },
  { category: 'Correctness', label: 'Species stat ranges (7 species)', status: 'done', detail: '8 species tests: ranges match GDD' },
  { category: 'Correctness', label: 'VP awards (Tier 1=1VP, Tier 2+=2VP)', status: 'done', detail: 'Tested in mechanics suite' },
  { category: 'Correctness', label: 'Territory control VP', status: 'done', detail: 'End-of-turn check implemented + tested' },
  { category: 'Correctness', label: 'Turn structure (draw skip T1, hand limit)', status: 'done', detail: '12 mechanics tests' },
  { category: 'Correctness', label: 'Card play: Sharpened Blade +10 WP', status: 'done', detail: 'Scenario test: 30→40 verified' },
  { category: 'Correctness', label: 'Counter/reaction trigger system', status: 'done', detail: 'Dramatic Return, Graverobbing, face-down' },
  { category: 'Correctness', label: 'Quest completion + level rewards', status: 'done', detail: 'Nearwood Forest: +2 levels verified' },
  { category: 'Correctness', label: 'Role advancement stat recalculation', status: 'done', detail: 'Warrior→Berserker: STR increases' },
  { category: 'Correctness', label: 'AI vs AI games complete without crashes', status: 'done', detail: '8 integration tests + 3 balance tests' },
  { category: 'Correctness', label: 'Effect stack (LIFO)', status: 'done', detail: '8 tests: LIFO order, speed lock, counter>reaction>action' },

  // ─── DNA / BLOCKCHAIN INFRASTRUCTURE ───
  { category: 'Infrastructure', label: 'Card DNA system (128-bit hex)', status: 'done', detail: '17 DNA tests, round-trip verified' },
  { category: 'Infrastructure', label: 'DNA → SummonCard reconstruction', status: 'done', detail: 'Same DNA = same card, 50-card batch test' },
  { category: 'Infrastructure', label: 'DNA → NFT metadata (ERC-721)', status: 'done', detail: '10 metadata tests, Immutable compatible' },
  { category: 'Infrastructure', label: 'DNA → Art prompt (ComfyUI)', status: 'done', detail: '10 prompt tests, species/rarity/equipment' },
  { category: 'Infrastructure', label: 'DNA → Sprite prompt', status: 'done', detail: 'Pixel art prompt builder' },
  { category: 'Infrastructure', label: 'DNA validation + checksum', status: 'done', detail: 'Rejects corrupted DNA' },
  { category: 'Infrastructure', label: 'Platform GDD document', status: 'done', detail: '532 lines: DNA, NFT, marketplace, AI art spec' },
  { category: 'Infrastructure', label: 'Next.js API routes', status: 'done', detail: 'Health, pack open, card lookup — tested live' },
  { category: 'Infrastructure', label: 'Client API service', status: 'done', detail: 'api.ts with health/openPack/lookupCard' },
  { category: 'Infrastructure', label: 'Server-backed pack opening', status: 'done', detail: 'Toggle in UI, fallback to local' },
  { category: 'Infrastructure', label: 'DNA Viewer component', status: 'done', detail: '4-tab viewer: card, DNA, NFT metadata, art prompt' },
  { category: 'Infrastructure', label: 'Immutable Passport auth', status: 'in-progress', detail: '@imtbl/sdk installed, passport service + useAuth hook + LoginButton' },
  { category: 'Infrastructure', label: 'ERC-721 contract deployment', status: 'todo', detail: 'Phase 4: deploy on Immutable testnet' },
  { category: 'Infrastructure', label: 'NFT minting on pack open', status: 'todo', detail: 'Phase 4: Immutable Minting API integration' },
  { category: 'Infrastructure', label: 'Ownership verification (Indexer)', status: 'todo', detail: 'Phase 5: query owned NFTs' },
  { category: 'Infrastructure', label: 'Deck builder from owned NFTs', status: 'todo', detail: 'Phase 5: select cards you own' },
  { category: 'Infrastructure', label: 'ComfyUI art pipeline (home.skib)', status: 'in-progress', detail: 'ComfyUI connected (RTX 4070), API routes built, IPFS pending' },
  { category: 'Infrastructure', label: 'Marketplace / Auction House', status: 'todo', detail: 'Phase 7: Immutable Orderbook' },

  // ─── GAME CONTENT & POLISH ───
  { category: 'Content', label: '30 action cards', status: 'done' },
  { category: 'Content', label: '5 building cards', status: 'done' },
  { category: 'Content', label: '6 quest cards (2 grant VP)', status: 'done' },
  { category: 'Content', label: '5 counter cards + 3 reaction cards', status: 'done' },
  { category: 'Content', label: '14 advance cards (3 named summons)', status: 'done' },
  { category: 'Content', label: '14 equipment (6 wpn + 4 armor + 4 acc)', status: 'done' },
  { category: 'Content', label: '14 procedural SFX (Web Audio)', status: 'done' },
  { category: 'Content', label: 'Keyboard shortcuts (1-9, E, Esc)', status: 'done' },
  { category: 'Content', label: 'Color blind mode', status: 'done' },
  { category: 'Content', label: 'Card inspector (right-click)', status: 'done' },
  { category: 'Content', label: 'Match history (localStorage)', status: 'done' },
  { category: 'Content', label: 'Save/load game', status: 'done' },
  { category: 'Content', label: 'Screen shake on crits', status: 'done' },
  { category: 'Content', label: 'Floating damage numbers', status: 'done' },
  { category: 'Content', label: 'SVG minimap', status: 'done' },
  { category: 'Content', label: 'Turn transition banners', status: 'done' },
  { category: 'Content', label: 'Spectator mode + speed control', status: 'done' },
  { category: 'Content', label: 'Tutorial / How to Play', status: 'done' },
  { category: 'Content', label: 'Coin flip turn order', status: 'done' },
  { category: 'Content', label: 'Deck preview screen', status: 'done' },
  { category: 'Content', label: 'SEO meta tags', status: 'done' },
  { category: 'Content', label: 'Persistent settings', status: 'done' },
  { category: 'Content', label: 'Weapon range visualization', status: 'done' },
];

export function DevProgress() {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'done' | 'in-progress' | 'todo'>('all');

  const filtered = filter === 'all' ? PROGRESS : PROGRESS.filter(p => p.status === filter);
  const doneCount = PROGRESS.filter(p => p.status === 'done').length;
  const ipCount = PROGRESS.filter(p => p.status === 'in-progress').length;
  const todoCount = PROGRESS.filter(p => p.status === 'todo').length;
  const total = PROGRESS.length;
  const pct = Math.round((doneCount / total) * 100);

  if (!expanded) {
    return (
      <button className="dp-toggle" onClick={() => setExpanded(true)}>
        Progress: {doneCount}/{total} ({pct}%)
      </button>
    );
  }

  const categories = [...new Set(PROGRESS.map(p => p.category))];

  return (
    <div className="dp-panel">
      <div className="dp-header">
        <h3>Development Progress</h3>
        <button className="dp-close" onClick={() => setExpanded(false)}>X</button>
      </div>

      <div className="dp-summary">
        <span className="dp-done">{doneCount} done</span>
        <span className="dp-ip">{ipCount} in progress</span>
        <span className="dp-todo">{todoCount} todo</span>
        <div className="dp-bar">
          <div className="dp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="dp-pct">{pct}%</span>
      </div>

      <div className="dp-filters">
        {(['all', 'done', 'in-progress', 'todo'] as const).map(f => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="dp-list">
        {categories.map(cat => {
          const items = filtered.filter(p => p.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="dp-category">
              <div className="dp-cat-name">{cat}</div>
              {items.map((item, i) => (
                <div key={i} className={`dp-item dp-${item.status}`}>
                  <span className="dp-icon">
                    {item.status === 'done' ? '✓' : item.status === 'in-progress' ? '◑' : '○'}
                  </span>
                  <span className="dp-label">{item.label}</span>
                  {item.detail && <span className="dp-detail">{item.detail}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
