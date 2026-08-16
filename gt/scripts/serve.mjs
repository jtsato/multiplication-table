import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const requested = urlPath === '/' ? '/index.html' : urlPath;
    const safePath = normalize(requested).replace(/^([.][.][/\\])+/, '');
    let filePath = join(root, safePath);
    try { await stat(filePath); } catch { filePath = join(root, 'index.html'); }
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': types[extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(String(error));
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Tabuada em Blocos: http://localhost:${port}`);
});
