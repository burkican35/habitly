
import { GoogleGenAI, Type } from "@google/genai";
import { Habit } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHabitInsights = async (habit: Habit): Promise<any> => {
  try {
    const logsDescription = habit.logs
      .slice(-10)
      .map(log => `${log.date}: ${log.value} ${habit.unit}`)
      .join(', ');

    const prompt = `Analyze this habit tracking data for "${habit.name}". 
    Unit: ${habit.unit}. Recent logs: ${logsDescription || 'No logs yet'}.
    Provide a brief motivational summary and a trend analysis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            motivation: { type: Type.STRING },
            trend: { type: Type.STRING, enum: ['up', 'down', 'stable'] },
          },
          required: ['summary', 'motivation', 'trend'],
        },
      },
    });

    // The GenerateContentResponse object features a text property that directly returns the string output.
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error fetching insights:", error);
    return {
      summary: "Keep pushing forward on your journey.",
      motivation: "Consistency is the key to building any lasting habit.",
      trend: "stable"
    };
  }
};
