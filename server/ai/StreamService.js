class StreamService {
  initStream(res) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Prevent Nginx buffering stream
    res.flushHeaders();
  }

  sendChunk(res, data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  sendError(res, errorMsg) {
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
  }

  endStream(res, finalPayload = {}) {
    res.write(`data: ${JSON.stringify({ done: true, ...finalPayload })}\n\n`);
    res.end();
  }
}

export default new StreamService();
