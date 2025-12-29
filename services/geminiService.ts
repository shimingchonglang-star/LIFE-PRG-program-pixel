
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getDailyMotivation(hp: number, hunger: number) {
  try {
    const prompt = `Act as a retro RPG game narrator. The player has ${hp}/10 HP and ${hunger}/10 Hunger. 
    Give a short, punchy (under 15 words) motivational message in the style of a 90s pixel RPG. 
    You can use Chinese, English, or French randomly, or stick to the player's apparent health state.
    Keep it dramatic and gamified.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text.trim().replace(/^"(.*)"$/, '$1'); // Remove wrapping quotes
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Adventure awaits, traveler!";
  }
}

export async function suggestNewQuest(existingQuests: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a new self-discipline daily quest for a Life RPG. 
      Existing quests: ${existingQuests.join(', ')}. 
      Return a JSON object with: title (all caps), hpImpact (integer -2 to 2), hungerImpact (integer -2 to 2), and an emoji icon.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hpImpact: { type: Type.INTEGER },
            hungerImpact: { type: Type.INTEGER },
            icon: { type: Type.STRING }
          },
          required: ["title", "hpImpact", "hungerImpact", "icon"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}
