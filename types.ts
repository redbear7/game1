
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

export interface LeaderboardEntry {
  name: string;
  score: number;
  time: string;
  elapsedTime: number; // 정렬을 위한 밀리초 값
  level: number; // 도달한 레벨
  date: string;
}

export interface GameState {
  levels: LevelData[];
}
