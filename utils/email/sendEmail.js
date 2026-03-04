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
  connectionTimeout: 15000, // Increased to 15s
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

const sendEmail = async ({ to, subject, html }) => {
  console.log(`Email Debug: Host=${process.env.EMAIL_HOST}, Port=${port}, Secure=${secure}, User=${process.env.EMAIL_USER}`);

  try {
    // Verify connection before sending
    await transporter.verify();
    console.log("SMTP connection verified successfully");

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM || 'VedicStore'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    logger.info("Email sent successfully", {
      to,
      subject,
      messageId: info.messageId,
    });

    return info;
  } catch (error) {
    logger.error("Email sending failed", {
      to,
      errorMessage: error.message,
      errorCode: error.code,
      command: error.command
    });
    console.error("Detailed Nodemailer Error:", error);
    throw new Error(`Email failure: ${error.message}`);
  }
};

module.exports = sendEmail;
