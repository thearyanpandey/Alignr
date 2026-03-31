import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

//Enviroment 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path: path.resolve(__dirname, "../../config.env")});

console.log("API KEY LODED:", !!process.env.GOOGLE_API_KEY);

//Gemini Client
const geminiClient = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

export const generateWithGemini = async (prompt, modelName = "gemini-3-flash-preview") => {
    try{
        const response = await geminiClient.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json" 
            }
        });

        return response.text;
    } catch (error){
        console.error(`Gemini API Error [${modelName}]:`, error);
        throw error;
    }
};