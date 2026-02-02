const { ImapFlow } = require('imapflow');
const path = require('path');
const fs = require('fs');
const { parseResume } = require('../utils/resumeParser');
const Candidate = require('../models/Candidate');
const EmailResumeLog = require('../models/EmailResumeLog');

const SCAN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let autoScanTimer = null;
let lastScanTime = null;
let totalProcessed = 0;
let lastError = null;
let isScanning = false;

function getImapConfig() {
    return {
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT || '993', 10),
        secure: true,
        auth: {
            user: process.env.IMAP_USER || process.env.SMTP_USER,
            pass: process.env.IMAP_PASS || process.env.SMTP_PASS
        },
        tls: { rejectUnauthorized: false },
        logger: false
    };
}

function isResumeAttachment(filename) {
    if (!filename) return false;
    const ext = path.extname(filename).toLowerCase();
    return ['.pdf', '.doc', '.docx'].includes(ext);
}

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.pdf': return 'application/pdf';
        case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case '.doc': return 'application/msword';
        default: return 'application/octet-stream';
    }
}

async function scanInbox() {
    if (isScanning) {
        return { message: 'Scan already in progress', results: [] };
    }

    if (!(process.env.IMAP_USER || process.env.SMTP_USER) || !(process.env.IMAP_PASS || process.env.SMTP_PASS)) {
        throw new Error('IMAP/SMTP credentials not configured. Please check your .env file.');
    }

    isScanning = true;
    const results = [];
    let client;

    try {
        client = new ImapFlow(getImapConfig());
        await client.connect();

        const lock = await client.getMailboxLock('INBOX');

        try {
            // Search ALL messages (not just unseen) to handle re-runs properly
            const uids = await client.search({ all: true }, { uid: true });

            for (const uid of uids) {
                const msg = await client.fetchOne(uid, { uid: true, envelope: true, bodyStructure: true }, { uid: true });

                const rawMessageId = msg.envelope.messageId || `uid-${uid}`;
                const from = msg.envelope.from?.[0]
                    ? `${msg.envelope.from[0].name || ''} <${msg.envelope.from[0].address || ''}>`
                    : 'unknown';
                const fromAddress = msg.envelope.from?.[0]?.address || '';
                const subject = msg.envelope.subject || '(no subject)';

                // Find resume attachments in bodyStructure
                const attachments = extractAttachments(msg.bodyStructure);
                const resumeAttachments = attachments.filter(a => isResumeAttachment(a.filename));

                if (resumeAttachments.length === 0) {
                    continue;
                }

                for (const attachment of resumeAttachments) {
                    const logMessageId = `${rawMessageId}-${attachment.filename}`;

                    // Check if this specific attachment was already processed successfully
                    const existing = await EmailResumeLog.findOne({ messageId: logMessageId });
                    if (existing && existing.status !== 'failed') {
                        results.push({ messageId: logMessageId, status: 'skipped', reason: 'already processed' });
                        continue;
                    }
                    // Remove failed log so it can be retried
                    if (existing && existing.status === 'failed') {
                        await EmailResumeLog.deleteOne({ _id: existing._id });
                    }

                    try {
                        // Download attachment using event-based stream reading
                        const { content } = await client.download(String(uid), attachment.part, { uid: true });
                        const buffer = await new Promise((resolve, reject) => {
                            const chunks = [];
                            content.on('data', (chunk) => chunks.push(chunk));
                            content.on('end', () => resolve(Buffer.concat(chunks)));
                            content.on('error', reject);
                        });

                        // Parse resume
                        const mimetype = getMimeType(attachment.filename);
                        const parsed = await parseResume(buffer, mimetype, attachment.filename);

                        // Determine candidate email - prefer parsed, fallback to sender
                        const candidateEmail = parsed.email || fromAddress;
                        if (!candidateEmail) {
                            throw new Error('Could not determine candidate email from resume or sender');
                        }

                        // Check for duplicate candidate
                        const existingCandidate = await Candidate.findOne({ email: candidateEmail });
                        if (existingCandidate) {
                            await EmailResumeLog.create({
                                messageId: logMessageId,
                                uid,
                                from,
                                subject,
                                attachmentName: attachment.filename,
                                candidateId: existingCandidate._id,
                                status: 'duplicate',
                                errorMessage: 'Candidate with this email already exists'
                            });
                            results.push({
                                messageId: logMessageId,
                                attachment: attachment.filename,
                                status: 'duplicate',
                                email: candidateEmail
                            });
                            continue;
                        }

                        // Save resume file
                        const uploadsDir = path.join(__dirname, '..', 'uploads', 'resumes');
                        if (!fs.existsSync(uploadsDir)) {
                            fs.mkdirSync(uploadsDir, { recursive: true });
                        }
                        const safeFilename = `${Date.now()}-${attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                        const filePath = path.join(uploadsDir, safeFilename);
                        fs.writeFileSync(filePath, buffer);

                        // Create candidate
                        const candidate = await Candidate.create({
                            name: parsed.name || 'Unknown (from email)',
                            email: candidateEmail,
                            phone: parsed.phone || '',
                            domain: parsed.domain || 'Full Stack',
                            experienceLevel: parsed.experienceLevel || 'Fresher/Intern',
                            resumeUrl: `/uploads/resumes/${safeFilename}`,
                            resumeText: parsed.resumeText || '',
                            status: 'profile_submitted'
                        });

                        // Log success
                        await EmailResumeLog.create({
                            messageId: logMessageId,
                            uid,
                            from,
                            subject,
                            attachmentName: attachment.filename,
                            candidateId: candidate._id,
                            status: 'processed'
                        });

                        totalProcessed++;
                        results.push({
                            messageId: logMessageId,
                            attachment: attachment.filename,
                            status: 'processed',
                            candidateId: candidate._id,
                            candidateName: candidate.name,
                            email: candidateEmail
                        });

                    } catch (attachErr) {
                        await EmailResumeLog.create({
                            messageId: logMessageId,
                            uid,
                            from,
                            subject,
                            attachmentName: attachment.filename,
                            status: 'failed',
                            errorMessage: attachErr.message
                        });
                        results.push({
                            messageId: logMessageId,
                            attachment: attachment.filename,
                            status: 'failed',
                            error: attachErr.message
                        });
                    }
                }
            }

        } finally {
            lock.release();
        }

        await client.logout();
        lastScanTime = new Date();
        lastError = null;

    } catch (err) {
        lastError = err.message;
        console.error('Email scan error:', err.message);
        throw err;
    } finally {
        isScanning = false;
        if (client) {
            try { await client.logout(); } catch (_) { /* already closed */ }
        }
    }

    return { message: 'Scan complete', results, scannedAt: lastScanTime };
}

/**
 * Recursively extract attachment info from IMAP bodyStructure
 */
function extractAttachments(structure, partPrefix = '') {
    const attachments = [];

    if (!structure) return attachments;

    if (structure.childNodes && structure.childNodes.length > 0) {
        structure.childNodes.forEach((child, index) => {
            const partNum = partPrefix ? `${partPrefix}.${index + 1}` : `${index + 1}`;
            attachments.push(...extractAttachments(child, partNum));
        });
    } else {
        // Leaf node - check if it's an attachment
        const disposition = structure.disposition;
        const filename = structure.dispositionParameters?.filename
            || structure.parameters?.name
            || '';

        if (filename && (disposition === 'attachment' || disposition === 'inline')) {
            attachments.push({
                filename,
                part: partPrefix || '1',
                type: structure.type,
                size: structure.size
            });
        }
    }

    return attachments;
}

function startAutoScan() {
    if (autoScanTimer) {
        return { message: 'Auto-scan is already running' };
    }
    autoScanTimer = setInterval(async () => {
        try {
            console.log('[EmailScanner] Auto-scan triggered');
            await scanInbox();
        } catch (err) {
            console.error('[EmailScanner] Auto-scan error:', err.message);
        }
    }, SCAN_INTERVAL_MS);

    // Run immediately on start
    scanInbox().catch(err => {
        console.error('[EmailScanner] Initial scan error:', err.message);
    });

    return { message: 'Auto-scan started', intervalMs: SCAN_INTERVAL_MS };
}

function stopAutoScan() {
    if (!autoScanTimer) {
        return { message: 'Auto-scan is not running' };
    }
    clearInterval(autoScanTimer);
    autoScanTimer = null;
    return { message: 'Auto-scan stopped' };
}

function getStatus() {
    return {
        isRunning: !!autoScanTimer,
        isScanning,
        lastScanTime,
        totalProcessed,
        lastError
    };
}

module.exports = {
    scanInbox,
    startAutoScan,
    stopAutoScan,
    getStatus
};
