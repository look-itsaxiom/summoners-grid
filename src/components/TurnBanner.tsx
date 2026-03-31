import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import './TurnBanner.css';

export function TurnBanner() {
  const { turnNumber, activePlayer, phase } = useGameStore();
  const [visible, setVisible] = useState(false);
  const [displayTurn, setDisplayTurn] = useState(0);
  const [displayPlayer, setDisplayPlayer] = useState('');

  useEffect(() => {
    if (phase === 'draw') {
      setDisplayTurn(turnNumber);
      setDisplayPlayer(activePlayer === 'playerA' ? 'Your Turn' : "AI's Turn");
      setVisible(true);

      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [turnNumber, activePlayer, phase]);

  if (!visible) return null;

  return (
    <div className={`turn-banner ${activePlayer === 'playerA' ? 'banner-player' : 'banner-ai'}`}>
      <div className="banner-turn">Turn {displayTurn}</div>
      <div className="banner-who">{displayPlayer}</div>
    </div>
  );
}
