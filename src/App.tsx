import { GameBoard } from './components/GameBoard';
import { GameInfo } from './components/GameInfo';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="game-layout">
        <GameBoard />
        <GameInfo />
      </div>
    </div>
  );
}

export default App;
