// Local harness for the same serverless handlers deployed by Vercel.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import productPage from '../api/product-page.js';
import ogImage from '../api/og.js';

const root = path.resolve('dist');
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    req.query = Object.fromEntries(url.searchParams);
    res.status = code => { res.statusCode = code; return res; };
    res.send = body => res.end(body);
    res.redirect = (code, location) => { res.statusCode = code; res.setHeader('Location', location); res.end(); };
    const legacy = url.pathname.match(/^\/share\/product\/([^/]+)$/);
    if (legacy) return res.redirect(307, `/product/${legacy[1]}`);
    const product = url.pathname.match(/^\/product\/([^/]+)$/);
    if (product) { req.query.id = decodeURIComponent(product[1]); return await productPage(req, res); }
    if (url.pathname === '/api/og') return await ogImage(req, res);
    let file = path.resolve(root, `.${url.pathname}`);
    if (!file.startsWith(root + path.sep)) file = path.join(root, 'index.html');
    let bytes;
    try { bytes = await fs.readFile(file); } catch { file = path.join(root, 'index.html'); bytes = await fs.readFile(file); }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(bytes);
  } catch (error) { console.error(error); res.statusCode = 500; res.end('Local preview error'); }
}).listen(5176, '127.0.0.1', () => console.log('Social preview ready on 5176'));
