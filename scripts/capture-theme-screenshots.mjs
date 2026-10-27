import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3458;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('test-results/theme-screenshots');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
  };
  return map[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  let safePath = path.join(DIST_DIR, reqPath);
  if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
    safePath = path.join(DIST_DIR, 'index.html');
  }
  const content = fs.readFileSync(safePath);
  res.writeHead(200, { 'Content-Type': getMime(safePath) });
  res.end(content);
});

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 30000 });

  await new Promise(r => setTimeout(r, 2000));

  // 1. Dark Mode Screenshot (Default)
  const nightPath = path.join(OUTPUT_DIR, '01_night_mode.png');
  await page.screenshot({ path: nightPath });
  console.log('Captured Night Mode screenshot');

  // 2. Click Theme Toggle Button to switch to Light Mode (Day)
  const themeButton = await page.$('div[aria-label*="Beralih ke tema terang"]');
  if (themeButton) {
    await themeButton.click();
    console.log('Clicked theme toggle button');
    await new Promise(r => setTimeout(r, 1500));
  } else {
    // Try finding button with Sun or Moon icon
    const buttons = await page.$$('div[role="button"]');
    for (const b of buttons) {
      const label = await page.evaluate(el => el.getAttribute('aria-label'), b);
      if (label && label.includes('tema')) {
        await b.click();
        console.log('Clicked theme toggle by aria-label');
        await new Promise(r => setTimeout(r, 1500));
        break;
      }
    }
  }

  // 3. Day Mode Screenshot
  const dayPath = path.join(OUTPUT_DIR, '02_day_mode.png');
  await page.screenshot({ path: dayPath });
  console.log('Captured Day Mode screenshot');

  await browser.close();
  server.close();
  console.log('Done!');
});
