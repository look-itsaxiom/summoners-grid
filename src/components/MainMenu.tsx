import './MainMenu.css';

interface MainMenuProps {
  onStartGame: () => void;
}

export function MainMenu({ onStartGame }: MainMenuProps) {
  return (
    <div className="main-menu">
      <div className="menu-backdrop" />
      <div className="menu-content">
        <div className="game-title">
          <h1>Summoner's Grid</h1>
          <p className="subtitle">Tactical Grid-Based RPG Card Game</p>
        </div>

        <div className="menu-info">
          <div className="info-block">
            <h3>3v3 Tactical Combat</h3>
            <p>Field 3 summons on a 12x14 grid battlefield</p>
          </div>
          <div className="info-block">
            <h3>Deep Strategy</h3>
            <p>Role advancement, equipment, and stack-based effects</p>
          </div>
          <div className="info-block">
            <h3>First to 3 VP</h3>
            <p>Defeat summons and control territory to win</p>
          </div>
        </div>

        <button className="play-button" onClick={onStartGame}>
          Play vs AI
        </button>

        <div className="version-info">
          Alpha Build — Summoner's Grid
        </div>
      </div>
    </div>
  );
}
