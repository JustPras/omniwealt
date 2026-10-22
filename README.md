# 💎 OmniWealth Tracker (v2.0)
### *True Native Android FinTech Net Worth & Multi-Asset Intelligence*

[![Build Native Android APK](https://github.com/JustPras/omniwealt/actions/workflows/build-native-apk.yml/badge.svg)](https://github.com/JustPras/omniwealt/actions/workflows/build-native-apk.yml)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-blue.svg)](https://github.com/JustPras/omniwealt)
[![React Native](https://img.shields.io/badge/React%20Native-0.76.9-61DAFB.svg?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-v52.0-000020.svg?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hermes](https://img.shields.io/badge/Engine-Hermes%20%2B%20New%20Arch-0052CC.svg)](https://hermesengine.dev/)

---

<p align="center">
  <img src="./assets/icon.png" width="160" height="160" style="border-radius: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" alt="OmniWealth App Icon" />
</p>

<p align="center">
  <b>Aplikasi pelacak kekayaan multi-aset (Saham IDX, Kripto, Kas Perbankan, dan RDN) berkinerja tinggi dengan antarmuka <i>Obsidian Glassmorphism</i> mewah, parser mutasi bank & QRIS berbasis AI, serta sinkronisasi otomatis dokumen Trade Confirmation broker saham.</b>
</p>

---

## 📱 Cara Download & Install APK di HP Android

Anda dapat langsung mengunduh file `.apk` yang dikompilasi secara otomatis oleh **GitHub Actions**:

1. Buka tab **[Actions di Repository](https://github.com/JustPras/omniwealt/actions)**.
2. Klik run alur kerja terbaru (**Build Native Android APK**).
3. Gulir ke bawah ke bagian **Artifacts**.
4. Klik dan unduh file **`OmniWealth-TrueNative-Android-APK`** (berupa file zip).
5. Ekstrak zip untuk mendapatkan file **`app-debug.apk`**.
6. Transfer file ke HP Android Anda (melalui USB, WhatsApp, Telegram, atau Google Drive).
7. Di HP Android: Buka file `.apk` &rarr; jika diminta, aktifkan **"Izinkan instalasi dari sumber tidak dikenal"** (*Allow install from unknown sources*) &rarr; ketuk **Install**.

---

## ✨ Fitur-Fitur Unggulan

### 1. 📊 Overview & Asymmetric Bento Grid
- **Hero Net Worth Pod:** Tampilan nilai total kekayaan yang super dominan dengan `tabular-nums` presisi finansial, persentase pertumbuhan harian, dan alokasi multi-segmen (Kas, Saham, Kripto).
- **Asymmetric 2-Column Bento:**
  - *Kolom Kiri:* Pod Investasi Aktif (Saham + Kripto) dengan kalkulasi otomatis *Unrealized PnL*.
  - *Kolom Kanan:* Pod Likuiditas Kas & RDN serta pintasan cepat `+ Catat Mutasi` & `Sync SoA`.
- **Top Movers:** Daftar aset saham dan kripto dengan pergerakan tertinggi hari ini.
- **Privacy Shield:** Tombol sensor privasi satu sentuhan (ikon mata) untuk menyamarkan nominal menjadi `Rp ••••••••`.

### 2. 🏦 Smart Banking Hub & Mutasi AI
- **Multi-Account Support:** Pengelolaan rekening bank (BCA, Mandiri), E-Wallet (GoPay, OVO), dan RDN (Rekening Dana Nasabah).
- **Smart AI Mutasi & QRIS Parser:**
  - Tempelkan teks notifikasi SMS/WhatsApp/Email dari transaksi perbankan atau QRIS.
  - Didukung oleh Gemini Flash + parser Regex lokal otomatis.
  - Sedia **3 Tombol Preset 1-Klik** untuk simulasi langsung:
    1. *QRIS Kopi Kenangan via BCA Tahapan* (otomatis potong saldo BCA).
    2. *BI-FAST Transfer Masuk Gaji ke Mandiri Livin'* (otomatis tambah saldo Mandiri).
    3. *Top up RDN Stockbit BCA dari BCA Tahapan* (otomatis transfer antar rekening).
- **Android Notification Interceptor Simulator:** Panel simulasi penangkapan notifikasi di latar belakang Android.

### 3. 📈 Portofolio Saham IDX & Kripto
- **Saham Indonesia (IDX):** Mendukung ticker `.JK` (`BBCA.JK`, `BMRI.JK`, `TLKM.JK`, `BBRI.JK`, dll.) dengan hitungan otomatis Lot (1 Lot = 100 lembar), harga rata-rata beli (Average Buy Price), dan harga pasar terkini.
- **Aset Kripto (IDR):** Pemantauan Bitcoin (BTC), Ethereum (ETH), Solana (SOL), dan koin lainnya langsung dalam konversi Rupiah dan perubahan harga 24 jam.
- **Live Market Data:** Integrasi endpoint pasar Yahoo Finance & CoinGecko dengan mekanisme *live-ticking realistic fallback* saat offline atau terkena limit.

### 4. 📄 Broker Statement of Account (SoA) Engine
- **Native Document Picker:** Dukungan pemilihan dokumen PDF atau gambar resmi dari broker sekuritas (Stockbit, Ajaib, IPOT, Mandiri Sekuritas, Indo Premier).
- **Password-Protected PDF Support:** Input opsional kata sandi untuk berkas PDF terenkripsi dari broker.
- **Trade Confirmation Parser:** Ekstraksi otomatis transaksi Beli/Jual saham dan Dividen tunai, verifikasi matematis penyelesaian dana (Settlement), dan otomatisasi penyesuaian saldo RDN serta rata-rata harga beli saham.
- **3 Preset Simulasi Trade Confirmation:** Uji coba instan tanpa perlu mengunggah dokumen sungguhan.

---

## 🎨 Sistem Desain: *Obsidian Glassmorphism*

| Token Desain | Spesifikasi | Keterangan |
|---|---|---|
| **Canvas Background** | `#080C14` | *Obsidian Slate* gelap pekat dengan efek kedalaman |
| **Glass Surface** | `BlurView (intensity: 40, tint: dark)` | Efek kaca buram perangkat keras asli |
| **Glass Border** | `1px solid rgba(255, 255, 255, 0.12)` | Batas kaca tipis dengan pantulan cahaya miring |
| **Accent Emerald** | `#10B981` | Kas, Saldo Bertambah, Profit & RDN |
| **Accent Sky Blue** | `#38BDF8` | Saham Indonesia (IDX) & Navigasi Aktif |
| **Accent Amber** | `#F59E0B` | Kripto & Fitur AI Pintar |
| **Accent Rose** | `#F43F5E` | Pengeluaran & Posisi Rugi (*Loss*) |
| **Typography** | `tabular-nums` + `selectable` | Seluruh angka uang sejajar secara monospaced |

---

## 🛠️ Tech Stack & Arsitektur

```
omniwealth-v2/
├── app/                           # Expo Router (Hanya Rute Navigasi)
│   ├── _layout.tsx                # Root layout dengan Ambient Orbs & Toast
│   └── (tabs)/                    # Floating Glass Bottom Navigation
│       ├── _layout.tsx            # Tab navigation bar dengan BlurView
│       ├── index.tsx              # Tab 1: Overview (Asymmetric Bento)
│       ├── accounts.tsx           # Tab 2: Smart Banking & AI Mutasi
│       ├── portfolio.tsx          # Tab 3: Saham IDX & Kripto
│       └── sync.tsx               # Tab 4: Broker SoA Statement Parser
│
├── src/                           # Logika Bisnis, Komponen & Layanan
│   ├── components/
│   │   ├── common/                # GlassCard, PrivacyValue, AmbientBackground, Icon
│   │   ├── layout/                # HeaderBar (Live ticker & Privacy toggle)
│   │   └── modals/                # Modal Form (Account, Stock, Crypto, Mutasi, Sim)
│   ├── services/
│   │   ├── ai-parser.ts           # Gemini Flash + Deterministic Parser Fallback
│   │   ├── market-service.ts      # Yahoo Finance IDX & CoinGecko IDR API
│   │   ├── storage-service.ts     # AsyncStorage Offline-First Engine
│   │   └── supabase-service.ts    # Skema Sinkronisasi Cloud Supabase
│   ├── store/
│   │   └── wealth-context.tsx     # State Manager & Portfolio Math Engine
│   ├── types/                     # TypeScript Strict Types
│   └── utils/                     # Format Rupiah, Haptic feedback Android
│
├── assets/                        # App Icon, Adaptive Icon, Splash Screen
├── supabase/                      # Skema PostgreSQL (schema.sql)
└── .github/workflows/             # CI/CD GitHub Actions Build APK
```

- **Runtime:** React Native 0.76.9 + Expo SDK 52 (Hermes Engine + New Architecture Enabled).
- **Navigation:** Expo Router v4 (File-based routing).
- **Icons:** `@expo/vector-icons` (`Ionicons` & `MaterialCommunityIcons`) yang ringan dan bebas konflik build native.
- **Storage:** Offline-first dengan `@react-native-async-storage/async-storage` + template cloud Supabase PostgreSQL.
- **Haptics:** `expo-haptics` untuk getaran responsif di setiap interaksi penting.

---

## 💻 Panduan Menjalankan Secara Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau 20
- npm atau pnpm
- Expo Go di HP atau Emulator Android (opsional, aplikasi juga mendukung mode Web)

### 1. Kloning Repository
```bash
git clone https://github.com/JustPras/omniwealt.git
cd omniwealt
```

### 2. Instalasi Dependensi
```bash
npm install --legacy-peer-deps
```

### 3. Jalankan Server Pengembangan
```bash
# Jalankan di browser Web (Preview instan)
npm run web

# Jalankan dengan Expo Dev Client / Android Emulator
npm run android
```

### 4. Build APK Android Lokal (Opsional)
Jika Anda memiliki Android Studio dan Android SDK terpasang di komputer:
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```
File APK akan berada di `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🔐 Keamanan & Privasi Data

- **Penyimpanan Lokal:** Secara default seluruh data saldo, transaksi, dan portofolio Anda tersimpan di penyimpanan internal perangkat (`AsyncStorage`) dan tidak pernah dikirim ke server luar tanpa persetujuan.
- **Offline Parser:** Fitur ekstraksi notifikasi bank dan dokumen broker dilengkapi parser lokal pintar, sehingga fitur tetap berfungsi 100% tanpa memerlukan koneksi internet maupun API key eksternal.
- **Sensor Privasi:** Mode privasi menyamarkan seluruh nominal angka di layar untuk keamanan saat membuka aplikasi di tempat umum.

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan pelacakan portofolio finansial pribadi dan edukasi arsitektur True Native React Native. Didistribusikan di bawah lisensi [MIT](LICENSE).
