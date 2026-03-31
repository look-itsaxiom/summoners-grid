import { useState } from 'react';
import './CoinFlip.css';

interface CoinFlipProps {
  onChoose: (goFirst: boolean) => void;
}

export function CoinFlip({ onChoose }: CoinFlipProps) {
  const [phase, setPhase] = useState<'call' | 'flipping' | 'result'>('call');
  const [playerCall, setPlayerCall] = useState<'heads' | 'tails' | null>(null);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [won, setWon] = useState<boolean | null>(null);

  const handleCall = (call: 'heads' | 'tails') => {
    setPlayerCall(call);
    setPhase('flipping');

    // Animate flip
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
    setTimeout(() => {
      setResult(flipResult);
      setWon(call === flipResult);
      setPhase('result');
    }, 1500);
  };

  return (
    <div className="coin-flip-overlay">
      <div className="coin-flip-panel">
        {phase === 'call' && (
          <>
            <h2>Coin Flip</h2>
            <p className="flip-desc">Call the coin to decide who goes first.</p>
            <div className="coin-visual">
              <div className="coin idle">?</div>
            </div>
            <div className="call-buttons">
              <button className="call-btn heads" onClick={() => handleCall('heads')}>
                Heads
              </button>
              <button className="call-btn tails" onClick={() => handleCall('tails')}>
                Tails
              </button>
            </div>
          </>
        )}

        {phase === 'flipping' && (
          <>
            <h2>Flipping...</h2>
            <div className="coin-visual">
              <div className="coin spinning">?</div>
            </div>
            <p className="flip-call">You called: {playerCall}</p>
          </>
        )}

        {phase === 'result' && (
          <>
            <h2 className={won ? 'win-text' : 'lose-text'}>
              {result === 'heads' ? 'Heads' : 'Tails'}!
            </h2>
            <div className="coin-visual">
              <div className={`coin landed ${result}`}>
                {result === 'heads' ? 'H' : 'T'}
              </div>
            </div>
            {won ? (
              <div className="result-section">
                <p className="result-text win">You won the flip!</p>
                <p className="choose-desc">Do you want to go first or second?</p>
                <div className="order-buttons">
                  <button className="order-btn first" onClick={() => onChoose(true)}>
                    Go First
                  </button>
                  <button className="order-btn second" onClick={() => onChoose(false)}>
                    Go Second
                  </button>
                </div>
              </div>
            ) : (
              <div className="result-section">
                <p className="result-text lose">AI won the flip!</p>
                <p className="choose-desc">AI chooses to go first.</p>
                <button className="order-btn continue" onClick={() => onChoose(false)}>
                  Continue
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
