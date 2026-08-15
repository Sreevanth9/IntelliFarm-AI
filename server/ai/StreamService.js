class StreamService {
  initStream(res) {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Prevent proxy/Nginx buffering stream
    res.flushHeaders();
  }

  sendChunk(res, data) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[SSE SEND] ${new Date().toISOString()}`);
    }
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === "function") {
      res.flush();
    }
  }

  sendError(res, errorMsg) {
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    if (typeof res.flush === "function") {
      res.flush();
    }
  }

  endStream(res, finalPayload = {}) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[SSE END] ${new Date().toISOString()}`);
    }
    res.write(`data: ${JSON.stringify({ done: true, ...finalPayload })}\n\n`);
    if (typeof res.flush === "function") {
      res.flush();
    }
    res.end();
  }
}

export default new StreamService();

