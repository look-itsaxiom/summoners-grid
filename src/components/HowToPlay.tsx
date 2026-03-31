import './HowToPlay.css';

interface HowToPlayProps {
  onClose: () => void;
}

export function HowToPlay({ onClose }: HowToPlayProps) {
  return (
    <div className="htp-overlay" onClick={onClose}>
      <div className="htp-panel" onClick={e => e.stopPropagation()}>
        <button className="htp-close" onClick={onClose}>X</button>
        <h2>How to Play</h2>

        <div className="htp-sections">
          <div className="htp-section">
            <h3>Objective</h3>
            <p>First player to <strong>3 Victory Points</strong> wins. Earn VP by defeating enemy summons (1 VP for Tier 1, 2 VP for Tier 2+).</p>
          </div>

          <div className="htp-section">
            <h3>Turn Structure</h3>
            <div className="htp-phases">
              <div className="htp-phase">
                <span className="phase-num">1</span>
                <strong>Draw</strong> — Draw 1 card
              </div>
              <div className="htp-phase">
                <span className="phase-num">2</span>
                <strong>Level</strong> — All your summons gain 1 level
              </div>
              <div className="htp-phase">
                <span className="phase-num">3</span>
                <strong>Action</strong> — Play cards, move, and attack
              </div>
              <div className="htp-phase">
                <span className="phase-num">4</span>
                <strong>End</strong> — Discard to hand limit (6), pass turn
              </div>
            </div>
          </div>

          <div className="htp-section">
            <h3>Actions</h3>
            <ul>
              <li><strong>Play Summon:</strong> Click a summon card, then click your territory (green cells). Draws 3 cards. One per turn.</li>
              <li><strong>Move:</strong> Click your summon on the board, then click a blue highlighted cell.</li>
              <li><strong>Attack:</strong> Click your summon, then click a red highlighted enemy in weapon range.</li>
              <li><strong>Play Card:</strong> Click an action card, then click a valid target (gold highlight = ally, red = enemy).</li>
              <li><strong>Advance:</strong> When advance cards glow gold, click them, then click the eligible summon (purple).</li>
              <li><strong>Building:</strong> Click a building card, then click where to place it on the board.</li>
            </ul>
          </div>

          <div className="htp-section">
            <h3>Key Mechanics</h3>
            <ul>
              <li><strong>Summons enter at Level 5</strong>, max level 20</li>
              <li><strong>HP Damage Retention:</strong> When leveling up, damage stays the same (HP increases)</li>
              <li><strong>Role Advancement:</strong> Use advance cards to upgrade summons to powerful Tier 2/3 roles (27 roles across 3 families)</li>
              <li><strong>Elemental Advantages:</strong> Fire &gt; Wind &gt; Earth &gt; Water &gt; Fire. Light &lt;&gt; Dark. 1.25x damage bonus.</li>
              <li><strong>Counter Cards:</strong> Set face-down, trigger automatically (e.g., revive defeated summon)</li>
              <li><strong>Territory Control:</strong> Occupy undefended enemy territory for 1 VP per turn</li>
              <li><strong>Buildings:</strong> Place on board for ongoing effects (Gignen Country = double level-ups, Healing Spring = heal each turn)</li>
              <li><strong>Named Summons:</strong> Transform advanced summons into unique heroes with special abilities</li>
            </ul>
          </div>

          <div className="htp-section">
            <h3>Game Content</h3>
            <ul>
              <li>30 action cards, 5 buildings, 6 quests, 5 counters, 3 reactions</li>
              <li>14 advance cards (3 named summons with unique actions)</li>
              <li>7 species, 27 roles, 5 rarities, 7 elements</li>
              <li>6 weapons, 4 armor sets, 4 accessories</li>
            </ul>
          </div>

          <div className="htp-section">
            <h3>Controls</h3>
            <ul>
              <li><strong>[1-9]</strong> Select card from hand</li>
              <li><strong>[E]</strong> End turn</li>
              <li><strong>[Esc]</strong> Deselect</li>
              <li><strong>Right-click</strong> card to inspect full details</li>
            </ul>
          </div>
        </div>

        <button className="htp-got-it" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
}
