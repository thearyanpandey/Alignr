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
    console.log("---Agent B (Curator & Writer) Starting---");

    //1. Prompt
    const prompt = `
    You are an expert Resume Strategist.
    
    GOAL: 
    Create a highly tailored, 1-page technical resume for the provided Job Description (JD).
    
    CRITICAL INSTRUCTIONS:
    1. **Selection Strategy:** - You MUST fill 1 full page. 
    - Select the top 4-5 items from "Experience" and "Projects" combined.
    - If the user has limited "Experience" (less than 3 items), you MUST include "Projects" to fill the gap.
    - Do not return an empty Projects array unless the Experience section alone is extensive (5+ items).      - If a Project is more relevant than a Job, prioritize it.
    - AGGRESSIVELY CUT irrelevant items to ensure it fits on one page.
    2. **Rewrite Logic:**
       - Use "Action Verbs" (Engineered, Deployed, Optimized).
       - Incorporate keywords from the JD naturally (don't stuff).
       - Quantify results where possible (e.g., "Reduced latency by 20%").
    3. **Honesty:** - Do not invent skills. Use the user's actual data.

    INPUT DATA:
    - User Profile: ${JSON.stringify(userResumeJson)}
    - Job Description: "${jobDescriptionText}"
    - Audit Gaps: ${JSON.stringify(auditResults)}

    OUTPUT FORMAT (Strict JSON):
    {
      "experience": [
        {
          "company": "Company Name",
          "role": "Job Title",
          "location": "City, Country",
          "date": "Jan 2024 -- Present",
          "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
        }
      ],
      "projects": [
        {
          "name": "Project Name",
          "tech_stack": "React, Node.js", 
          "link": "github.com/...",
          "bullets": ["Bullet 1", "Bullet 2"]
        }
      ],
      "skills": {
        "languages": "Java, Python, ...",
        "frameworks": "React, Express, ...",
        "tools": "Docker, AWS, ..."
      }
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
        const cleanText = analysisText.replace(/```json/g, "").replace(/```/g, "");
        const analysisJson = JSON.parse(cleanText);

        console.log("---Agent B Finished---");
        return analysisJson;

    } catch (error) {
        console.error("Agent B Error: ", error);
        throw new Error("Writer Agent failed.");
    }
};
