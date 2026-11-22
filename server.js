const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = 3000;
const HOST = '0.0.0.0';
const FRONTEND_DIR = path.resolve(__dirname, 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const sendFile = (res, filePath, statusCode = 200) => {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'Content-Length': stats.size
    });
    fs.createReadStream(filePath).pipe(res);
  });
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let targetPath = path.join(FRONTEND_DIR, safePath);

  if (!targetPath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(targetPath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      targetPath = path.join(targetPath, 'index.html');
      sendFile(res, targetPath);
      return;
    }

    if (!err && stats.isFile()) {
      sendFile(res, targetPath);
      return;
    }

    sendFile(res, path.join(FRONTEND_DIR, 'index.html'), 404);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Collab frontend dev server running at http://${HOST}:${PORT}`);
});
