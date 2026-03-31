import { generateWithGemini } from "../providers/aiClient.js";
import { getAuditorPrompt } from "../prompts/resumePrompts.js";

export const analyzeFit = async (userResumeJson, jobDescriptionText) => {
    console.log("---Agent A (Auditor) Starting---");

    //1. Prompt
    const prompt = getAuditorPrompt(userResumeJson, jobDescriptionText);

    try {
        
        const analysisText = await generateWithGemini(prompt);

        const analysisJson = JSON.parse(analysisText);

        console.log("---Agent A Finished---");
        return analysisJson;

    } catch (error) {
        console.error("Agent A Error: ", error);
        throw new Error("Auditor Agent failed to analyze data.");
    }
};
