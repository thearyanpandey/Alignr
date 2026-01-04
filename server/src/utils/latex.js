import {exec} from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const generatePDF = (data) => {
    return new Promise((resolve, reject) => {

        //Read the template
        const templatePath = path.join(__dirname, "../templates/master.tex");
        let templateContent = fs.readFileSync(templatePath, "utf8");

        //2. Injecting Data (simple strings for now)
        templateContent = templateContent
            .replace("<<NAME>>", data.name || "TEST USER")
            .replace("<<EMAIL>>", data.email || "test@example.com")
            .replace("<<PHONE>>", data.phone || "1234567890")
            .replace("<<LINKEDIN>>", data.linkedin || "linkedin.com/in/test")
            .replace("<<EXPERIENCE_CONTENT>>", data.experience || "No experience provided")
            .replace("<<SKILLS_CONTENT>>", data.skills || "No skills provided.");

        //3 Output paths
        //we'll use a timestamp to ensure unique filenames
        const fileId = Date.now();
        const outputDir = path.join(__dirname, "../../output");
        const tempTexPath = path.join(outputDir, `${fileId}.text`);

        //Ensure output dir exists
        if(!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir);
        }

        //4. Write the populated .tex file to disk
        fs.writeFileSync(tempTexPath, templateContent);

        //5. command to put the PDF
        const command = `pdflatex -output-directory="${outputDir}" -intercation=nonstopmode "${tempTexPath}"`;

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

