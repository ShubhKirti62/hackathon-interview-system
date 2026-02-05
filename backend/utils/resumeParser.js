const fs = require('fs');
const { PDFParse: pdf } = require('pdf-parse');
const mammoth = require('mammoth');

const parseResume = async (input, mimetype, originalFilename = '') => {
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

        console.log('Parsing resume - buffer length:', dataBuffer.length, 'Mime:', mimetype, 'File:', originalFilename);
        console.log('Buffer hex sample:', dataBuffer.slice(0, 20).toString('hex'));
        console.log('Buffer string sample:', dataBuffer.slice(0, 20).toString());

        let text = '';
        const lowerFilename = originalFilename.toLowerCase();

        // Helper to check magic numbers
        const isPdfHeader = dataBuffer.slice(0, 4).toString() === '%PDF';
        const isZipHeader = dataBuffer.slice(0, 2).toString() === 'PK'; // Docx is a zip
    
        // Detect type based on content first, then metadata
        const isPdf = isPdfHeader || mimetype === 'application/pdf' || lowerFilename.endsWith('.pdf');
        
        // Docx detection
        const isDocx = (isZipHeader && (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerFilename.endsWith('.docx'))) ||
                       mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                       mimetype === 'application/msword' || 
                       lowerFilename.endsWith('.docx') || 
                       lowerFilename.endsWith('.doc');

        console.log(`Detection: isPdf=${isPdf} (Header=${isPdfHeader}), isDocx=${isDocx} (Header=${isZipHeader})`);

        if (isPdf) {
            try {
                const instance = new pdf({ data: dataBuffer });
                const data = await instance.getText();
                text = data.text;
                await instance.destroy();
            } catch (pdfError) {
                console.error("pdf-parse failed:", pdfError);
                throw new Error("Failed to parse PDF content: " + pdfError.message);
            }
        } else if (isDocx || isZipHeader) { // Fallback: if it's a zip, try as docx
            try {
                const result = await mammoth.extractRawText({ buffer: dataBuffer });
                text = result.value;
                if (result.messages.length > 0) {
                    console.log("Mammoth messages:", result.messages);
                }
            } catch (docxError) {
                console.error("mammoth failed:", docxError);
                // If it was just a zip and not docx, this might fail, but worth a try if valid docx
                throw new Error("Failed to parse DOCX content.");
            }
        } else {
             throw new Error('Unsupported file format. Please upload PDF or DOCX.');
        }

        // Basic Extraction Logic (Heuristic/Regex based)
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const textLower = text.toLowerCase();

        // ============ EXTRACT EMAIL ============
        // With label: "Email: abc@xyz.com" or "E-mail: abc@xyz.com"
        // Without label: just "abc@xyz.com" standalone
        let email = '';
        const emailWithLabelMatch = text.match(/(?:e-?mail|email\s*id|email\s*address)[:\s]*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
        if (emailWithLabelMatch) {
            email = emailWithLabelMatch[1];
        } else {
            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
            const emailMatch = text.match(emailRegex);
            email = emailMatch ? emailMatch[0] : '';
        }

        // Extract Phone - improved logic
        // First, remove URLs to avoid extracting numbers from LinkedIn/website URLs
        const textWithoutUrls = text.replace(/https?:\/\/[^\s]+/gi, ' ')
                                    .replace(/www\.[^\s]+/gi, ' ')
                                    .replace(/linkedin\.com[^\s]*/gi, ' ');

        // Look for phone number near keywords first
        let phone = '';

        // Pattern to match phone numbers with keywords like "Mobile:", "Phone:", etc.
        // Handles formats like: Mobile: +91 95985 28177| +91 88747 20735
        const phoneKeywordPatterns = [
            /(?:phone|mobile|cell|contact|tel|mob|ph)[:\s]*([+]?[\d\s\-().]{10,})/gi,
        ];

        for (const pattern of phoneKeywordPatterns) {
            const match = pattern.exec(textWithoutUrls);
            if (match) {
                // Get the captured group (the phone number part)
                let phoneStr = match[1] || match[0];

                // If there are multiple numbers separated by | or /, take the first one
                phoneStr = phoneStr.split(/[|\/,]/)[0].trim();

                // Remove all spaces, dashes, parentheses, dots
                const cleanedPhone = phoneStr.replace(/[\s\-().]/g, '');

                // Extract digits and + sign
                const digits = cleanedPhone.replace(/[^\d+]/g, '');

                if (digits.length >= 10) {
                    // If starts with +91, keep it or just take 10 digits
                    if (digits.startsWith('+91') && digits.length >= 12) {
                        phone = '+91' + digits.slice(-10); // +91 followed by last 10 digits
                    } else if (digits.startsWith('91') && digits.length >= 12) {
                        phone = '+91' + digits.slice(-10);
                    } else if (digits.startsWith('+')) {
                        // Other country codes
                        phone = digits;
                    } else {
                        // Just 10 digits
                        phone = digits.slice(-10);
                    }
                    break;
                }
            }
        }

        // Fallback: Look for standalone phone numbers without keywords
        if (!phone) {
            const phonePatterns = [
                /\+91[\s\-]?\d{5}[\s\-]?\d{5}/g,  // Indian: +91 95985 28177
                /\+91[\s\-]?\d{10}/g,  // Indian: +91 9598528177
                /\+\d{1,3}[\s\-]?[\d\s\-]{10,}/g,  // International format
                /(?<!\d)[\d]{5}[\s\-]?[\d]{5}(?!\d)/g,  // 95985 28177 format
                /(?<!\d)\d{10}(?!\d)/g,  // Standalone 10 digits
                /(?<!\d)\d{3}[\s\-]?\d{3}[\s\-]?\d{4}(?!\d)/g,  // US format
            ];

            for (const pattern of phonePatterns) {
                const matches = textWithoutUrls.match(pattern);
                if (matches && matches.length > 0) {
                    // Filter out numbers that look like years (1990-2025)
                    const validPhone = matches.find(m => {
                        const digits = m.replace(/[^\d]/g, '');
                        const firstFour = parseInt(digits.substring(0, 4));
                        return !(firstFour >= 1950 && firstFour <= 2030) && digits.length >= 10;
                    });
                    if (validPhone) {
                        // Clean the phone number - remove spaces, dashes
                        const cleaned = validPhone.replace(/[\s\-().]/g, '');
                        const digits = cleaned.replace(/[^\d+]/g, '');

                        if (digits.startsWith('+91') || digits.startsWith('91')) {
                            phone = '+91' + digits.slice(-10);
                        } else if (digits.startsWith('+')) {
                            phone = digits;
                        } else {
                            phone = digits.slice(-10);
                        }
                        break;
                    }
                }
            }
        }

        // ============ EXTRACT NAME ============
        // With label: "Name: John Doe" or "Full Name: John Doe"
        // Without label: First line that looks like a name (2-4 words, only letters)
        let name = '';

        // Try with label first
        const nameWithLabelMatch = text.match(/(?:full\s*name|name|candidate\s*name)[:\s]*([A-Za-z]+(?:\s+[A-Za-z]+){1,3})/i);
        if (nameWithLabelMatch) {
            name = nameWithLabelMatch[1].trim();
        }

        // Fallback: Look for name-like pattern in first few lines
        if (!name) {
            for (let i = 0; i < Math.min(8, lines.length); i++) {
                const line = lines[i];
                // Skip lines that contain common non-name patterns
                if (line.includes('@') || line.includes('http') || line.includes('www.') ||
                    line.includes('linkedin') || /^\d/.test(line) || line.includes(':')) {
                    continue;
                }
                // Name pattern: 2-4 words, only letters and spaces, reasonable length
                if (/^[A-Za-z]+(?:\s+[A-Za-z]+){1,3}$/.test(line) && line.length >= 4 && line.length <= 50) {
                    // Avoid common headers/titles
                    const lowerLine = line.toLowerCase();
                    const skipWords = ['resume', 'curriculum', 'vitae', 'objective', 'summary', 'experience',
                                       'education', 'skills', 'projects', 'contact', 'profile', 'about'];
                    if (!skipWords.some(w => lowerLine.includes(w))) {
                        name = line;
                        break;
                    }
                }
            }
        }

        // ============ EXTRACT NOTICE PERIOD ============
        // Formats: "Notice Period: 30 days", "NP: 2 months", "Immediate joiner", "Currently serving notice"
        let noticePeriod = '';

        const npPatterns = [
            /(?:notice\s*period|np)[:\s]*(\d+\s*(?:days?|weeks?|months?))/i,
            /(?:notice\s*period|np)[:\s]*(immediate(?:ly)?|immediate\s*joiner)/i,
            /(?:notice\s*period|np)[:\s]*(currently\s*serving(?:\s*notice)?)/i,
            /(?:notice\s*period|np)[:\s]*(\d+\s*(?:to|-)\s*\d+\s*(?:days?|weeks?|months?))/i,
            /(immediate(?:ly)?\s*(?:available|joiner))/i,
            /(\d+\s*(?:days?|weeks?|months?)\s*notice)/i,
        ];

        for (const pattern of npPatterns) {
            const match = text.match(pattern);
            if (match) {
                noticePeriod = match[1].trim();
                // Normalize
                noticePeriod = noticePeriod.replace(/\s+/g, ' ');
                break;
            }
        }

        // If not found, check for standalone patterns
        if (!noticePeriod) {
            if (/immediate(?:ly)?\s*(?:available|joiner)/i.test(textLower)) {
                noticePeriod = 'Immediate';
            } else if (/currently\s*serving\s*notice/i.test(textLower)) {
                noticePeriod = 'Currently Serving';
            }
        }

        // Keywords for Tech Domains (Simple matching)
        const domains = {
            'Frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'frontend', 'ui', 'ux', 'design'],
            'Backend': ['node', 'express', 'django', 'flask', 'java', 'spring', 'go', 'golang', 'backend', 'sql', 'mongodb', 'database', 'api'],
            'Full Stack': ['full stack', 'fullstack', 'mern', 'mean', 'lamp', 'both frontend and backend'],
            'Data Science': ['python', 'pandas', 'numpy', 'scikit', 'pytorch', 'tensorflow', 'machine learning', 'data science', 'analytics', 'statistics'],
            'DevOps': ['docker', 'kubernetes', 'aws', 'azure', 'jenkins', 'ci/cd', 'terraform', 'deployment', 'infrastructure'],
            'Sales & Marketing': ['sales', 'marketing', 'business development', 'revenue', 'customer acquisition', 'lead generation', 'crm'],
            'Business Analyst': ['business analyst', 'ba', 'requirements', 'analysis', 'stakeholder', 'process improvement', 'data analysis'],
            'QA/Testing': ['qa', 'testing', 'quality assurance', 'automation', 'selenium', 'cypress', 'manual testing', 'test cases'],
            'UI/UX Design': ['ui', 'ux', 'user interface', 'user experience', 'figma', 'sketch', 'adobe xd', 'prototyping', 'wireframing'],
            'Product Management': ['product manager', 'product management', 'roadmap', 'agile', 'scrum', 'product strategy', 'backlog'],
            'HR': ['human resources', 'hr', 'recruitment', 'talent acquisition', 'employee relations', 'payroll', 'training'],
            'Finance': ['finance', 'accounting', 'financial', 'bookkeeping', 'tax', 'audit', 'budgeting', 'financial analysis'],
            'Operations': ['operations', 'logistics', 'supply chain', 'process optimization', 'efficiency', 'workflow', 'management']
        };

        let detectedDomain = 'Full Stack'; // Default
        let maxCount = 0;

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

        // ============ EXTRACT EXPERIENCE ============
        // With label: "Experience: 5 years", "Total Exp: 5+ years", "Work Experience: 5 yrs"
        // Without label: "5 years of experience", "5+ years", "5 yrs exp"
        let experienceLevel = 'Fresher/Intern';
        let yearsOfExp = 0;

        const expPatterns = [
            // With label patterns
            /(?:total\s*)?(?:experience|exp|work\s*experience)[:\s]*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i,
            /(?:total\s*)?(?:experience|exp)[:\s]*(\d+(?:\.\d+)?)\+?\s*(?:to|-)\s*\d+\s*(?:years?|yrs?)/i,
            // Without label patterns
            /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp|in\s*\w+)/i,
            /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s*(?:total|overall|professional)/i,
            // Standalone patterns
            /(?:having|with|over)\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i,
            // Range pattern: "5-7 years"
            /(\d+)\s*(?:to|-)\s*\d+\s*(?:years?|yrs?)/i,
            // Simple standalone
            /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i,
        ];

        for (const pattern of expPatterns) {
            const match = textLower.match(pattern);
            if (match) {
                yearsOfExp = parseFloat(match[1]);
                // Avoid matching years like "2023" or dates
                if (yearsOfExp > 0 && yearsOfExp <= 50) {
                    break;
                }
                yearsOfExp = 0;
            }
        }

        // Check for fresher/intern keywords
        if (yearsOfExp === 0) {
            if (/fresher|fresh\s*graduate|recent\s*graduate|entry\s*level|intern|internship|0\s*years?/i.test(textLower)) {
                experienceLevel = 'Fresher/Intern';
            }
        } else {
            if (yearsOfExp >= 10) experienceLevel = '10+ years';
            else if (yearsOfExp >= 8) experienceLevel = '8-10 years';
            else if (yearsOfExp >= 6) experienceLevel = '6-8 years';
            else if (yearsOfExp >= 4) experienceLevel = '4-6 years';
            else if (yearsOfExp >= 2) experienceLevel = '2-4 years';
            else if (yearsOfExp >= 1) experienceLevel = '1-2 years';
            else experienceLevel = '0-1 years';
        }

        return {
            name,
            email,
            phone,
            domain: detectedDomain,
            experienceLevel,
            noticePeriod,
            resumeText: text.substring(0, 2000) // Store reasonable amount of text
        };

    } catch (error) {
        console.error('Error parsing resume:', error);
        throw error;
    }
};

module.exports = { parseResume };
