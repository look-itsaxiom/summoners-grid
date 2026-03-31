import { useGameStore } from '../store/gameStore';
import './EffectStack.css';

export function EffectStack() {
  const { effectStack } = useGameStore();

  if (effectStack.length === 0) return null;

  return (
    <div className="effect-stack">
      <div className="stack-header">
        Effect Stack ({effectStack.length})
      </div>
      <div className="stack-entries">
        {[...effectStack].reverse().map((entry, i) => (
          <div
            key={entry.id}
            className={`stack-entry speed-${entry.speed} ${entry.resolved ? 'resolved' : ''}`}
          >
            <span className="stack-index">{effectStack.length - i}</span>
            <span className="stack-speed">{entry.speed.toUpperCase()}</span>
            <span className="stack-source">{entry.source.name}</span>
            <span className="stack-owner">{entry.sourceOwner === 'playerA' ? 'A' : 'B'}</span>
          </div>
        ))}
      </div>
      <div className="stack-hint">LIFO — Top resolves first</div>
    </div>
  );
}
