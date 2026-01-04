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


export const writeResumeContent = async (userResumeJson, jobDescriptionText, auditResults) => {
    console.log("---Agent B (Writer) Starting---");

    //1. Prompt
    const prompt = `
        You are an expert Resume Strategist.
        
        TASK:
        Rewrite the user's experience and skills to target a specific Job Description (JD), 
        based on the Audit Report provided.

        INPUTS:
        1. USER DATA: ${JSON.stringify(userResumeJson)}
        2. JD CONTEXT: "${jobDescriptionText}"
        3. AUDIT REPORT: ${JSON.stringify(auditResults)}

        INSTRUCTIONS:
        - **Experience Section:** Rewrite bullet points to use keywords from the JD where the user actually has the experience. 
        - **Action Verbs:** Start every bullet with strong verbs (Engineered, Deployed, Spearheaded).
        - **Honesty:** Do NOT add skills listed in the Audit Report as "missing".
        - **Formatting:** Return the content as structured JSON strings suitable for a resume.

        OUTPUT FORMAT (JSON):
        {
        "experience_content": "A raw string containing the rewritten experience section. Use LaTeX formatting only for bolding (e.g. \\textbf{Role}). Do not use bullet points here, just the text content grouped by role.",
        "skills_content": "A comma-separated string of the user's top technical skills, prioritizing those found in the 'Strong Matches' list."
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        //console.log("Response from auditor.js:", response);
        
        // Extract the text from the response
        const analysisText = response.text;
        const analysisJson = JSON.parse(analysisText);

        console.log("---Agent B Finished---");
        return analysisJson;

    } catch (error) {
        console.error("Agent B Error: ", error);
        throw new Error("Writer Agent failed.");
    }
};
