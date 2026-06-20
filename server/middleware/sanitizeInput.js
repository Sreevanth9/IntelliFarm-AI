import sanitizeHtml from "sanitize-html";

// Middleware to strip out HTML tags and event scripts from incoming request bodies (XSS prevention)
export const sanitizeBody = (req, res, next) => {
  const sanitizeValue = (val) => {
    if (typeof val === "string") {
      return sanitizeHtml(val, {
        allowedTags: [], // Remove all HTML markup
        allowedAttributes: {}, // Remove all HTML attributes (e.g. event handlers like onload/onerror)
      }).trim();
    }
    if (typeof val === "object" && val !== null) {
      if (Array.isArray(val)) {
        return val.map(item => sanitizeValue(item));
      }
      const cleanedObj = {};
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          cleanedObj[key] = sanitizeValue(val[key]);
        }
      }
      return cleanedObj;
    }
    return val;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  next();
};
