import { generateWithGemini } from "../providers/aiClient.js";
import { getWriterPrompt } from "../prompts/resumePrompts.js";

export const writeResumeContent = async (userResumeJson, jobDescriptionText, auditResults) => {
    console.log("---Agent B (Curator & Writer) Starting---");

    //1. Prompt
    const prompt = getWriterPrompt(userResumeJson, jobDescriptionText, auditResults);

    try {
        const analysisText = await generateWithGemini(prompt);
        
    
        const cleanText = analysisText.replace(/```json/g, "").replace(/```/g, "");

        const analysisJson = JSON.parse(cleanText);

        console.log("---Agent B Finished---");
        return analysisJson;

    } catch (error) {
        console.error("Agent B Error: ", error);
        throw new Error("Writer Agent failed.");
    }
};
