import { test, describe } from "node:test";
import assert from "node:assert/strict";
import attachmentValidator from "../ai/AttachmentValidator.js";
import { sanitizePiiAndSecrets } from "../utils/piiSanitizer.js";

describe("Security Hardening: Attachment Validation & PII Sanitization", () => {
  test("Attachment Validation: Accepts valid base64 image", () => {
    const validImg = {
      name: "soil_test.png",
      type: "image",
      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    };
    const res = attachmentValidator.validate([validImg]);
    assert.equal(res.isValid, true);
    assert.equal(res.attachments.length, 1);
  });

  test("Attachment Validation: Rejects invalid MIME type", () => {
    const invalidFile = {
      name: "malicious.exe",
      type: "document",
      data: "data:application/x-msdownload;base64,TVqQAAMAAAAEAAAA"
    };
    const res = attachmentValidator.validate([invalidFile]);
    assert.equal(res.isValid, false);
    assert.ok(res.error.includes("MIME type"));
  });

  test("Attachment Validation: Rejects more than 5 attachments", () => {
    const arr = Array(6).fill({ name: "test.txt", type: "document", data: "data:text/plain;base64,dGVzdA==" });
    const res = attachmentValidator.validate(arr);
    assert.equal(res.isValid, false);
    assert.ok(res.error.includes("Maximum 5 attachments"));
  });

  test("PII & Secrets Redaction: Sanitizes API keys, emails, and phone numbers", () => {
    const textWithSecrets = "My key is gsk_123456789012345678901234567890 and my email is farmer@example.com, phone +91 98765 43210.";
    const sanitized = sanitizePiiAndSecrets(textWithSecrets);
    assert.ok(!sanitized.includes("gsk_123456789012345678901234567890"));
    assert.ok(!sanitized.includes("farmer@example.com"));
    assert.ok(!sanitized.includes("98765"));
    assert.ok(sanitized.includes("[REDACTED_GROQ_KEY]"));
    assert.ok(sanitized.includes("[REDACTED_EMAIL]"));
    assert.ok(sanitized.includes("[REDACTED_PHONE]"));
  });
});
