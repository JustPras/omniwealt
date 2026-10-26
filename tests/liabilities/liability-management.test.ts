import test from 'node:test';
import assert from 'node:assert';
import { LiabilityService } from '../../src/services/liability-service';
import { Liability, Account } from '../../src/types';

test('1. Perhitungan True Net Worth (Kekayaan Bersih Sejati = Gross Assets - Liabilities)', () => {
  const grossAssets = 150000000; // Rp 150 Juta (Kas + Saham + Kripto)

  const sampleLiabilities: Liability[] = [
    {
      id: 'cc-1',
      name: 'BCA Everyday Card',
      type: 'CREDIT_CARD',
      institution: 'BCA',
      outstandingAmount: 4500000,
      creditLimit: 20000000,
      dueDate: 20,
    },
    {
      id: 'paylater-1',
      name: 'Shopee PayLater',
      type: 'PAYLATER',
      institution: 'Shopee',
      outstandingAmount: 1500000,
      creditLimit: 5000000,
      dueDate: 5,
    },
    {
      id: 'loan-1',
      name: 'Cicilan Gadget',
      type: 'LOAN',
      institution: 'Mandiri',
      outstandingAmount: 6000000,
      monthlyInstallment: 1000000,
      dueDate: 15,
    },
  ];

  const summary = LiabilityService.calculateTrueNetWorth(grossAssets, sampleLiabilities);

  // Total utang = 4.5jt + 1.5jt + 6jt = 12jt
  assert.strictEqual(summary.grossAssets, 150000000);
  assert.strictEqual(summary.totalLiabilities, 12000000);
  // Net worth sejati = 150jt - 12jt = 138jt
  assert.strictEqual(summary.trueNetWorth, 138000000);
  // Rasio utang terhadap aset: 12jt / 150jt = 8.0%
  assert.strictEqual(summary.debtToAssetRatioPercent, 8.0);
});

test('2. Perhitungan Rasio Utilisasi Kredit (Credit Utilization Ratio)', () => {
  // Case A: Utilisasi Sehat (15% <= 30%)
  const utilHealthy = LiabilityService.calculateUtilization(3000000, 20000000);
  assert.strictEqual(utilHealthy.utilizationPercent, 15);
  assert.strictEqual(utilHealthy.isHighUtilization, false);

  // Case B: Utilisasi Tinggi (65% > 30%)
  const utilHigh = LiabilityService.calculateUtilization(13000000, 20000000);
  assert.strictEqual(utilHigh.utilizationPercent, 65);
  assert.strictEqual(utilHigh.isHighUtilization, true);

  // Case C: Tanpa Limit (Loan / Pinjaman Umum)
  const utilNoLimit = LiabilityService.calculateUtilization(5000000, 0);
  assert.strictEqual(utilNoLimit.utilizationPercent, 0);
  assert.strictEqual(utilNoLimit.isHighUtilization, false);
});

test('3. Deteksi Pengingat Tagihan Jatuh Tempo (Due Date Alerts)', () => {
  // Simulasi hari ini adalah tanggal 16 Oktober
  const mockToday = new Date('2026-10-16T10:00:00');

  const liabilities: Liability[] = [
    {
      id: 'l1',
      name: 'Shopee PayLater',
      type: 'PAYLATER',
      institution: 'Shopee',
      outstandingAmount: 850000,
      dueDate: 5, // Jatuh tempo tgl 5 -> Lewat / Overdue!
    },
    {
      id: 'l2',
      name: 'Mandiri Cicilan',
      type: 'LOAN',
      institution: 'Mandiri',
      outstandingAmount: 1200000,
      dueDate: 16, // Jatuh tempo tgl 16 -> Hari Ini (Due Today)!
    },
    {
      id: 'l3',
      name: 'BCA Card Everyday',
      type: 'CREDIT_CARD',
      institution: 'BCA',
      outstandingAmount: 2400000,
      dueDate: 20, // Jatuh tempo tgl 20 -> 4 hari lagi (Due Soon)!
    },
    {
      id: 'l4',
      name: 'Kredivo',
      type: 'PAYLATER',
      institution: 'Kredivo',
      outstandingAmount: 0, // Tagihan 0 -> Tidak perlu diingatkan
      dueDate: 28,
    },
  ];

  const alerts = LiabilityService.getDueAlerts(liabilities, mockToday);

  // Harus ada 3 tagihan aktif (l4 diabaikan karena saldo 0)
  assert.strictEqual(alerts.length, 3);

  // Urutan pertama: Overdue (Shopee PayLater tgl 5)
  assert.strictEqual(alerts[0].liability.name, 'Shopee PayLater');
  assert.strictEqual(alerts[0].isOverdue, true);

  // Urutan kedua: Due Today (Mandiri tgl 16)
  assert.strictEqual(alerts[1].liability.name, 'Mandiri Cicilan');
  assert.strictEqual(alerts[1].isDueToday, true);

  // Urutan ketiga: Due Soon (BCA tgl 20, sisa 4 hari)
  assert.strictEqual(alerts[2].liability.name, 'BCA Card Everyday');
  assert.strictEqual(alerts[2].daysLeft, 4);
  assert.strictEqual(alerts[2].isDueSoon, true);
});

test('4. Validasi Pembayaran Tagihan: Berhasil & Saldo Berkurang Akurat', () => {
  const liability: Liability = {
    id: 'cc-bca',
    name: 'BCA Everyday Card',
    type: 'CREDIT_CARD',
    institution: 'BCA',
    outstandingAmount: 3500000,
  };

  const bankAccount: Account = {
    id: 'acc-bca',
    name: 'BCA Tahapan',
    type: 'BANK',
    balance: 10000000,
  };

  // Pembayaran Sebagian: Rp 2.000.000
  const partialPayment = LiabilityService.validatePayment(liability, bankAccount, 2000000);
  assert.strictEqual(partialPayment.isValid, true);
  assert.strictEqual(partialPayment.remainingLiability, 1500000); // 3.5jt - 2jt = 1.5jt
  assert.strictEqual(partialPayment.remainingAccountBalance, 8000000); // 10jt - 2jt = 8jt

  // Pembayaran Penuh: Rp 3.500.000
  const fullPayment = LiabilityService.validatePayment(liability, bankAccount, 3500000);
  assert.strictEqual(fullPayment.isValid, true);
  assert.strictEqual(fullPayment.remainingLiability, 0); // Lunas
  assert.strictEqual(fullPayment.remainingAccountBalance, 6500000);
});

test('5. Validasi Pembayaran Tagihan: Penolakan Saldo Tidak Cukup & Nominal Tak Valid', () => {
  const liability: Liability = {
    id: 'cc-bca',
    name: 'BCA Everyday Card',
    type: 'CREDIT_CARD',
    institution: 'BCA',
    outstandingAmount: 5000000,
  };

  const poorAccount: Account = {
    id: 'acc-gopay',
    name: 'GoPay',
    type: 'E-WALLET',
    balance: 500000, // Hanya Rp 500rb
  };

  // Coba bayar Rp 1.000.000 dari saldo Rp 500.000
  const failBalance = LiabilityService.validatePayment(liability, poorAccount, 1000000);
  assert.strictEqual(failBalance.isValid, false);
  assert.ok(failBalance.error?.includes('tidak mencukupi'));

  // Coba bayar nominal 0 atau negatif
  const failZero = LiabilityService.validatePayment(liability, poorAccount, 0);
  assert.strictEqual(failZero.isValid, false);
  assert.ok(failZero.error?.includes('lebih besar dari Rp 0'));
});
