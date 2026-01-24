const fs = require('fs');
const pdf = require('pdf-parse');

const parseResume = async (input) => {
    try {
        let dataBuffer;
        if (Buffer.isBuffer(input)) {
            dataBuffer = input;
        } else {
            if (!fs.existsSync(input)) {
                throw new Error(`File not found at path: ${input}`);
            }
            dataBuffer = fs.readFileSync(input);
        }

        // Debug logging
        console.log('Parsing resume - buffer length:', dataBuffer.length);

        // Basic MIME type check (if input is a file path we cannot easily get mime, skip)
        // In the route we will ensure mimetype is PDF before calling this.

        // Verify PDF header
        if (dataBuffer.slice(0, 4).toString() !== '%PDF') {
            console.error('Invalid PDF file: missing %PDF header');
            throw new Error('Uploaded file is not a valid PDF');
        }

        let data;
        try {
            data = await pdf(dataBuffer);
        } catch (pdfError) {
            console.error("pdf-parse failed:", pdfError);
            throw new Error("Failed to parse PDF content. Ensure file is a valid PDF.");
        }


        const text = data.text;

        // Basic Extraction Logic (Heuristic/Regex based)
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;

        // Extract Email
        const emailMatch = text.match(emailRegex);
        const email = emailMatch ? emailMatch[0] : '';

        // Extract Phone
        const phoneMatch = text.match(phoneRegex);
        const phone = phoneMatch ? phoneMatch[0] : '';

        // Extract Name (Very naive: First non-empty line, or assume near top)
        // Cleanup text -> remove extra spaces
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let name = '';
        if (lines.length > 0) {
            // Check first few lines for something that looks like a name (2-3 words, no numbers)
            for (let i = 0; i < Math.min(5, lines.length); i++) {
                if (/^[a-zA-Z\s]+$/.test(lines[i]) && lines[i].split(' ').length >= 2 && lines[i].split(' ').length <= 4) {
                    name = lines[i];
                    break;
                }
            }
        }

        // Keywords for Tech Domains (Simple matching)
        const domains = {
            'Frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'frontend'],
            'Backend': ['node', 'express', 'django', 'flask', 'java', 'spring', 'go', 'golang', 'backend', 'sql', 'mongodb'],
            'Data Science': ['python', 'pandas', 'numpy', 'scikit', 'pytorch', 'tensorflow', 'machine learning', 'data science'],
            'DevOps': ['docker', 'kubernetes', 'aws', 'azure', 'jenkins', 'ci/cd', 'terraform'],
            'Mobile': ['react native', 'flutter', 'android', 'ios', 'swift', 'kotlin']
        };

        let detectedDomain = 'Full Stack'; // Default
        let maxCount = 0;
        const textLower = text.toLowerCase();

        for (const [dom, keywords] of Object.entries(domains)) {
            let count = 0;
            keywords.forEach(k => {
                if (textLower.includes(k)) count++;
            });
            if (count > maxCount) {
                maxCount = count;
                detectedDomain = dom;
            }
        }

        // Experience Heuristic (looking for "X years")
        // This is very prone to error, but better than nothing
        let experienceLevel = 'Fresher/Intern';
        const expMatch = textLower.match(/(\d+)\+?\s*years?/);
        if (expMatch) {
            const years = parseInt(expMatch[1]);
            if (years >= 8) experienceLevel = '8-10 years';
            else if (years >= 6) experienceLevel = '6-8 years';
            else if (years >= 4) experienceLevel = '4-6 years';
            else if (years >= 2) experienceLevel = '2-4 years';
            else if (years >= 1) experienceLevel = '1-2 years';
        }

        return {
            name,
            email,
            phone,
            domain: detectedDomain,
            experienceLevel,
            resumeText: text.substring(0, 2000) // Store reasonable amount of text
        };

    } catch (error) {
        console.error('Error parsing resume:', error);
        throw error;
    }
};

module.exports = { parseResume };
