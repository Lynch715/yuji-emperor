import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  port = Number(process.env.PORT) || 4173;
createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const path = resolve(
    root,
    "." +
      decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
  );
  if (
    !path.startsWith(root + "/") ||
    path.includes("/reference/") ||
    path.includes("/.")
  ) {
    res.writeHead(403).end();
    return;
  }
  try {
    const data = await readFile(path);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
      }[extname(path)] || "text/plain; charset=utf-8",
    );
    res.setHeader("Cache-Control", "no-store");
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, "127.0.0.1", () =>
  console.log("御极本地预览：http://127.0.0.1:" + port),
);
