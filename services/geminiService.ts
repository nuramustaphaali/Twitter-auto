import { GoogleGenAI, Type } from "@google/genai";
import { Tone } from "../types";

// Initialize Gemini
// Note: In a real production app, never expose keys on the client like this if possible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = "gemini-2.5-flash";

export const generateTweetIdeas = async (
  interests: string[],
  language: string,
  tone: Tone,
  count: number = 3
): Promise<string[]> => {
  if (!interests.length) return ["Please add some interests to generate tweets."];

  const prompt = `
    You are an expert social media manager for Twitter (X).
    Generate ${count} distinct, engaging tweets based on the following parameters:
    
    Topics: ${interests.join(", ")}
    Language: ${language}
    Tone: ${tone}
    
    Constraints:
    - Maximum 280 characters per tweet.
    - Include 1-2 relevant hashtags.
    - Do not use emojis excessively, keep it cleaner.
    - Return ONLY a JSON array of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from AI");

    return JSON.parse(jsonStr) as string[];
  } catch (error) {
    console.error("Error generating tweets:", error);
    // Return mock data if API fails so the app remains "functioning" for the user
    return [
      `Could not connect to AI: ${error instanceof Error ? error.message : "Unknown error"}. Check API Key.`,
      `Here is a sample tweet about ${interests[0] || 'tech'} generated locally as fallback.`,
    ];
  }
};

export const generateAutoTweet = async (
  interests: string[],
  language: string,
  tone: Tone
): Promise<string> => {
  if (!interests.length) return "I need interests to generate a tweet!";

  // Select a random topic from interests to keep it focused
  const randomInterest = interests[Math.floor(Math.random() * interests.length)];

  const prompt = `
    Write ONE engaging Twitter post about "${randomInterest}".
    Language: ${language}
    Tone: ${tone}
    Context: This is an automated post for a professional feed.
    Constraints: Under 280 chars. 1 hashtag. No hashtags in the beginning.
    Return ONLY the raw text of the tweet.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text?.trim() || `Checking out the latest in ${randomInterest}!`;
  } catch (error) {
    console.error("Auto-pilot error:", error);
    return `Excited to learn more about ${randomInterest}! #learning`;
  }
};