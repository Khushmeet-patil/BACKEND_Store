const nodemailer = require("nodemailer");
const logger = require("../logger");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: String(process.env.EMAIL_PORT) === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const sendEmail = async ({ to, subject, html }) => {
  // Debug log
  console.log(`Attempting to send email to ${to} using host ${process.env.EMAIL_HOST} on port ${process.env.EMAIL_PORT}`);

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    console.error("Nodemailer Error Details:", error);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;
