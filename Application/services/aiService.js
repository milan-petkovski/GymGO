import { GoogleGenerativeAI } from '@google/generative-ai';
import { Constants } from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.googleAiApiKey;
let genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Security Helper: Validate and sanitize JSON from AI
const safeParseAIJSON = (text, schema) => {
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);
    // Basic structural validation
    const isValid = Object.keys(schema).every(key => typeof data[key] === typeof schema[key]);
    return isValid ? data : null;
  } catch { return null; }
};

export const processWorkoutVoiceInput = async (text) => {
  if (!genAI || !text) return null;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    // Sanitize user input by escaping quotes to prevent prompt breaking
    const sanitizedText = text.replace(/"/g, '\\"');
    const prompt = `System: You are a structured data extractor. 
    User sentence: "${sanitizedText}"
    Instruction: Return ONLY a JSON object: {exercise: string, sets: number, weight: number}.`;

    const result = await model.generateContent(prompt);
    return safeParseAIJSON(result.response.text(), { exercise: '', sets: 0, weight: 0 });
  } catch (error) {
    return null; // Silent fail in production
  }
};

export const processMealImage = async (base64Image) => {
  if (!genAI || !base64Image) return null;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const prompt = "Instruction: Analyze this meal. Return ONLY a JSON object: {food_name: string, calories: number, protein: number, carbs: number, fats: number}";

    const imageParts = [{ inlineData: { data: base64Image, mimeType: "image/jpeg" } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    return safeParseAIJSON(result.response.text(), { food_name: '', calories: 0, protein: 0, carbs: 0, fats: 0 });
  } catch (error) {
    return null;
  }
};
