import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with your key from Google AI Studio
const genAI = new GoogleGenerativeAI('AIzaSyAPN3vrKwf3sfasnXy5sotm3ejXa7oqfUY');

export const processWorkoutVoiceInput = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Extract exercise name, sets, and weight from this sentence and return ONLY a JSON object: {exercise: string, sets: number, weight: number}. Sentence: "${text}"`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textRes = response.text();
    
    // Clean up potential markdown formatting from the response
    const jsonStr = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error processing voice input with Gemini:', error);
    return null;
  }
};

export const processMealImage = async (base64Image) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const prompt = "Analyze this meal image and estimate calories and macros (protein, carbs, fats). Return ONLY a JSON object: {food_name: string, calories: number, protein: number, carbs: number, fats: number}";
    
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const textRes = response.text();
    
    const jsonStr = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error processing meal image with Gemini:', error);
    return null;
  }
};
