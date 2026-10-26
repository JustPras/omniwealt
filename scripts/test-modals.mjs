import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../test-results/screenshots');

function startServer(port = 3457) {
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

const DEMO_SEED = {
  accounts: [
    { id: 'acc-bca-01', name: 'BCA Tahapan', type: 'BANK', accountNumber: '8220194821', balance: 18500000, color: '#3B82F6', icon: 'landmark', updatedAt: new Date().toISOString() },
    { id: 'acc-mandiri-02', name: "Mandiri Livin'", type: 'BANK', accountNumber: '1370019283711', balance: 6250000, color: '#0284C7', icon: 'credit-card', updatedAt: new Date().toISOString() },
  ],
  stocks: [],
  cryptos: [],
  liabilities: [
    { id: 'liab-bca-cc', name: 'BCA Everyday Card', type: 'CREDIT_CARD', institution: 'BCA', outstandingAmount: 3450000, creditLimit: 20000000, dueDate: 20, minimumPayment: 345000, accountNumber: '4821', color: '#3B82F6', icon: 'CreditCard', updatedAt: new Date().toISOString() },
  ],
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const server = await startServer(3457);
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852 });
  await page.goto('http://localhost:3457');

  // Seed demo data
  await page.evaluate((seed) => {
    localStorage.setItem('@omniwealth_accounts_v3', JSON.stringify(seed.accounts));
    localStorage.setItem('@omniwealth_stocks_v3', JSON.stringify(seed.stocks));
    localStorage.setItem('@omniwealth_cryptos_v3', JSON.stringify(seed.cryptos));
    localStorage.setItem('@omniwealth_liabilities_v3', JSON.stringify(seed.liabilities));
  }, DEMO_SEED);

  await page.reload({ waitUntil: 'networkidle0' });
  await delay(1000);

  // 1. Switch to Akun Tab
  const tab = await page.waitForSelector('[role="tab"][aria-label="Akun"]');
  await tab.click();
  await delay(800);

  // 2. Click "+ Tambah rekening"
  const addBtnRect = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === '+ Tambah rekening');
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return null;
  });

  if (addBtnRect) {
    await page.mouse.click(addBtnRect.x, addBtnRect.y);
  }
  await delay(600);

  const accountModalOpened = await page.evaluate(() => document.body.innerText.includes('Tambah rekening baru'));
  console.log('[Modal 1] Add Account Modal Opened:', accountModalOpened);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal_add_account_verified.png') });

  // Close modal via close button
  const closeBtn1 = await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Tutup modal"]');
    if (btn) {
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return null;
  });
  if (closeBtn1) {
    await page.mouse.click(closeBtn1.x, closeBtn1.y);
  }
  await delay(600);

  const accountModalClosed = await page.evaluate(() => !document.body.innerText.includes('Tambah rekening baru'));
  console.log('[Modal 1] Add Account Modal Closed:', accountModalClosed);

  // 3. Scroll down inside the page to reveal Liability "Bayar" button
  await page.evaluate(() => {
    // Find scrollable container or scroll window
    window.scrollBy(0, 500);
  });
  await delay(500);

  // Find Bayar button
  const bayarBtnRect = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === 'Bayar');
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return null;
  });

  console.log('Bayar button coordinates:', bayarBtnRect);
  if (bayarBtnRect) {
    await page.mouse.click(bayarBtnRect.x, bayarBtnRect.y);
    await delay(600);

    const payModalOpened = await page.evaluate(() => document.body.innerText.includes('Pelunasan / Bayar Tagihan'));
    console.log('[Modal 2] Pay Liability Modal Opened:', payModalOpened);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal_pay_liability_verified.png') });

    // Test quick preset buttons inside Pay Liability modal
    const chipsRect = await page.evaluate(() => {
      const chip10 = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('10% Min'));
      if (chip10) {
        const r = chip10.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }
      return null;
    });

    if (chipsRect) {
      await page.mouse.click(chipsRect.x, chipsRect.y);
      await delay(300);
      console.log('[Modal 2] Clicked 10% Min Payment preset!');
    }

    // Close pay liability modal
    const closeBtn2 = await page.evaluate(() => {
      const btn = document.querySelector('[aria-label="Tutup modal"]');
      if (btn) {
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }
      return null;
    });
    if (closeBtn2) {
      await page.mouse.click(closeBtn2.x, closeBtn2.y);
    }
    await delay(500);

    const payModalClosed = await page.evaluate(() => !document.body.innerText.includes('Pelunasan / Bayar Tagihan'));
    console.log('[Modal 2] Pay Liability Modal Closed:', payModalClosed);
  }

  await browser.close();
  server.close();
}

main().catch(console.error);
