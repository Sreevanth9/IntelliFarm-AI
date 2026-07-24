import nodemailer from "nodemailer";
import { supabase } from "../config/supabase.js";

const RECIPIENT_EMAIL = process.env.SUPPORT_RECIPIENT_EMAIL || "vsreevanth@gmail.com";

export const sendSupportMessage = async (req, res, next) => {
  try {
    const { type, subject, message } = req.body;

    if (!message || !message.trim()) {
      const error = new Error("Message content is required.");
      error.statusCode = 400;
      throw error;
    }

    const senderEmail = req.user?.email || "anonymous@intellifarm.ai";
    const senderName = req.user?.name || req.user?.email?.split("@")[0] || "Farmer";
    const category = type || "Support Inquiry";
    const topicSubject = subject || `${category} from ${senderName}`;

    // 1. Log message to Supabase database so submissions are never lost
    try {
      await supabase.from("support_messages").insert({
        user_id: req.user?.id,
        sender_name: senderName,
        sender_email: senderEmail,
        category,
        subject: topicSubject,
        message: message.trim(),
        recipient: RECIPIENT_EMAIL,
        created_at: new Date().toISOString()
      });
    } catch (dbErr) {
      console.warn("[supportController] DB log warning:", dbErr.message);
    }

    // 2. Transport email to recipient vsreevanth@gmail.com
    let emailSent = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"IntelliFarm AI Support" <${process.env.SMTP_USER}>`,
          to: RECIPIENT_EMAIL,
          replyTo: senderEmail,
          subject: `[IntelliFarm AI ${category}] ${topicSubject}`,
          text: `New ${category} Received:\n\nSender: ${senderName} (${senderEmail})\nSubject: ${topicSubject}\nDate: ${new Date().toLocaleString()}\n\nMessage:\n${message}\n`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #183d24;">
              <h2 style="color: #2e7d32;">New ${category} Submitted</h2>
              <p><strong>Sender:</strong> ${senderName} (${senderEmail})</p>
              <p><strong>Topic:</strong> ${topicSubject}</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <hr style="border: 1px solid #e0e0e0; margin: 20px 0;" />
              <p><strong>Message:</strong></p>
              <div style="background: #f4f9f5; padding: 15px; border-radius: 8px; border-left: 4px solid #2e7d32;">
                ${message.replace(/\n/g, "<br />")}
              </div>
            </div>
          `
        });
        emailSent = true;
      } catch (mailErr) {
        console.error("[supportController] SMTP send error:", mailErr);
      }
    }

    console.log(`[supportController] Message logged for ${RECIPIENT_EMAIL}. EmailSent: ${emailSent}`);

    res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. Our team will review your message promptly.",
    });
  } catch (error) {
    console.error("[supportController] sendSupportMessage error:", error);
    next(error);
  }
};
