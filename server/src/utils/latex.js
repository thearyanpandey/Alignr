import {exec} from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clean = (str) => {
    if(!str) return "";
    return String(str).replace(/([&%$#_])/g, "\\$1");
};

const buildExperienceLatex = (items) => {
    if(!items || items.length === 0) return "No experience provided.";

    const header = "\\section{Experience}\n";
    
    const content = items.map(item => `
        \\begin{twocolentry}{
            \\textit{${clean(item.location)}}    
            
            \\textit{${clean(item.date)}}
        }
            \\textbf{${clean(item.role)}}
            
            \\textit{${clean(item.company)}}
        \\end{twocolentry}

        \\vspace{0.10 cm}
        \\begin{onecolentry}
            \\begin{highlights}
                ${item.bullets.map(b => `\\item ${clean(b)}`).join("\n                ")}
            \\end{highlights}
        \\end{onecolentry}
        \\vspace{0.2 cm}`).join("\n");

        return header + content;
};

const buildProjectsLatex = (items) => {
    if(!items || items.length === 0) return "";

    const header = "\\section{Projects}\n";

    const content =  items.map(item => `
        \\begin{twocolentry}{
            
            
            \\textit{{}}
        }
            \\textbf{${clean(item.name)} $|$ \\href{${item.link}}{Repository}}
        \\end{twocolentry}

        \\vspace{0.10 cm}
        \\begin{onecolentry}
            \\begin{highlights}
                ${item.bullets.map(b => `\\item ${clean(b)}`).join("\n                ")}
            \\end{highlights}
        \\end{onecolentry}
        \\vspace{0.2 cm}`).join("\n");

    return header + content;
}

const buildEducationLatex = (educationList) => {

    console.log("Debug: Building Education with:", JSON.stringify(educationList));

    if(!educationList || !Array.isArray(educationList) || educationList.length === 0) return "\\begin{onecolentry}No education details provided.\\end{onecolentry}";

    const header = "\\section{Education}\n"; 

    const content =  educationList.map(edu => `
        \\begin{twocolentry}{
            \\textit{${clean(edu.duration)}}
        }
            \\textbf{${clean(edu.institution)}}

            \\textit{${clean(edu.degree)}}
        \\end{twocolentry}

        \\vspace{0.10 cm}
        \\begin{onecolentry}
            \\begin{highlights}
                \\item ${edu.gpa ? `CGPA: ${clean(edu.gpa)}` : `Percentage: ${clean(edu.percentage)}`}
            \\end{highlights}
        \\end{onecolentry}
        \\vspace{0.2 cm}`).join("\n");

    return header + content;
};


export const generatePDF = (userData, aiContent) => {
    return new Promise((resolve, reject) => {

        if (!aiContent || !aiContent.experience) {
            console.error("CRITICAL ERROR: Data missing in generatePDF");
            console.error("aiContent received:", aiContent);
            return reject(new Error("AI Generation failed to produce content."));
        }

        //Read the template
        const templatePath = path.join(__dirname, "../templates/master.tex");
        let template = fs.readFileSync(templatePath, "utf8");

        //generating section programmatically
        const expSection = buildExperienceLatex(aiContent.experience);
        const projSection = buildProjectsLatex(aiContent.projects);
        const eduSection = buildEducationLatex(userData.education);

        console.log("hii from generate pdf :", Object.keys(userData));

        //Formatted Skills
        const skillsSection = `
            \\begin{onecolentry}
                \\textbf{Languages:} ${clean(aiContent.skills.languages)}
            \\end{onecolentry}
            \\vspace{0.1cm}
            \\begin{onecolentry}
                \\textbf{Frameworks:} ${clean(aiContent.skills.frameworks)}
            \\end{onecolentry}
            \\vspace{0.1 cm}
            \\begin{onecolentry}
            \\textbf{Tools:} ${clean(aiContent.skills.tools)}
            \\end{onecolentry}
        `

        //2. Injecting Data (simple strings for now)
        template = template
            .replace("<<NAME>>", clean(userData.personalInfo.name))
            .replace(/<<EMAIL>>/g, clean(userData.personalInfo.email))
            .replace(/<<PHONE>>/g, clean(userData.personalInfo.phone))
            .replace("<<LOCATION>>", clean(userData.personalInfo.location))
            .replace("<<LINKEDIN_USER>>", clean(userData.personalInfo.profiles.linkedin))
            .replace("<<LINKEDIN_URL>>", `https://linkedin.com/in/${clean(userData.personalInfo.profiles.linkedin)}`)
            .replace("<<GITHUB_USER>>", clean(userData.personalInfo.profiles.github))
            .replace("<<GITHUB_URL>>", `https://github.com/${clean(userData.personalInfo.profiles.github)}`)
            
            .replace("<<EDUCATION_SECTION>>", eduSection)
            .replace("<<EXPERIENCE_SECTION>>", expSection)
            .replace("<<PROJECTS_SECTION>>", projSection)
            .replace("<<SKILLS_SECTION>>", skillsSection);

        //3 Output paths
        //we'll use a timestamp to ensure unique filenames
        const fileId = Date.now();
        const outputDir = path.join(__dirname, "../../output");
        const tempTex = path.join(outputDir, `${fileId}.tex`);

        //Ensure output dir exists
        if(!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir);
        }

        //4. Write the populated .tex file to disk
        fs.writeFileSync(tempTex, template);

        //5. command to put the PDF
        const command = `pdflatex -output-directory="${outputDir}" -interaction=nonstopmode "${tempTex}"`;

        console.log(`Compiling PDF: ${fileId}...`);

        exec(command, (error, stdout, stderr) => {
            if(error){
                console.error("Compilation Error:", stderr);
                return reject(error);
            }

            // 6. Cleanup (Optional: keep .tex for debugging if needed)
            // fs.unlinkSync(tempTexPath);
            
            console.log("PDF Generated successfully!");
            resolve(path.join(outputDir, `${fileId}.pdf`));
        });
    });
};

