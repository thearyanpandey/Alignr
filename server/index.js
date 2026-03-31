import express, { response } from "express";
import cors from "cors";
import {generatePDF} from "./src/utils/latex.js";
import {analyzeFit} from "./src/agents/auditor.js";
import {writeResumeContent} from "./src/agents/writer.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/test-pdf", async(req, res) => {
    try {
        //Mock data
        const mockData = {
            name: "Aryan Pandey",
            email: "aryanpandey@gmail.com",
            experience: "\\textbf{Senior Developer} \\hfill 2020--Present \\\\ TechCorp Inc. \\\\ \\begin{itemize} \\item Built high-scale Node.js applications. \\item Optimized database queries by 40\\%. \\end{itemize}",
            skills: "Node.js, React, LaTeX, Gemini AI"
        };

        const pdfPath = await generatePDF(mockData);

        //sending file to browser
        res.download(pdfPath, "resume_test.pdf");
    
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "PDF Generation Failed"});
    }
});

app.post("/test-audit", async(req,res) => {
    try {
        //We expect frontend to send {resume, jobDescription}
        const {resume, jobDescription} = req.body;

        if(!resume || !jobDescription){
            return res.status(400).json({error: "Missing resume or JD"});
        }

        const analysis = await analyzeFit(resume, jobDescription);
        res.json(analysis);

    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.post("/generate-resume", async(req,res) => {

    if (!req.body.resume || !req.body.jobDescription) {
        console.warn("⚠️ Blocked a request with missing data.");
            return res.status(400).json({ error: "Resume and Job Description are required." });
    }
    
    try {
        const {resume, jobDescription} = req.body;

        if (!resume || !jobDescription) {
            console.warn("Blocked request with missing data.");
            return res.status(400).json({ error: "Resume and Job Description are required." });
        }

        console.log("Received Request for:", resume.personalInfo?.name || "Unknown");

        console.log("1. Starting Audit...");
        const auditResults = await analyzeFit(resume, jobDescription);

        console.log("2. Drafting Content....");
        const aiGeneratedContent = await writeResumeContent(resume, jobDescription, auditResults);
        
        if (!aiGeneratedContent || !aiGeneratedContent.experience) {
            console.error("AI Writer failed to format data correctly")
            return res.status(500).json({ error: "AI failed to generate content." });
        }
        console.log("DEBUG: AI Content Keys:", Object.keys(aiGeneratedContent));

        console.log("3. Compiling PDF...");
        const pdfPath = await generatePDF(resume, aiGeneratedContent);

        console.log("4. Done!");
        res.download(pdfPath, "Alignr_Resume.pdf");

    } catch (error) {
        console.error("Chain Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Generation Failed: " + error.message });
        }
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});