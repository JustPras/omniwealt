import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

function startServer(port = 3456) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    let filePath = path.join(DIST_DIR, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading ' + reqPath);
      } else {
        res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function main() {
  const server = await startServer(3456);
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852 });
  await page.goto('http://localhost:3456');
  await new Promise(r => setTimeout(r, 2000));

  // Click Akun tab
  const tab = await page.waitForSelector('[role="tab"][aria-label="Akun"]');
  await tab.click();
  await new Promise(r => setTimeout(r, 1000));

  // Get coordinates of '+ Tambah rekening'
  const rect = await page.evaluate(() => {
    const textEl = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === '+ Tambah rekening');
    if (textEl) {
      const r = textEl.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }
    return null;
  });

  console.log('+ Tambah rekening rect:', rect);
  if (rect) {
    // Real CDP touch/mouse click via puppeteer
    await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
    console.log('Dispatched native mouse click at:', rect.x + rect.width / 2, rect.y + rect.height / 2);
  }
  await new Promise(r => setTimeout(r, 800));

  const modalPresent = await page.evaluate(() => {
    return document.body.innerText.includes('Tambah rekening baru');
  });
  console.log('Modal opened with native mouse click:', modalPresent);

  await browser.close();
  server.close();
}

main().catch(console.error);
