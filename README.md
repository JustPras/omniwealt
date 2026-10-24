# 💎 OmniWealth (v2.0)
### *Personal Multi-Asset Wealth & Net Worth Intelligence*

[![Build Native Android APK](https://github.com/JustPras/omniwealt/actions/workflows/build-native-apk.yml/badge.svg)](https://github.com/JustPras/omniwealt/actions/workflows/build-native-apk.yml)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-0284C7.svg)](https://github.com/JustPras/omniwealt)
[![React Native](https://img.shields.io/badge/React%20Native-0.76.9-61DAFB.svg?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-v52.0-000020.svg?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Private-EF4444.svg)](README.md)

---

<p align="center">
  <img src="./assets/icon.png" width="140" height="140" style="border-radius: 32px; box-shadow: 0 12px 36px rgba(0,0,0,0.6);" alt="OmniWealth App Icon" />
</p>

<p align="center">
  <b>Aplikasi pelacak total kekayaan bersih (Net Worth) multi-aset pribadi: Kas Perbankan, E-Wallet, RDN, Saham IDX Indonesia (Lot), dan Kripto dengan antarmuka <i>Obsidian Glassmorphism</i> mewah, parser mutasi bank berbasis AI, dan pembaca statement transaksi broker (Stockbit, dll).</b>
</p>

---

## 🚀 Sekilas Proyek

**OmniWealth** dikembangkan sebagai solusi independen (*private project*) untuk mencatat, memantau, dan menganalisis seluruh portofolio aset keuangan pribadi dalam satu dashboard terpadu.

Aplikasi ini dibangun menggunakan arsitektur **True Native React Native & Expo SDK 52** dengan mesin Hermes dan *New Architecture* aktif untuk performa tinggi, bebas lag, dan transisi layar mulus.

---

## ✨ Fitur-Fitur Utama

### 1. 📊 Dashboard Net Worth & Asymmetric Bento
- **Total Net Worth Real-Time:** Perhitungan otomatis nilai bersih portofolio dari akumulasi Kas, Saham IDX, dan Kripto.
- **Micro-Sparklines:** Visualisasi tren portofolio ringkas di setiap kartu ringkasan aset.
- **Multi-Timeframe Analysis:** Pantau perubahan nilai harian (1H), mingguan (1M), bulanan (1B), tahunan (1T), hingga *all-time*.
- **Privacy Shield:** Sensor privasi satu sentuhan (tombol mata pada header) untuk menyamarkan nominal nominal menjadi `Rp ••••••••` saat membuka aplikasi di tempat umum.
- **Top Movers:** Pemantauan instan saham dan kripto dengan kenaikan/penurunan harga paling signifikan hari ini.

### 2. 🏦 Smart Banking & AI Mutasi Transaksi
- **Manajemen Multi-Rekening:** Kelola saldo rekening bank (BCA, Mandiri, BRI, BNI), Dompet Digital (GoPay, OVO, Dana), dan Rekening Dana Nasabah (RDN).
- **Parser Mutasi AI (Gemini + Regex Lokal):** Cukup salin dan tempel teks notifikasi mutasi perbankan, SMS banking, atau transaksi QRIS. Sistem secara otomatis mendeteksi tipe transaksi (debit/kredit), nominal uang, dan rekening terkait.
- **1-Click Simulation Presets:** Dilengkapi tombol preset untuk menguji pencatatan mutasi secara instan:
  1. *QRIS Jajan / Merchant* (otomatis potong saldo rekening terpilih).
  2. *Gaji Masuk via BI-FAST* (otomatis tambah saldo tabungan).
  3. *Top-Up Saldo RDN* (otomatis pindah buku antar kas dan RDN).

### 3. 📈 Portofolio Saham IDX & Kripto
- **Saham Indonesia (Bursa Efek Indonesia):**
  - Mendukung ticker saham Indonesia (`BBCA.JK`, `BMRI.JK`, `TLKM.JK`, `BBRI.JK`, dll.).
  - Perhitungan otomatis satuan **Lot** (1 Lot = 100 lembar saham).
  - Kalkulasi *Average Buy Price* (harga rata-rata beli) dan *Unrealized PnL* (keuntungan/kerugian belum terealisasi).
- **Aset Kripto (IDR):**
  - Pemantauan Bitcoin (BTC), Ethereum (ETH), Solana (SOL), dan aset kripto lainnya dalam denominasi Rupiah.
- **Instant Search & Filter:** Filter pencarian instan untuk menemukan aset saham atau kripto dengan cepat.
- **Market Data Feeds:** Integrasi harga pasar real-time dengan mekanisme *offline fallback* cerdas.

### 4. 📄 Pembaca Statement Transaksi Broker (Stockbit & Sekuritas)
- **Import Statement of Account (SoA):** Membaca berkas Trade Confirmation / Statement dari broker saham seperti **Stockbit**, IPOT, Ajaib, Mandiri Sekuritas, dan lainnya.
- **Dukungan Format PDF & Gambar:** Membaca dokumen resmi konfirmasi perdagangan bursa.
- **Dukungan Password PDF:** Input kata sandi untuk berkas PDF terenkripsi dari pihak sekuritas.
- **Otomatisasi Portofolio Saham & Kas RDN:**
  - Transaksi **Beli (BUY):** Menambah jumlah lot saham, menghitung rata-rata harga beli baru, dan memotong saldo kas RDN.
  - Transaksi **Jual (SELL):** Mengurangi lot saham dan menambah saldo RDN sesuai hasil penjualan bersih.
  - Pembagian **Dividen Tunai:** Menambah saldo kas RDN secara otomatis.

### 5. 🛡️ Fresh 0-Data State & Demo Mode
- **Clean State untuk Pengguna Baru:** Aplikasi dibuka pertama kali dengan saldo Rp 0 dan *empty-state guidance* yang rapi di setiap tab.
- **Load Demo Data:** Opsi memuat dataset simulasi lengkap untuk menguji tampilan aplikasi.
- **Reset All Data:** Opsi membersihkan seluruh data portofolio kapan saja melalui tab Rekening.

---

## 🎨 Desain Sistem: *Obsidian Glassmorphism*

| Token Desain | Spesifikasi | Penerapan |
|---|---|---|
| **Canvas Background** | `#080C14` | *Obsidian Slate* gelap pekat hemat daya (OLED friendly) |
| **Glass Surface** | `BlurView` (dark tint, 40 intensity) | Kartu kaca buram dengan rim highlight atas |
| **Glass Border** | `1px solid rgba(255, 255, 255, 0.10)` | Kontur kaca semi-transparan presisi |
| **Accent Emerald** | `#10B981` | Kas, saldo bertambah, laba/profit, status live |
| **Accent Sky Blue** | `#38BDF8` | Saham IDX, instrumen pasar modal, navigasi aktif |
| **Accent Amber** | `#F59E0B` | Kripto & fitur parser cerdas |
| **Accent Rose** | `#F43F5E` | Mutasi pengeluaran & posisi rugi (*unrealized loss*) |
| **Typography** | `tabular-nums` | Angka uang tersusun rapi secara monospaced |

---

## 🛠️ Arsitektur & Teknologi

```
omniwealth-v2/
├── app/                           # File-based Navigation (Expo Router v4)
│   ├── _layout.tsx                # Root layout, theme provider & smooth splash transition
│   └── (tabs)/                    # Floating bottom navigation
│       ├── _layout.tsx            # Tab navigation bar dengan BlurView
│       ├── index.tsx              # Tab 1: Overview Dashboard (Bento Grid)
│       ├── accounts.tsx           # Tab 2: Smart Banking & Mutasi AI
│       ├── portfolio.tsx          # Tab 3: Saham IDX & Kripto
│       └── sync.tsx               # Tab 4: Broker Statement Parser (Stockbit, dll)
│
├── src/                           # Core Logic, Components & Services
│   ├── components/
│   │   ├── common/                # GlassCard, Sparkline, PrivacyValue, LogoIcon, Icon
│   │   ├── layout/                # HeaderBar (Live ticker, Brand logo, Privacy toggle)
│   │   └── modals/                # Modal Form (Account, Stock, Crypto, Mutasi, SoA)
│   ├── constants/
│   │   └── initial-data.ts        # Inisialisasi 0-data & demo fixtures
│   ├── services/
│   │   ├── ai-parser.ts           # Gemini Flash + Deterministic Parser Fallback
│   │   ├── market-service.ts      # Live ticker & fallback engine
│   │   └── storage-service.ts     # AsyncStorage Offline-First Engine
│   ├── store/
│   │   └── wealth-context.tsx     # State Manager, Portfolio Math & Hydration
│   ├── types/                     # TypeScript Strict Definitions
│   └── utils/                     # Format Rupiah, kalkulasi lot, haptic feedback
│
├── assets/                        # Logo 3D Omni-W Crystal, App Icon, Splash Screen
└── .github/workflows/             # CI/CD GitHub Actions Build APK
```

- **Framework:** React Native 0.76.9 + Expo SDK 52
- **Compiler / Engine:** Hermes Engine + New Architecture
- **Routing:** Expo Router v4
- **Icon Engine:** `@expo/vector-icons` (`Ionicons` & `MaterialCommunityIcons`) — *Bebas dependensi SVG native kompleks yang rentan memecah build Android*
- **Offline Storage:** `@react-native-async-storage/async-storage` (100% lokal di perangkat)
- **Haptic:** `expo-haptics` untuk feedback getaran taktil

---

## 📱 Panduan Download & Pasang APK (Android)

File `.apk` Android dikompilasi secara otomatis setiap ada pembaruan kode melalui **GitHub Actions**:

1. Buka tab **[Actions di Repository](https://github.com/JustPras/omniwealt/actions)**.
2. Pilih alur kerja terbaru (**Build Native Android APK**).
3. Gulir ke bagian **Artifacts** di bawah halaman.
4. Unduh file zip bernama **`OmniWealth-TrueNative-Android-APK`**.
5. Ekstrak zip untuk memperoleh file **`app-release.apk`**.
6. Salin file APK ke smartphone Android Anda.
7. Di smartphone: Buka file `.apk` &rarr; izinkan instalasi dari sumber tidak dikenal (*Allow from unknown sources*) &rarr; pasang aplikasi.

---

## 💻 Panduan Menjalankan Secara Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) v18 atau v20
- npm atau pnpm
- Expo Go atau Emulator Android

### 1. Kloning Repository
```bash
git clone https://github.com/JustPras/omniwealt.git
cd omniwealt
```

### 2. Instalasi Dependensi
```bash
npm install --legacy-peer-deps
```

### 3. Menjalankan Aplikasi
```bash
# Mode Web Browser (Preview Cepat)
npm run web

# Mode Android (Emulator / Expo Go)
npm run android
```

---

## 🔐 Keamanan & Privasi Data

- **Offline-First & Local Storage:** Seluruh riwayat mutasi rekening, saldo akun, lot saham, dan portofolio Anda tersimpan secara lokal di memori internal perangkat (`AsyncStorage`).
- **Tanpa Pengiriman Data Eksternal:** Aplikasi tidak mengirimkan nominal portofolio maupun dokumen finansial pribadi Anda ke server pihak ketiga manapun.
- **Sensor Privasi Terintegrasi:** Tombol privasi instan memungkinkan Anda menggunakan aplikasi secara aman di tempat umum tanpa khawatir saldo terbaca oleh orang lain.

---

## ⚖️ Hak Cipta & Lisensi

Proyek ini adalah **perangkat lunak kepemilikan pribadi (*Private & Proprietary Project*)** yang dikembangkan oleh **[@JustPras](https://github.com/JustPras)** untuk keperluan pencatatan dan pelacakan portofolio finansial pribadi.

**Hak Cipta Dilindungi Undang-Undang (*All Rights Reserved*).**  
Kode sumber, aset visual, logo, dan desain aplikasi ini tidak dilisensikan di bawah lisensi publik open-source (bukan lisensi MIT/GPL/Apache) dan tidak diizinkan untuk didistribusikan ulang, dikloning untuk tujuan komersial, atau dipublikasikan kembali tanpa izin tertulis dari pemilik proyek.
