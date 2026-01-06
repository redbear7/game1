
import { LevelData } from './types';

export const MIN_BPM = 60;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 182; 
export const DEFAULT_AUDIO_URL = 'https://pixabay.com/music/download/upbeat-rhythmic-percussion-222855.mp3'; // 샘플 비트 음원

const createInitialCards = (levelId: number): any[] => {
  const isOdd = levelId % 2 !== 0;
  const words = isOdd 
    ? ['할', '렐', '루', '야', '할', '렐', '루', '야']
    : ['준비', '시작', '박자', '리듬', '집중', '도전', '성공', '최고'];
  
  return words.map((word, index) => ({
    id: String(index + 1),
    word,
    description: isOdd ? 'Praise' : 'Basic'
  }));
};

export const INITIAL_GAME_DATA: LevelData[] = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  theme: `레벨 ${i + 1}`,
  bpm: DEFAULT_BPM,
  cards: createInitialCards(i + 1),
}));

export const SYSTEM_INSTRUCTION = `
당신은 리듬 게임의 전체 스테이지 생성기입니다.
하나의 큰 주제를 받으면, 그와 관련된 9개의 레벨(스테이지) 데이터를 생성하십시오.
각 레벨은 주제의 하위 카테고리나 발전된 형태의 테마를 가집니다.
각 레벨마다 '한글 2글자' 단어 8개를 생성하십시오.
설명은 아주 짧게 5자 이내로 작성하십시오.
반드시 다음 JSON 형식을 유지하십시오:
{
  "levels": [
    {
      "id": 1,
      "theme": "레벨 테마 이름",
      "cards": [
        { "id": "1", "word": "단어", "description": "설명" }
      ]
    },
    ... 총 9개의 레벨 객체
  ]
}
`;
