
import { LevelData } from './types';

export const MIN_BPM = 60;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 182; 
export const DEFAULT_AUDIO_URL = 'https://pixabay.com/music/download/upbeat-rhythmic-percussion-222855.mp3';

const createInitialCards = (levelId: number): any[] => {
  const isOdd = levelId % 2 !== 0;
  // 홀수 레벨: 할렐루야 할렐루야 (8칸)
  // 짝수 레벨: 기본 리듬 단어 세트 (8칸)
  const words = isOdd 
    ? ['할', '렐', '루', '야', '할', '렐', '루', '야']
    : ['리', '듬', '파', '워', '액', '션', '성', '공'];
  
  return words.map((word, index) => ({
    id: `${levelId}-${index + 1}`,
    word,
    description: isOdd ? 'PRAISE' : 'RHYTHM'
  }));
};

export const INITIAL_GAME_DATA: LevelData[] = Array.from({ length: 9 }, (_, i) => {
  const levelId = i + 1;
  const isOdd = levelId % 2 !== 0;
  return {
    id: levelId,
    theme: isOdd ? '할렐루야' : `도전 스테이지 ${levelId}`,
    bpm: DEFAULT_BPM,
    cards: createInitialCards(levelId),
  };
});

export const SYSTEM_INSTRUCTION = `
당신은 리듬 게임 스테이지 기획자입니다.
주제를 받으면 9개 레벨의 데이터를 생성하십시오.
[필수 규칙]
1. 각 레벨은 'cards' 배열에 8개의 객체를 가져야 합니다.
2. 'word'는 반드시 한글 '딱 2글자'여야 합니다.
3. 사용자가 어떤 주제를 주든, 당신은 9개 레벨 모두를 생성하되, 시스템에서 짝수 레벨(2, 4, 6, 8)의 데이터를 중점적으로 활용할 것임을 인지하십시오.
4. JSON 형식만 출력하십시오.
`;
