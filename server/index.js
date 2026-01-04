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
    try {
        const {resume, jobDescription} = req.body;

        if(!resume || !jobDescription) return res.status(400).send("Missing data");

        console.log("1. Starting Audit...");
        const auditResults = await analyzeFit(resume, jobDescription);

        console.log("2. Drafting Content....");
        const rewrittenContent = await writeResumeContent(resume, jobDescription, auditResults);

        console.log("3. Compiling PDF...");
        //Combining the user's personal info with the AI's rewritten content 
        const pdfData = {
            name: resume.personal_info.name,
            email: resume.personal_info.email,
            phone: resume.personal_info.phone,
            linkedIn: resume.personal_info.linkedin,
            experience_content: rewrittenContent.experience_content,
            skills_content: rewrittenContent.skills_content
        };

        const pdfPath = await generatePDF(pdfData);
        console.log("4. Done!");
        res.download(pdfPath, "Optimized_Resume.pdf");

    } catch (error) {
        console.error("Chain Error:", error);
        res.status(500).json({error: "Generation Failed"})
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});