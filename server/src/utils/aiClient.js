import {GoogleGenAI} from "@google/genai";
import dotenv from "dotenv";

dotenv.config({path: "../../config.env"});

const genAI = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});

export const model = genAI.models.generateContent({ 
    model: "gemini-2.5-flash",
    config: {
        responseMimeType: "application/json" 
    }
});

