
export interface GameCard {
  id: string;
  word: string;
  description?: string;
}

export interface LevelData {
  id: number;
  theme: string;
  bpm: number;
  cards: GameCard[];
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
}

export interface GameState {
  levels: LevelData[];
}

// Added missing interface to fix the error in Leaderboard.tsx
export interface LeaderboardEntry {
  name: string;
  time: string;
  level: number;
}
