const http = require("http");
const { main } = require("./index");

const port = Number(process.env.PORT || 9000);

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const body = await collectBody(req);
    const result = await main({
      httpMethod: req.method,
      headers: req.headers,
      body,
      isBase64Encoded: false,
    });

    const statusCode = Number(result?.statusCode || 200);
    const headers = result?.headers || {};
    res.writeHead(statusCode, headers);
    res.end(result?.body || "");
  } catch (error) {
    console.error("[lis-api http]", error);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "HTTP 服务处理失败" }));
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[lis-api] listening on 0.0.0.0:${port}`);
});
