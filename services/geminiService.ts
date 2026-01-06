
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

export const generateThemedCards = async (theme: string) => {
  // 로컬 스토리지에 저장된 키를 먼저 확인
  const savedKey = localStorage.getItem('GEMINI_USER_API_KEY');
  const apiKey = savedKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY가 설정되지 않았습니다. 설정에서 키를 입력해주세요.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `주제: ${theme}와 관련된 총 9개 레벨의 리듬 게임 콘텐츠 생성. 각 레벨당 한글 2글자 단어 8개씩.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          levels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                theme: { type: Type.STRING },
                cards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      word: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["id", "word"]
                  }
                }
              },
              required: ["id", "theme", "cards"]
            }
          }
        },
        required: ["levels"]
      }
    }
  });

  return JSON.parse(response.text);
};
