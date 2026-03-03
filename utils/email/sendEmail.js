const nodemailer = require("nodemailer");
const logger = require("../logger");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Helps with some certification issues on shared hosting
  }
});

const sendEmail = async ({ to, subject, html }) => {
  // Debug log (masked)
  console.log(`Attempting to send email to ${to} using host ${process.env.EMAIL_HOST}`);

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
