const nodemailer = require("nodemailer");
const logger = require("../logger");

const port = parseInt(process.env.EMAIL_PORT) || 587;
const secure = port === 465;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: port,
  secure: secure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2"
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const sendEmail = async ({ to, subject, html }) => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;

  console.log(`[SMTP DEBUG] Attempting connection: Host=${host}, Port=${port}, Secure=${secure}, User=${user}`);

  try {
    // 1. Verify connectivity (fails here with timeout if blocked)
    await transporter.verify();
    console.log("[SMTP DEBUG] Connection verified.");

    // 2. Send the mail
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM || 'VedicStore'}" <${user}>`,
      to,
      subject,
      html,
    });

    logger.info("Email sent successfully", { to, messageId: info.messageId });
    return info;

  } catch (error) {
    let advice = "";
    if (error.code === 'ETIMEDOUT') {
      advice = "Root Cause Found: Render's network is unable to reach Hostinger on this port. Try Port 587 or use a cloud-friendly SMTP provider like Brevo or SendGrid.";
    }

    console.error(`[SMTP ERROR] ${error.message}`);
    if (advice) console.error(`[SMTP ADVICE] ${advice}`);

    logger.error("Email sending failed", {
      to,
      errorMessage: error.message,
      errorCode: error.code,
      command: error.command,
      advice
    });

    throw new Error(`Email failure: ${error.message}. ${advice}`);
  }
};

module.exports = sendEmail;
