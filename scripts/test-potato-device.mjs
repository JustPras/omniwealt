import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const POTATO_DIR = path.resolve(__dirname, '../test-results/potato-device');

if (!fs.existsSync(POTATO_DIR)) {
  fs.mkdirSync(POTATO_DIR, { recursive: true });
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startServer(port = 3458) {
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
    { id: 'acc-gopay-04', name: 'GoPay Utama', type: 'E-WALLET', accountNumber: '0812-0000-0001', balance: 850000, color: '#06B6D4', icon: 'smartphone', updatedAt: new Date().toISOString() },
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

async function runPotatoDeviceTest() {
  const port = 3458;
  const server = await startServer(port);
  const baseUrl = `http://localhost:${port}`;

  console.log('===============================================================');
  console.log(' SIMULASI PERANGKAT ENTRY-LEVEL / HP KENTANG RAM 2 GB');
  console.log(' Profil: Android 2GB RAM, CPU Throttling: 6x Slowdown, 360x780');
  console.log('===============================================================\n');

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
      '--window-size=360,780',
      '--js-flags="--max-old-space-size=256"', // 256MB V8 heap limit simulating 2GB RAM budget
    ],
  });

  const page = await browser.newPage();
  // Typical Indonesian budget phone resolution: 360x780 (Redmi 9A, Realme C11, Galaxy A03)
  await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2.0, isMobile: true, hasTouch: true });

  // Apply 6x CPU Throttling (Standard Low-End mobile benchmark)
  console.log('[Setup] Mengaktifkan 6x CPU Throttling (Simulasi Chipset Helio G25 / Snapdragon 439)...');
  await page.emulateCPUThrottling(6);

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`[PageError] ${err.toString()}`);
  });

  const report = {
    profile: {
      device: 'Budget Android Phone (2GB RAM class)',
      cpuThrottling: '6x Slowdown',
      viewport: '360x780 @ 2x DPR',
      v8MaxHeapMB: 256,
    },
    memory: {},
    coldStart: {},
    navigation: [],
    interactions: [],
    scrolling: [],
    domStats: {},
    errors: [],
  };

  try {
    // 1. Initial Load & Seed Data
    console.log('[Step 1] Memuat aplikasi dan menyuntikkan data demo...');
    await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 35000 });

    await page.evaluate((seed) => {
      localStorage.setItem('@omniwealth_accounts_v3', JSON.stringify(seed.accounts));
      localStorage.setItem('@omniwealth_stocks_v3', JSON.stringify(seed.stocks));
      localStorage.setItem('@omniwealth_cryptos_v3', JSON.stringify(seed.cryptos));
      localStorage.setItem('@omniwealth_liabilities_v3', JSON.stringify(seed.liabilities));
    }, DEMO_SEED);

    // Measure cold reload & hydration under 6x CPU slowdown
    const tStartLoad = Date.now();
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.length > 50, { timeout: 15000 });
    const coldStartTimeMs = Date.now() - tStartLoad;
    console.log(`[Step 1] Cold Start & Hidrasi selesai dalam: ${coldStartTimeMs} ms (6x Throttled)`);
    report.coldStart = {
      coldStartTimeMs,
      acceptableThresholdMs: 5000,
      isPass: coldStartTimeMs < 5000,
    };

    await delay(500);
    await page.screenshot({ path: path.join(POTATO_DIR, '01_potato_dashboard.png') });

    // Measure Memory Footprint
    const initialMetrics = await page.metrics();
    const initialMem = await page.evaluate(() => {
      // @ts-ignore
      const perfMem = window.performance && window.performance.memory;
      return perfMem ? {
        usedHeapMB: +(perfMem.usedJSHeapSize / (1024 * 1024)).toFixed(2),
        totalHeapMB: +(perfMem.totalJSHeapSize / (1024 * 1024)).toFixed(2),
      } : null;
    });

    const initHeapUsedMB = initialMem ? initialMem.usedHeapMB : +(initialMetrics.JSHeapUsedSize / (1024 * 1024)).toFixed(2);
    const initHeapTotalMB = initialMem ? initialMem.totalHeapMB : +(initialMetrics.JSHeapTotalSize / (1024 * 1024)).toFixed(2);
    console.log(`[RAM Benchmark] Penggunaan Memori Awal (Heap): ${initHeapUsedMB} MB / Total: ${initHeapTotalMB} MB (Batas aman RAM 2GB: < 80 MB)`);

    report.memory.initialUsedHeapMB = initHeapUsedMB;
    report.memory.initialTotalHeapMB = initHeapTotalMB;

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
          const droppedFrames = deltas.filter((d) => d > 33.3).length; // Dropped if < 30fps (>33.3ms)
          return {
            avgFps,
            droppedFrames,
            totalFrames: deltas.length,
            p95Delta: Math.round(deltas.sort((a, b) => a - b)[Math.floor(deltas.length * 0.95)] || avgDelta),
          };
        }
      };
    });

    // Helper to click tab
    async function clickTab(tabLabel) {
      const tabEl = await page.waitForSelector(`[role="tab"][aria-label="${tabLabel}"]`, { timeout: 4000 });
      if (tabEl) {
        await tabEl.click();
        return true;
      }
      return false;
    }

    // Helper for native click on element
    async function nativeClickText(text, exact = false) {
      const rect = await page.evaluate(({ text, exact }) => {
        const elements = Array.from(document.querySelectorAll('div, span, button, a, [role="button"]'));
        for (let el of elements) {
          const content = el.innerText ? el.innerText.trim() : '';
          const match = exact ? content === text : content.includes(text);
          if (match && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().width > 0) {
            const r = el.getBoundingClientRect();
            return { x: r.x + r.width / 2, y: r.y + r.height / 2, text: content };
          }
        }
        return null;
      }, { text, exact });

      if (rect) {
        await page.mouse.click(rect.x, rect.y);
        return { found: true, text: rect.text };
      }
      return { found: false };
    }

    // Helper to close modal
    async function nativeCloseModal() {
      const rect = await page.evaluate(() => {
        const closeBtn = document.querySelector('[aria-label="Tutup modal"], [aria-label*="Tutup"]');
        if (closeBtn) {
          const r = closeBtn.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        }
        return null;
      });
      if (rect) {
        await page.mouse.click(rect.x, rect.y);
        return { closed: true };
      }
      return { closed: false };
    }

    // ==========================================
    // 2. TEST MENU NAVIGATION UNDER 6X THROTTLING
    // ==========================================
    console.log('\n--- [Step 2] PENGUJIAN PINDAH MENU DENGAN 6x CPU SLOWDOWN ---');
    const tabsToTest = [
      { name: 'Portofolio', label: 'Portofolio', screenCheck: 'Nilai investasi', file: '02_potato_portfolio.png' },
      { name: 'Akun & Liabilitas', label: 'Akun', screenCheck: 'Total likuiditas kas', file: '03_potato_accounts.png' },
      { name: 'Sinkronisasi Otomatis', label: 'Sinkron', screenCheck: 'Pilar 3', file: '04_potato_sync.png' },
      { name: 'Ringkasan Utama', label: 'Ringkasan', screenCheck: 'Kekayaan bersih', file: '01_potato_dashboard_return.png' },
    ];

    for (const tab of tabsToTest) {
      const tStart = performance.now();
      await clickTab(tab.label);
      await delay(500); // allow spring animation
      const duration = Math.round(performance.now() - tStart);

      const bodyText = await page.evaluate(() => document.body.innerText);
      const isContentFound = bodyText.includes(tab.screenCheck);

      console.log(`[Pindah Menu] Tab "${tab.name}" transisi: ${duration} ms (6x Throttled) | Rendered: ${isContentFound}`);
      report.navigation.push({
        tab: tab.name,
        transitionMs: duration,
        verified: isContentFound,
        isSmooth: duration < 1200, // acceptable for budget 2GB device
      });

      await page.screenshot({ path: path.join(POTATO_DIR, tab.file) });
    }

    // ==========================================
    // 3. TEST BUTTON INTERACTIVITY UNDER 6X THROTTLE
    // ==========================================
    console.log('\n--- [Step 3] PENGUJIAN RESPON KLIK TOMBOL DENGAN 6x CPU SLOWDOWN ---');

    // 3a. Currency Toggle
    const tCurr0 = performance.now();
    await nativeClickText('USD', false);
    await delay(300);
    const bodyUsd = await page.evaluate(() => document.body.innerText);
    const hasDollar = bodyUsd.includes('$');
    const currLatency = Math.round(performance.now() - tCurr0);
    console.log(`[Tombol] Ganti Mata Uang (USD): ${currLatency} ms | Berhasil: ${hasDollar}`);

    await nativeClickText('IDR', false);
    await delay(300);

    report.interactions.push({
      name: 'Currency Toggle (IDR <-> USD)',
      latencyMs: currLatency,
      functional: hasDollar,
      isResponsive: currLatency < 600,
    });

    // 3b. Privacy Blur Toggle
    const tPriv0 = performance.now();
    const privacyBtn = await page.$('[aria-label="Sembunyikan saldo"]');
    if (privacyBtn) await privacyBtn.click();
    await delay(300);
    const maskedText = await page.evaluate(() => document.body.innerText);
    const hasMasking = maskedText.includes('••••');
    const privLatency = Math.round(performance.now() - tPriv0);
    console.log(`[Tombol] Sembunyikan Saldo (Privacy Blur): ${privLatency} ms | Berhasil: ${hasMasking}`);

    if (privacyBtn) await privacyBtn.click();
    await delay(250);

    report.interactions.push({
      name: 'Privacy Mode Blur Toggle',
      latencyMs: privLatency,
      functional: hasMasking,
      isResponsive: privLatency < 600,
    });

    // 3c. Timeframe Capsules (1H, 1M, 1B, 1T, Semua)
    const timeframes = ['1M', '1B', '1T', 'Semua', '1H'];
    let tfSuccess = 0;
    const tTf0 = performance.now();
    for (const tf of timeframes) {
      const res = await nativeClickText(tf, true);
      await delay(150);
      if (res.found) tfSuccess++;
    }
    const avgTfLatency = Math.round((performance.now() - tTf0) / timeframes.length);
    console.log(`[Tombol] Kapsul Rentang Waktu (1H, 1M, 1B, 1T, Semua): ${tfSuccess}/${timeframes.length} diklik, rata-rata respon: ${avgTfLatency} ms`);

    report.interactions.push({
      name: 'Timeframe Selection Capsules',
      avgLatencyMs: avgTfLatency,
      functional: tfSuccess >= 4,
      isResponsive: avgTfLatency < 400,
    });

    // 3d. Modal Tambah Rekening on Akun Tab
    console.log('\n[Tombol] Membuka Modal Tambah Rekening...');
    await clickTab('Akun');
    await delay(500);

    const tModal0 = performance.now();
    await nativeClickText('+ Tambah rekening', false);
    await delay(600);
    const modalOpened = await page.evaluate(() => document.body.innerText.includes('Tambah rekening baru'));
    const modalOpenMs = Math.round(performance.now() - tModal0);
    console.log(`[Modal 1] Tambah Rekening terbuka dalam: ${modalOpenMs} ms | Rendered: ${modalOpened}`);

    const closeRes1 = await nativeCloseModal();
    await delay(400);
    const modalClosed1 = await page.evaluate(() => !document.body.innerText.includes('Tambah rekening baru'));
    console.log(`[Modal 1] Tambah Rekening tertutup bersih: ${modalClosed1}`);

    report.interactions.push({
      name: 'Modal Tambah Rekening (Open & Close)',
      openLatencyMs: modalOpenMs,
      functional: modalOpened && modalClosed1,
      isResponsive: modalOpenMs < 900,
    });

    // 3e. Modal 1-Click Pay Liability on Akun Tab
    console.log('\n[Tombol] Membuka Modal 1-Click Pay Liability (Bayar Tagihan)...');
    // Scroll down to reveal Liabilities
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(400);

    const tPay0 = performance.now();
    await nativeClickText('Bayar', false);
    await delay(600);
    const payModalOpened = await page.evaluate(() => document.body.innerText.includes('Pelunasan / Bayar Tagihan'));
    const payModalOpenMs = Math.round(performance.now() - tPay0);
    console.log(`[Modal 2] Bayar Tagihan terbuka dalam: ${payModalOpenMs} ms | Rendered: ${payModalOpened}`);
    await page.screenshot({ path: path.join(POTATO_DIR, '05_potato_modal_pay.png') });

    // Test quick preset buttons inside Pay Liability modal
    const minPay = await nativeClickText('10% Min', false);
    await delay(200);
    const fullPay = await nativeClickText('100% Lunas', false);
    await delay(200);
    console.log(`[Modal 2] Chip Preset Tagihan diklik: 10% Min=${minPay.found}, 100% Lunas=${fullPay.found}`);

    const closeRes2 = await nativeCloseModal();
    await delay(400);
    const payModalClosed = await page.evaluate(() => !document.body.innerText.includes('Pelunasan / Bayar Tagihan'));
    console.log(`[Modal 2] Bayar Tagihan tertutup bersih: ${payModalClosed}`);

    report.interactions.push({
      name: 'Modal 1-Click Pay Tagihan & Presets',
      openLatencyMs: payModalOpenMs,
      functional: payModalOpened && payModalClosed,
      isResponsive: payModalOpenMs < 900,
    });

    // ==========================================
    // 4. TEST SCROLLING PERFORMANCE UNDER 6X THROTTLE
    // ==========================================
    console.log('\n--- [Step 4] PENGUJIAN FRAME RATE SCROLLING (6x CPU SLOWDOWN) ---');

    async function measurePotatoScroll(tabName, tabLabel) {
      await clickTab(tabLabel);
      await delay(500);

      await page.evaluate(() => window.__fpsTracker.start());

      // Perform continuous smooth scrolling down and up
      await page.evaluate(async () => {
        for (let i = 0; i < 25; i++) {
          window.scrollBy(0, 35);
          await new Promise((r) => setTimeout(r, 16));
        }
        await new Promise((r) => setTimeout(r, 80));
        for (let i = 0; i < 25; i++) {
          window.scrollBy(0, -35);
          await new Promise((r) => setTimeout(r, 16));
        }
      });

      const metrics = await page.evaluate(() => window.__fpsTracker.stop());
      console.log(`[Scroll Kentang] "${tabName}" -> Rata-rata FPS: ${metrics.avgFps} FPS, Frame Drop: ${metrics.droppedFrames}, P95 Frame Delta: ${metrics.p95Delta} ms`);

      report.scrolling.push({
        screen: tabName,
        avgFps: metrics.avgFps,
        droppedFrames: metrics.droppedFrames,
        p95DeltaMs: metrics.p95Delta,
        // Budget potato device criterion: >= 45 FPS is considered smooth, >= 30 FPS is acceptable
        isSmooth: metrics.avgFps >= 45,
        rating: metrics.avgFps >= 55 ? 'Sangat Mulus (A+)' : metrics.avgFps >= 45 ? 'Mulus Stabil (A)' : 'Cukup (B)',
      });
    }

    await measurePotatoScroll('Dashboard (Ringkasan)', 'Ringkasan');
    await measurePotatoScroll('Portofolio Aset', 'Portofolio');
    await measurePotatoScroll('Akun & Liabilitas', 'Akun');
    await measurePotatoScroll('Sinkronisasi Otomatis', 'Sinkron');

    // ==========================================
    // 5. FINAL MEMORY & DOM STATS BENCHMARK
    // ==========================================
    const finalMetrics = await page.metrics();
    const finalMem = await page.evaluate(() => {
      // @ts-ignore
      const perfMem = window.performance && window.performance.memory;
      return perfMem ? {
        usedHeapMB: +(perfMem.usedJSHeapSize / (1024 * 1024)).toFixed(2),
        totalHeapMB: +(perfMem.totalJSHeapSize / (1024 * 1024)).toFixed(2),
      } : null;
    });

    const finalHeapUsedMB = finalMem ? finalMem.usedHeapMB : +(finalMetrics.JSHeapUsedSize / (1024 * 1024)).toFixed(2);
    const finalHeapTotalMB = finalMem ? finalMem.totalHeapMB : +(finalMetrics.JSHeapTotalSize / (1024 * 1024)).toFixed(2);

    console.log('\n--- [Step 5] BENCHMARK AKHIR MEMORI & DOM NODES ---');
    console.log(`Penggunaan Heap Akhir: ${finalHeapUsedMB} MB (Delta: +${+(finalHeapUsedMB - initHeapUsedMB).toFixed(2)} MB)`);
    console.log(`Total Heap Teralokasi: ${finalHeapTotalMB} MB (Batas RAM 2GB: 256 MB)`);
    console.log(`Total DOM Nodes: ${finalMetrics.Nodes} nodes`);
    console.log(`Layout Passes: ${finalMetrics.LayoutCount}`);

    report.memory.finalUsedHeapMB = finalHeapUsedMB;
    report.memory.finalTotalHeapMB = finalHeapTotalMB;
    report.memory.heapDeltaMB = +(finalHeapUsedMB - initHeapUsedMB).toFixed(2);
    report.memory.safeMarginRatio = +(finalHeapUsedMB / 256 * 100).toFixed(1) + '% dari batas heap';

    report.domStats = {
      nodes: finalMetrics.Nodes,
      layoutCount: finalMetrics.LayoutCount,
      recalcStyleCount: finalMetrics.RecalcStyleCount,
    };

    report.errors = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Download the React DevTools'));
    console.log(`Fatal Error Konsol: ${report.errors.length}`);

  } catch (err) {
    console.error('[Potato Test Error]:', err);
    report.fatalError = err.message;
  } finally {
    await browser.close();
    server.close();
    console.log('[Setup] Server dan peramban ditutup.');
  }

  // Save report
  const reportPath = path.resolve(__dirname, '../test-results/potato-device/potato-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`[Done] Laporan pengujian HP Kentang disimpan di ${reportPath}`);
}

runPotatoDeviceTest();
