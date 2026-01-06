
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Updated to strictly follow @google/genai guidelines for API key and model selection
export const generateThemedCards = async (theme: string) => {
  // Use process.env.API_KEY exclusively as per requirements
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    // Using gemini-3-pro-preview for complex reasoning and structured data tasks
    model: "gemini-3-pro-preview",
    contents: `주제: "${theme}". 반드시 모든 단어를 '2글자' 한글로 구성된 총 9개 레벨의 데이터를 생성하세요.`,
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

  // Extract text property directly from GenerateContentResponse
  return JSON.parse(response.text || '{}');
};
