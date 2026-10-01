import nodemailer from "nodemailer";

const RECIPIENT_EMAIL = process.env.SUPPORT_RECIPIENT_EMAIL || "vsreevanth@gmail.com";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

export const sendSupportMessage = async (req, res, next) => {
  try {
    const { type, subject, message } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      const error = new Error("Message content is required.");
      error.statusCode = 400;
      throw error;
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const error = new Error("Support email is not configured. Please try again later.");
      error.statusCode = 503;
      throw error;
    }

    const senderEmail = req.user?.email || "anonymous@intellifarm.ai";
    const senderName = req.user?.name || req.user?.email?.split("@")[0] || "Farmer";
    const category = type || "Support Inquiry";
    const topicSubject = subject || `${category} from ${senderName}`;
    const date = new Date().toLocaleString();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"IntelliFarm AI Support" <${process.env.SMTP_USER}>`,
        to: RECIPIENT_EMAIL,
        replyTo: senderEmail,
        subject: `[IntelliFarm AI ${category}] ${topicSubject}`,
        text: `New ${category} received.\n\nSender: ${senderName} (${senderEmail})\nSubject: ${topicSubject}\nDate: ${date}\n\nMessage:\n${message.trim()}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #183d24;">
            <h2 style="color: #2e7d32;">New ${escapeHtml(category)} submitted</h2>
            <p><strong>Sender:</strong> ${escapeHtml(senderName)} (${escapeHtml(senderEmail)})</p>
            <p><strong>Topic:</strong> ${escapeHtml(topicSubject)}</p>
            <p><strong>Timestamp:</strong> ${escapeHtml(date)}</p>
            <hr style="border: 1px solid #e0e0e0; margin: 20px 0;" />
            <p><strong>Message:</strong></p>
            <div style="background: #f4f9f5; padding: 15px; border-radius: 8px; border-left: 4px solid #2e7d32;">
              ${escapeHtml(message.trim()).replace(/\r?\n/g, "<br />")}
            </div>
          </div>
        `,
      });
    } catch {
      const error = new Error("Unable to send your support message right now. Please try again later.");
      error.statusCode = 502;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. Our team will review it promptly.",
    });
  } catch (error) {
    next(error);
  }
};
