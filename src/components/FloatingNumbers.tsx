import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import './FloatingNumbers.css';

interface FloatingNumber {
  id: number;
  value: string;
  type: 'damage' | 'heal' | 'crit' | 'miss' | 'levelup';
  x: number;
  y: number;
}

let numCounter = 0;

export function FloatingNumbers() {
  const [numbers, setNumbers] = useState<FloatingNumber[]>([]);
  const log = useGameStore(s => s.log);
  const board = useGameStore(s => s.board);

  useEffect(() => {
    if (log.length === 0) return;
    const msg = log[log.length - 1].message;

    // Extract damage numbers
    const damageMatch = msg.match(/Deals (\d+) damage/);
    const healMatch = msg.match(/heals (\d+) HP/);
    const critMatch = msg.includes('CRITICAL');
    const missMatch = msg.includes('missed') || msg.includes('Miss');
    const levelMatch = msg.match(/levels up.*?(\d+) → (\d+)/);

    if (!damageMatch && !healMatch && !missMatch && !levelMatch) return;

    // Try to find relevant unit position on the board
    // Use a roughly centered position as fallback
    let x = 300 + Math.random() * 100;
    let y = 200 + Math.random() * 50;

    // Try to find the target unit from the message
    for (const unit of board.summons) {
      if (msg.includes(unit.card.name)) {
        // Convert board position to approximate screen position
        x = 50 + unit.position.x * 50;
        y = 50 + (13 - unit.position.y) * 50;
        break;
      }
    }

    let value = '';
    let type: FloatingNumber['type'] = 'damage';

    if (critMatch && damageMatch) {
      value = `CRIT! -${damageMatch[1]}`;
      type = 'crit';
    } else if (damageMatch) {
      value = `-${damageMatch[1]}`;
      type = 'damage';
    } else if (healMatch) {
      value = `+${healMatch[1]}`;
      type = 'heal';
    } else if (missMatch) {
      value = 'MISS';
      type = 'miss';
    } else if (levelMatch) {
      value = `Lv${levelMatch[2]}!`;
      type = 'levelup';
    }

    if (!value) return;

    const num: FloatingNumber = {
      id: ++numCounter,
      value,
      type,
      x: x + (Math.random() - 0.5) * 20,
      y,
    };

    setNumbers(prev => [...prev.slice(-6), num]);

    setTimeout(() => {
      setNumbers(prev => prev.filter(n => n.id !== num.id));
    }, 1200);
  }, [log.length]);

  return (
    <div className="floating-numbers">
      {numbers.map(num => (
        <div
          key={num.id}
          className={`float-num float-${num.type}`}
          style={{ left: num.x, top: num.y }}
        >
          {num.value}
        </div>
      ))}
    </div>
  );
}
