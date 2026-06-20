import { supabase } from "../config/supabase.js";
import { logSecurityEvent } from "../utils/securityLogger.js";

// Reusable Middleware to enforce user ownership of data (IDOR mitigation)
export const verifyOwnership = (resourceTable) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const error = new Error("Authentication required");
        error.statusCode = 401;
        throw error;
      }

      // Resolve target resource ID from request params or body
      const resourceId = req.params.id || req.params.postId || req.body.chatHistoryId || req.body.id;

      if (!resourceId) {
        return next();
      }

      const idsToCheck = Array.isArray(resourceId) ? resourceId : [resourceId];
      const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";

      for (const id of idsToCheck) {
        // Query resource ownership
        const { data, error } = await supabase
          .from(resourceTable)
          .select("user_id")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          const error = new Error("Resource not found");
          error.statusCode = 404;
          throw error;
        }

        if (data.user_id !== userId) {
          // Log unauthorized access attempt (IDOR)
          await logSecurityEvent({
            eventType: "IDOR_ATTEMPT",
            userId,
            ipAddress: ip,
            endpoint: req.originalUrl || req.url,
            details: { resourceTable, resourceId: id, reason: "Ownership mismatch" }
          });

          const error = new Error("Access denied: You do not own this resource.");
          error.statusCode = 403;
          throw error;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
