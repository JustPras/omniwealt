import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST_DIR = 'd:/AI/anigravity/omniwealth-v2/dist';

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  let file = path.join(DIST_DIR, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST_DIR, 'index.html');
  res.writeHead(200);
  fs.createReadStream(file).pipe(res);
}).listen(3498);

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852 });
  await page.goto('http://localhost:3498');
  await delay(2000);

  // Click tab Akun
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const akunTab = tabs.find(t => t.getAttribute('aria-label') === 'Akun' || (t.innerText && t.innerText.includes('Akun')));
    if (akunTab) akunTab.click();
  });
  await delay(1000);

  const screenText = await page.evaluate(() => document.body.innerText);
  console.log('AKUN SCREEN TEXT:\n' + screenText);

  await browser.close();
  server.close();
}

main().catch(console.error);
