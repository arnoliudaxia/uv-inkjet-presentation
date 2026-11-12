import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须为 1–65535 的整数');
const publicFiles = new Set(['index.html', 'styles.css', 'app.js']);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  const headers = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' };
  const reply = (status, message) => {
    res.writeHead(status, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : message);
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return reply(405, 'Method Not Allowed');
  }
  let pathname;
  try { pathname = decodeURIComponent((req.url ?? '/').split('?')[0]); }
  catch { return reply(400, 'Bad Request'); }
  // 明确白名单；不将任何用户输入直接用作文件系统路径。
  const name = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!pathname.startsWith('/') || !publicFiles.has(name)) return reply(404, 'Not Found');
  try {
    const body = await readFile(path.join(root, name));
    res.writeHead(200, { ...headers, 'Content-Type': mime[path.extname(name)], 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error(error);
    reply(500, 'Internal Server Error');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`UV 喷头课堂 → http://127.0.0.1:${port}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
