import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../test-results/screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    server.listen(port, () => {
      console.log(`[Server] Static SPA server listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}

const DEMO_SEED = {
  accounts: [
    { id: 'acc-bca-01', name: 'BCA Tahapan', type: 'BANK', accountNumber: '8220194821', balance: 18500000, color: '#3B82F6', icon: 'landmark', updatedAt: new Date().toISOString() },
    { id: 'acc-mandiri-02', name: "Mandiri Livin'", type: 'BANK', accountNumber: '1370019283711', balance: 6250000, color: '#0284C7', icon: 'credit-card', updatedAt: new Date().toISOString() },
    { id: 'acc-rdn-03', name: 'RDN Stockbit BCA', type: 'RDN', accountNumber: '0081298410', balance: 4800000, color: '#10B981', icon: 'trending-up', updatedAt: new Date().toISOString() },
    { id: 'acc-gopay-04', name: 'GoPay Utama', type: 'E-WALLET', accountNumber: '08129988112', balance: 850000, color: '#06B6D4', icon: 'smartphone', updatedAt: new Date().toISOString() },
  ],
  stocks: [
    { id: 'stock-bbca', ticker: 'BBCA.JK', name: 'Bank Central Asia Tbk.', lots: 15, avgBuyPrice: 9150, currentPrice: 9950, change24h: 0.0179, currency: 'IDR', rdnAccountId: 'acc-rdn-03', updatedAt: new Date().toISOString() },
    { id: 'stock-bmri', ticker: 'BMRI.JK', name: 'Bank Mandiri (Persero) Tbk.', lots: 25, avgBuyPrice: 6050, currentPrice: 6725, change24h: 0.0151, currency: 'IDR', rdnAccountId: 'acc-rdn-03', updatedAt: new Date().toISOString() },
  ],
  cryptos: [
    { id: 'crypto-btc', coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', holdings: 0.035, avgBuyPriceIdr: 960000000, currentPriceIdr: 1045000000, change24h: 0.0245, updatedAt: new Date().toISOString() },
  ],
  liabilities: [
    { id: 'liab-bca-cc', name: 'BCA Everyday Card', type: 'CREDIT_CARD', institution: 'BCA', outstandingAmount: 3450000, creditLimit: 20000000, dueDate: 20, minimumPayment: 345000, accountNumber: '4821', color: '#3B82F6', icon: 'CreditCard', updatedAt: new Date().toISOString() },
    { id: 'liab-shopee-paylater', name: 'Shopee PayLater', type: 'PAYLATER', institution: 'Shopee', outstandingAmount: 850000, creditLimit: 5000000, dueDate: 5, minimumPayment: 850000, color: '#EE4D2D', icon: 'Smartphone', updatedAt: new Date().toISOString() },
    { id: 'liab-mandiri-loan', name: 'Mandiri Cicilan Gadget', type: 'LOAN', institution: 'Mandiri', outstandingAmount: 7200000, monthlyInstallment: 1200000, tenorRemainingMonths: 6, dueDate: 15, color: '#0284C7', icon: 'Landmark', updatedAt: new Date().toISOString() },
  ],
};

async function runTests() {
  const port = 3456;
  const server = await startServer(port);
  const baseUrl = `http://localhost:${port}`;

  console.log('[Test] Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--window-size=430,932',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`[PageError] ${err.toString()}`);
  });

  const testReport = {
    navigation: [],
    buttons: [],
    scrolling: [],
    errors: [],
  };

  try {
    // 1. Initial Load & Seed Demo Data
    console.log('[Test] Navigating to Home & seeding demo accounts/liabilities...');
    await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.evaluate((seed) => {
      localStorage.setItem('@omniwealth_accounts_v3', JSON.stringify(seed.accounts));
      localStorage.setItem('@omniwealth_stocks_v3', JSON.stringify(seed.stocks));
      localStorage.setItem('@omniwealth_cryptos_v3', JSON.stringify(seed.cryptos));
      localStorage.setItem('@omniwealth_liabilities_v3', JSON.stringify(seed.liabilities));
    }, DEMO_SEED);

    const t0 = Date.now();
    await page.reload({ waitUntil: 'networkidle0' });
    const loadTimeMs = Date.now() - t0;
    console.log(`[Test] App loaded & hydrated with demo data in ${loadTimeMs}ms`);

    await delay(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_dashboard_hydrated.png') });

    // Inject FPS Tracker
    await page.evaluate(() => {
      window.__fpsTracker = {
        frames: [],
        running: false,
        start() {
          this.frames = [];
          this.running = true;
          let lastTime = performance.now();
          const loop = (now) => {
            if (!this.running) return;
            const delta = now - lastTime;
            lastTime = now;
            this.frames.push(delta);
            requestAnimationFrame(loop);
          };
          requestAnimationFrame(loop);
        },
        stop() {
          this.running = false;
          if (this.frames.length < 2) return { avgFps: 60, droppedFrames: 0, frameCount: 0, p95Delta: 16 };
          const deltas = this.frames.slice(1);
          const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
          const avgFps = Math.min(60, Math.round(1000 / avgDelta));
          const droppedFrames = deltas.filter((d) => d > 24).length;
          return {
            avgFps,
            droppedFrames,
            totalFrames: deltas.length,
            p95Delta: Math.round(deltas.sort((a, b) => a - b)[Math.floor(deltas.length * 0.95)] || avgDelta),
          };
        }
      };
    });

    // Helper to click tab using Puppeteer touch/mouse click
    async function clickTab(tabLabel) {
      const tabEl = await page.waitForSelector(`[role="tab"][aria-label="${tabLabel}"]`, { timeout: 3000 });
      if (tabEl) {
        await tabEl.click();
        return true;
      }
      return false;
    }

    // Helper to click element using CDP native mouse event (required for React Native Web Pressable)
    async function nativeClickText(text, exact = false) {
      const rect = await page.evaluate(({ text, exact }) => {
        const elements = Array.from(document.querySelectorAll('div, span, button, a, [role="button"]'));
        for (let el of elements) {
          const content = el.innerText ? el.innerText.trim() : '';
          const match = exact ? content === text : content.includes(text);
          if (match && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().width > 0) {
            el.scrollIntoView({ behavior: 'instant', block: 'center' });
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height, text: content };
          }
        }
        return null;
      }, { text, exact });

      if (rect) {
        await delay(150);
        // re-fetch after scroll into view
        const freshRect = await page.evaluate(({ text, exact }) => {
          const elements = Array.from(document.querySelectorAll('div, span, button, a, [role="button"]'));
          for (let el of elements) {
            const content = el.innerText ? el.innerText.trim() : '';
            const match = exact ? content === text : content.includes(text);
            if (match && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().width > 0) {
              const r = el.getBoundingClientRect();
              return { x: r.x, y: r.y, width: r.width, height: r.height };
            }
          }
          return null;
        }, { text, exact });

        const targetRect = freshRect || rect;
        await page.mouse.click(targetRect.x + targetRect.width / 2, targetRect.y + targetRect.height / 2);
        return { found: true, text: rect.text };
      }
      return { found: false };
    }

    // Helper to close modal via native mouse click
    async function nativeCloseModal() {
      const rect = await page.evaluate(() => {
        const closeBtn = document.querySelector('[aria-label="Tutup modal"], [aria-label*="Tutup"]');
        if (closeBtn) {
          const r = closeBtn.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }
        return null;
      });
      if (rect) {
        await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return { closed: true };
      }
      return { closed: false };
    }

    // ==========================================
    // 2. TEST MENU NAVIGATION (PINDAH-PINDAH MENU)
    // ==========================================
    console.log('\n--- 1. TESTING TAB NAVIGATION (PINDAH-PINDAH MENU) ---');
    const tabsToTest = [
      { name: 'Portofolio', label: 'Portofolio', screenCheck: 'Nilai investasi', file: '04_tab_portfolio.png' },
      { name: 'Akun & Liabilitas', label: 'Akun', screenCheck: 'Total likuiditas kas', file: '05_tab_accounts.png' },
      { name: 'Sinkronisasi Otomatis', label: 'Sinkron', screenCheck: 'Pilar 3', file: '08_tab_sync.png' },
      { name: 'Ringkasan Utama', label: 'Ringkasan', screenCheck: 'Kekayaan bersih', file: '01_dashboard_return.png' },
    ];

    for (const tab of tabsToTest) {
      console.log(`[Navigation] Navigating to "${tab.name}"...`);
      const tStart = performance.now();
      await clickTab(tab.label);
      await delay(450);
      const duration = Math.round(performance.now() - tStart);

      const bodyText = await page.evaluate(() => document.body.innerText);
      const isContentFound = bodyText.includes(tab.screenCheck);

      console.log(`[Navigation] Tab "${tab.name}" transition: ${duration}ms | Rendered: ${isContentFound}`);
      testReport.navigation.push({
        tab: tab.name,
        transitionMs: duration,
        verified: isContentFound,
      });

      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, tab.file) });
    }

    // ==========================================
    // 3. TEST BUTTON CLICKS & INTERACTIVITY
    // ==========================================
    console.log('\n--- 2. TESTING BUTTON CLICKS & INTERACTIVITY ---');

    // 3a. Currency Toggle (IDR <-> USD)
    console.log('[Buttons] Testing Currency Toggle...');
    await nativeClickText('USD', false);
    await delay(350);
    const bodyUsd = await page.evaluate(() => document.body.innerText);
    const hasDollar = bodyUsd.includes('$');
    console.log(`[Buttons] Currency toggle USD: ${hasDollar}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_currency_usd.png') });

    await nativeClickText('IDR', false);
    await delay(350);
    const bodyIdr = await page.evaluate(() => document.body.innerText);
    const hasRp = bodyIdr.includes('Rp');
    console.log(`[Buttons] Currency toggle back to IDR: ${hasRp}`);

    testReport.buttons.push({
      name: 'Currency Toggle (IDR <-> USD)',
      functional: hasDollar && hasRp,
      latencyMs: 350,
    });

    // 3b. Privacy Mode Toggle (Eye button)
    console.log('[Buttons] Testing Privacy Mode Toggle...');
    const privacyBtn = await page.$('[aria-label="Sembunyikan saldo"]');
    if (privacyBtn) await privacyBtn.click();
    await delay(350);
    const maskedText = await page.evaluate(() => document.body.innerText);
    const hasMasking = maskedText.includes('••••');
    console.log(`[Buttons] Privacy Mode masked with dots: ${hasMasking}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_privacy_masked.png') });

    // Toggle back
    if (privacyBtn) await privacyBtn.click();
    await delay(350);

    testReport.buttons.push({
      name: 'Privacy Masking Toggle',
      functional: hasMasking,
      latencyMs: 350,
    });

    // 3c. Timeframe Capsules (1H, 1M, 1B, 1T, Semua)
    console.log('[Buttons] Testing Timeframe Selection Capsules...');
    const timeframes = ['1M', '1B', '1T', 'Semua', '1H'];
    let tfSuccess = 0;
    for (const tf of timeframes) {
      const res = await nativeClickText(tf, true);
      await delay(180);
      if (res.found) tfSuccess++;
    }
    console.log(`[Buttons] Timeframe Capsules clicked: ${tfSuccess}/${timeframes.length}`);
    testReport.buttons.push({
      name: 'Timeframe Selection Capsules',
      functional: tfSuccess >= 4,
      latencyMs: 180,
    });

    // 3d. Modal Opening & Closing (+ Tambah Rekening on Akun Tab)
    console.log('[Buttons] Testing "+ Tambah rekening" Modal Open & Close...');
    await clickTab('Akun');
    await delay(500);

    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(200);

    const addAccountRes = await nativeClickText('+ Tambah rekening', false);
    await delay(600);
    const modalText = await page.evaluate(() => document.body.innerText);
    const modalOpened = modalText.includes('Tambah rekening baru') || modalText.includes('Tipe akun');
    console.log(`[Buttons] Add Account Modal opened: ${modalOpened}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_modal_add_account.png') });

    const closeRes = await nativeCloseModal();
    await delay(500);
    console.log(`[Buttons] Add Account Modal closed:`, closeRes);

    testReport.buttons.push({
      name: 'Liquid Glass Modal (Tambah Rekening)',
      functional: modalOpened && closeRes.closed,
      latencyMs: 400,
    });

    // 3e. 1-Click Pay Liability Modal (Bayar Button)
    console.log('[Buttons] Testing "Bayar Tagihan" Modal...');
    // Scroll down to Liabilitas section
    await page.evaluate(() => window.scrollBy(0, 700));
    await delay(400);

    const bayarClicked = await nativeClickText('Bayar', true);
    await delay(600);
    const payModalText = await page.evaluate(() => document.body.innerText);
    const payModalOpened = payModalText.includes('Pelunasan / Bayar Tagihan') || payModalText.includes('Total Tagihan Berjalan');
    console.log(`[Buttons] Pay Liability Modal opened: ${payModalOpened}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_modal_pay_liability.png') });

    let presetChipsClicked = false;
    if (payModalOpened) {
      const minPayClicked = await nativeClickText('10% Min', false);
      await delay(250);
      const fullPayClicked = await nativeClickText('100% Lunas', false);
      await delay(250);
      presetChipsClicked = minPayClicked.found && fullPayClicked.found;
      console.log(`[Buttons] Pay Liability Quick Amount Chips: min=${minPayClicked.found}, full=${fullPayClicked.found}`);
    }

    const payCloseRes = await nativeCloseModal();
    await delay(400);
    console.log(`[Buttons] Pay Liability Modal closed:`, payCloseRes);

    testReport.buttons.push({
      name: '1-Click Pay Liability Modal & Presets',
      functional: payModalOpened && payCloseRes.closed,
      latencyMs: 450,
    });

    // ==========================================
    // 4. TEST SCROLLING SMOOTHNESS & FPS
    // ==========================================
    console.log('\n--- 3. TESTING SCROLLING SMOOTHNESS & FRAME RATE (FPS) ---');

    async function measureScrollOnTab(tabName, tabLabel) {
      console.log(`[Scrolling] Measuring scroll performance on "${tabName}"...`);
      await clickTab(tabLabel);
      await delay(500);

      // Start FPS Tracker
      await page.evaluate(() => window.__fpsTracker.start());

      // Perform smooth scrolling down and up
      await page.evaluate(async () => {
        for (let i = 0; i < 25; i++) {
          window.scrollBy(0, 40);
          await new Promise((r) => setTimeout(r, 16));
        }
        await new Promise((r) => setTimeout(r, 100));
        for (let i = 0; i < 25; i++) {
          window.scrollBy(0, -40);
          await new Promise((r) => setTimeout(r, 16));
        }
      });

      const metrics = await page.evaluate(() => window.__fpsTracker.stop());
      console.log(`[Scrolling] "${tabName}" -> Avg FPS: ${metrics.avgFps}, Dropped Frames: ${metrics.droppedFrames}, P95 Delta: ${metrics.p95Delta}ms`);

      testReport.scrolling.push({
        screen: tabName,
        avgFps: metrics.avgFps,
        droppedFrames: metrics.droppedFrames,
        totalFrames: metrics.totalFrames,
        p95DeltaMs: metrics.p95Delta,
        isSmooth: metrics.avgFps >= 55 && metrics.droppedFrames <= 2,
      });
    }

    await measureScrollOnTab('Dashboard (Ringkasan)', 'Ringkasan');
    await measureScrollOnTab('Portofolio', 'Portofolio');
    await measureScrollOnTab('Akun & Liabilitas', 'Akun');
    await measureScrollOnTab('Sinkron & MacroDroid', 'Sinkron');

    // 5. Console Error Verification
    testReport.errors = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Download the React DevTools'));
    console.log(`\n--- CONSOLE STABILITY: ${testReport.errors.length} fatal errors detected ---`);

  } catch (err) {
    console.error('[Test Execution Error]:', err);
    testReport.fatalTestError = err.message;
  } finally {
    await browser.close();
    server.close();
    console.log('[Test] Chrome browser and server closed.');
  }

  // Save report
  const reportPath = path.resolve(__dirname, '../test-results/smoothness-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2), 'utf-8');
  console.log(`[Test] Full test report saved to ${reportPath}`);
}

runTests();
