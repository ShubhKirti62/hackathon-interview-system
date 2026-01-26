const nodemailer = require('nodemailer');

// These will be loaded from process.env
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendInterviewInvite = async (to, candidateName, interviewDate, interviewTime, meetingLink, customMessage) => {
    try {
        const mailOptions = {
            from: `"Interview System" <${process.env.SMTP_USER}>`,
            to: to,
            subject: 'Interview Invitation - Round 1',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #3b82f6;">Interview Invitation</h2>
                    <p>Dear ${candidateName},</p>
                    
                    <p>We are pleased to invite you for the first round of interviews for the position at our company.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${interviewDate}</p>
                        <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${interviewTime}</p>
                        <p style="margin: 5px 0;"><strong>🔗 Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
                    </div>

                    ${customMessage ? `<p>${customMessage}</p>` : ''}

                    <p>Please ensure you are available 5 minutes before the scheduled time.</p>

                    <p>Best regards,<br/>Recruitment Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendInterviewInvite };
