const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..', 'dist');
const port = Number(process.argv[2] || process.env.PORT || 4321);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
};

function resolveFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.resolve(root, relative);
  return file.startsWith(root + path.sep) ? file : null;
}

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  let file;
  try {
    file = resolveFile(request.url);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    const notFound = path.join(root, '404.html');
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    if (request.method === 'HEAD') response.end();
    else response.end(fs.readFileSync(notFound));
    return;
  }

  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': contentTypes[path.extname(file).toLowerCase()] || 'application/octet-stream',
  };
  response.writeHead(200, headers);
  if (request.method === 'HEAD') response.end();
  else fs.createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving dist/ at http://127.0.0.1:${port}`);
});
