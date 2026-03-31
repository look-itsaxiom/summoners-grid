import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { SFX } from '../engine/sound';
import './CombatOverlay.css';

interface CombatEvent {
  id: number;
  message: string;
  type: 'damage' | 'heal' | 'miss' | 'crit' | 'defeat' | 'vp' | 'info';
  timestamp: number;
}

let eventCounter = 0;

export function CombatOverlay() {
  const [events, setEvents] = useState<CombatEvent[]>([]);
  const log = useGameStore(s => s.log);

  useEffect(() => {
    if (log.length === 0) return;

    const lastEntry = log[log.length - 1];
    const msg = lastEntry.message;

    let type: CombatEvent['type'] = 'info';
    if (msg.includes('damage') || msg.includes('Deals')) type = 'damage';
    else if (msg.includes('heal') || msg.includes('Heal')) type = 'heal';
    else if (msg.includes('missed') || msg.includes('Miss')) type = 'miss';
    else if (msg.includes('CRITICAL')) type = 'crit';
    else if (msg.includes('defeated')) type = 'defeat';
    else if (msg.includes('VP') || msg.includes('wins')) type = 'vp';

    // Play sound effects based on event type
    if (type === 'damage') SFX.attackHit();
    else if (type === 'heal') SFX.heal();
    else if (type === 'miss') SFX.attackMiss();
    else if (type === 'crit') SFX.criticalHit();
    else if (type === 'defeat') SFX.defeat();
    else if (type === 'vp') SFX.vpGain();
    else if (msg.includes('levels up')) SFX.levelUp();
    else if (msg.includes('Played ')) SFX.cardPlay();
    else if (msg.includes('activates face-down')) SFX.counterTrigger();

    // Only show combat-relevant events
    if (type === 'info' && !msg.includes('attacks') && !msg.includes('levels up')) return;

    const event: CombatEvent = {
      id: ++eventCounter,
      message: msg,
      type,
      timestamp: Date.now(),
    };

    setEvents(prev => [...prev.slice(-4), event]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== event.id));
    }, 3000);
  }, [log.length]);

  if (events.length === 0) return null;

  return (
    <div className="combat-overlay">
      {events.map(event => (
        <div key={event.id} className={`combat-event combat-${event.type}`}>
          {event.message}
        </div>
      ))}
    </div>
  );
}
