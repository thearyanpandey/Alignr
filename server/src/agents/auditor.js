import {GoogleGenAI} from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../config.env") });

// Debug: Check if API key is loaded
console.log("API Key loaded:", !!process.env.GOOGLE_API_KEY);
console.log("First 10 chars:", process.env.GOOGLE_API_KEY?.substring(0, 10));

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});


export const analyzeFit = async (userResumeJson, jobDescriptionText) => {
    console.log("---Agent A (Auditor) Starting---");

    //1. Prompt
    const prompt = `
    You are an expert Technical Recruiter and ATS Auditor.
    
    TASK:
    Analyze the provided User Resume against the Job Description (JD).
    Identify matches, weak matches, and critical skill gaps.

    INPUT DATA:
    1. USER RESUME (JSON): ${JSON.stringify(userResumeJson)}
    2. JOB DESCRIPTION: "${jobDescriptionText}"

    RULES:
    - Be strict. Do not assume the user knows "React" just because they know "JavaScript".
    - "Strong Match": Explicit evidence found in resume.
    - "Weak Match": Related tool found (e.g., User knows MySQL, JD asks for PostgreSQL).
    - "Gap": Required skill completely missing.

    OUTPUT FORMAT (JSON):
    {
      "analysis": {
        "strong_matches": ["skill1", "skill2"],
        "weak_matches": [{"skill": "JD_Skill", "reason": "User has X which is similar"}],
        "missing_critical_skills": ["skill3"],
        "summary_of_fit": "A brief 2-sentence summary of how well they fit."
      }
    }`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        console.log("Response from auditor.js:", response);
        
        // Extract the text from the response
        const analysisText = response.text;
        const analysisJson = JSON.parse(analysisText);

        console.log("---Agent A Finished---");
        return analysisJson;

    } catch (error) {
        console.error("Agent A Error: ", error);
        throw new Error("Auditor Agent failed to analyze data.");
    }
};
