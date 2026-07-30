// Server-Side Attachment Security Validator & Sanitizer

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv"
]);

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

class AttachmentValidator {
  validate(attachments) {
    if (!attachments) return { isValid: true, attachments: [] };

    if (!Array.isArray(attachments)) {
      return { isValid: false, error: "Attachments payload must be an array." };
    }

    if (attachments.length > MAX_ATTACHMENTS) {
      return { isValid: false, error: `Maximum ${MAX_ATTACHMENTS} attachments allowed per request.` };
    }

    const sanitized = [];

    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (!att || typeof att !== "object") {
        return { isValid: false, error: `Invalid attachment format at item ${i + 1}.` };
      }

      const { name, type, data } = att;

      // Sanitize attachment filename against path traversal / XSS
      const sanitizedName = typeof name === "string" 
        ? name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) 
        : `attachment_${i + 1}`;

      // Check payload data presence and size
      if (!data || typeof data !== "string") {
        return { isValid: false, error: `Attachment "${sanitizedName}" has invalid or missing data.` };
      }

      // Check base64 size limit (~5MB base64 string length check)
      const approxSizeBytes = Math.ceil((data.length * 3) / 4);
      if (approxSizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
        return { isValid: false, error: `Attachment "${sanitizedName}" exceeds 5MB size limit.` };
      }

      // MIME type validation for data URLs
      let detectedType = type || "document";
      if (data.startsWith("data:")) {
        const mimeMatch = data.match(/^data:([^;]+);base64,/);
        if (mimeMatch) {
          const mime = mimeMatch[1].toLowerCase();
          if (!ALLOWED_MIME_TYPES.has(mime)) {
            return { isValid: false, error: `MIME type "${mime}" is not allowed for attachment "${sanitizedName}".` };
          }
          detectedType = mime.startsWith("image/") ? "image" : "document";
        }
      }

      sanitized.push({
        name: sanitizedName,
        type: detectedType,
        data: data.slice(0, MAX_ATTACHMENT_SIZE_BYTES * 1.35) // Hard cap data length
      });
    }

    return { isValid: true, attachments: sanitized };
  }
}

export default new AttachmentValidator();
