/**
 * Match history — persisted in localStorage.
 */

export interface MatchRecord {
  id: string;
  date: string;
  winner: 'playerA' | 'playerB';
  playerAVP: number;
  playerBVP: number;
  turns: number;
  defeats: number;
}

const STORAGE_KEY = 'summoners-grid-history';

export function getMatchHistory(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMatchResult(record: Omit<MatchRecord, 'id' | 'date'>): void {
  try {
    const history = getMatchHistory();
    history.push({
      ...record,
      id: `match-${Date.now()}`,
      date: new Date().toISOString(),
    });
    // Keep last 50 matches
    while (history.length > 50) history.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage not available
  }
}

export function getStats(): {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: string;
  avgTurns: string;
} {
  const history = getMatchHistory();
  const wins = history.filter(m => m.winner === 'playerA').length;
  const losses = history.length - wins;
  const avgTurns = history.length > 0
    ? (history.reduce((s, m) => s + m.turns, 0) / history.length).toFixed(1)
    : '0';
  const winRate = history.length > 0
    ? ((wins / history.length) * 100).toFixed(0) + '%'
    : 'N/A';

  return {
    totalGames: history.length,
    wins,
    losses,
    winRate,
    avgTurns,
  };
}
