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
        // Format time to AM/PM
        const formatTimeAMPM = (time24) => {
            if (!time24) return '';
            const [hours, minutes] = time24.split(':');
            let h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${minutes} ${ampm}`;
        };

        const formattedTime = formatTimeAMPM(interviewTime);

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
                        <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${formattedTime}</p>
                        <p style="margin: 5px 0;"><strong>🔗 Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
                    </div>

                    <div style="background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold;">Login Credentials:</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
                        <p style="margin: 5px 0;"><strong>Password:</strong> 123456</p>
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

const sendRound2Invite = async (to, candidateName, interviewDate, interviewTime, meetingLink, interviewerName) => {
    try {
        // Format time to AM/PM
        const formatTimeAMPM = (time24) => {
            if (!time24) return '';
            const [hours, minutes] = time24.split(':');
            let h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${minutes} ${ampm}`;
        };

        const formattedTime = formatTimeAMPM(interviewTime);

        // Format date nicely
        const dateObj = new Date(interviewDate);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const mailOptions = {
            from: `"Interview System" <${process.env.SMTP_USER}>`,
            to: to,
            subject: 'Interview Invitation - Round 2 (Live Technical Interview)',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #10b981;">Congratulations! Round 2 Interview Invitation</h2>
                    <p>Dear ${candidateName},</p>

                    <p>We are pleased to inform you that you have successfully cleared the first round of interviews. We would like to invite you for the <strong>second round - Live Technical Interview</strong>.</p>

                    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                        <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${formattedTime}</p>
                        ${interviewerName ? `<p style="margin: 5px 0;"><strong>👤 Interviewer:</strong> ${interviewerName}</p>` : ''}
                    </div>

                    <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0 0 10px 0; font-weight: bold;">Join Meeting Link:</p>
                        <a href="${meetingLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Live Interview</a>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">or copy this link: <a href="${meetingLink}">${meetingLink}</a></p>
                    </div>

                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold;">Important Instructions:</p>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                            <li>Please join 5 minutes before the scheduled time</li>
                            <li>Ensure you have a stable internet connection</li>
                            <li>Use a laptop/desktop with working camera and microphone</li>
                            <li>Find a quiet place with good lighting</li>
                        </ul>
                    </div>

                    <div style="background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold;">Login Credentials:</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
                        <p style="margin: 5px 0;"><strong>Password:</strong> 123456</p>
                    </div>

                    <p>We look forward to speaking with you!</p>

                    <p>Best regards,<br/>Recruitment Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Round 2 invite sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending Round 2 email:', error);
        throw error;
    }
};

module.exports = { sendInterviewInvite, sendRound2Invite };
