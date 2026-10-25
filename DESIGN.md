# DESIGN.md — OmniWealth (Liquid Glass × Apple Modern)

Untuk agen (Antigravity, Claude Code, dll.): baca file ini sebelum menulis atau mengubah UI apa pun.
Stack: Expo SDK 52, React Native 0.76, expo-router 4, `StyleSheet`. Tidak ada Tailwind atau shadcn di proyek ini.

## 1. Konsep

**Subjek.** Pelacak kekayaan bersih pribadi multi-aset (kas bank, e-wallet, RDN, saham IDX dalam lot, kripto), berbahasa Indonesia, dipakai satu orang dan sering dibuka di tempat umum.
**Tugas utama.** Dalam satu pandangan: berapa kekayaan bersih saya sekarang dan apa yang berubah. Tugas kedua: mencatat mutasi dan mengimpor statement broker dengan cepat.

**Gaya: Apple Liquid Glass, bersih dan minimal.** Kaca bukan sekadar blur. Ciri yang ditiru:
1. **Lensing.** Tepi kaca membelokkan dan memperbesar cahaya di belakangnya.
2. **Specular hidup.** Kilap bergeser mengikuti sentuhan, scroll, dan kemiringan perangkat.
3. **Cair.** Kapsul seleksi meluncur dan meregang seperti tetesan, sheet tumbuh dari tombol yang membukanya.
4. **Lapisan fungsional.** Kaca terutama untuk navigasi dan kontrol yang melayang di atas konten. Konten (kartu data) lebih tenang.
5. **Sudut konsentris.** Radius dalam = radius luar dikurangi padding; kontrol berbentuk kapsul.

**Palet Apple Modern** (4 warna): putih `#F5F5F7`, hitam `#1D1D1F`, abu `#AAAAAA`, biru `#007AFF`. Aplikasi mengikuti mode sistem: terang memakai putih sebagai canvas dan hitam sebagai teks, gelap sebaliknya. Palet ini hampir monokrom dengan satu aksen, jadi risikonya bukan generik melainkan datar. Karena itu seluruh "keberanian" dikumpulkan di dua tempat: kaca yang hidup dan hero yang bisa di-scrub.

**Satu hal yang berani.** Angka kekayaan bersih di hero bisa di-scrub: geser jari di grafik, angka dan tanggal ikut berubah, haptic berdetak tiap titik data, lepas jari dan angka kembali ke nilai live. Semua elemen lain tenang supaya momen ini menonjol.

## 2. Aturan keras

1. Semua warna, radius, spasi, shadow, dan durasi diambil dari `src/theme/tokens.ts` lewat `useTheme()`. Dilarang hex atau angka mentah di komponen.
2. Satu warna satu arti:
   - `tint` (biru): satu-satunya warna interaksi (tombol utama, tab aktif, tautan, fokus) dan juga garis serta kursor scrub di hero, titik LIVE.
   - `text`, `textMuted`, `textFaint`: hierarki teks. `textFaint` hanya untuk ikon nonaktif dan hairline.
   - `gain` dan `loss`: hanya angka naik dan turun.
   - `asset.*`: hanya penanda kelas aset (titik, segmen bar), tidak pernah untuk teks angka.
3. Shadow selalu hitam. Tidak ada glow berwarna. Cahaya datang dari rim, isi permukaan, dan lapisan specular.
4. Gradient hanya dua jenis: kilap kaca (putih ke transparan) dan rim kaca. Tidak ada gradient berwarna, gradient pada teks, atau orb dekoratif. Cahaya latar maksimal dua sumber (bagian 5).
5. Tidak ada kaca di atas kaca. Elemen `lens` tidak diletakkan di dalam kartu `frost`. Kontrol di dalam kartu memakai permukaan `inset` tanpa blur.
6. Maksimal dua tingkat wadah: kartu, lalu baris di dalam kartu dipisah hairline. Tidak ada kartu di dalam kartu. Data berupa daftar menjadi satu kartu berisi baris.
7. Label memakai sentence case. Tidak ada label ALL CAPS ber-letterSpacing. Ticker (BBCA, BTC) memang huruf besar.
8. `Pressable`, bukan `TouchableOpacity`. Umpan balik sentuh per peran (bagian 6).
9. Animasi hanya `transform` dan `opacity`, memakai native driver atau Reanimated. Intensitas blur tidak pernah dianimasikan; animasikan opacity lapisan di atasnya.
10. Animasi masuk hanya untuk momen langka (pertama kali buka app per sesi). Pindah tab tidak memutar ulang animasi masuk.
11. Satu keluarga ikon lewat wrapper `Icon`. Tidak ada emoji sebagai ikon.
12. Semua angka uang memakai `PrivacyValue` dan `fontVariant: ['tabular-nums']`.
13. Teks informatif minimal 4,5:1 kontras di kedua mode. Teks di atas isi `tint` minimal 17px dan semibold.
14. Jangan menambah layar, kartu, atau efek di luar permintaan. Kurangi satu hiasan sebelum menyerahkan hasil.

## 3. Token

Salin ke `src/theme/tokens.ts`. Empat warna palet dipakai apa adanya; sisanya turunan yang dijelaskan di bawah blok kode.

```ts
import { useColorScheme } from 'react-native';

export const themes = {
  light: {
    canvas: '#F5F5F7',
    text: '#1D1D1F',
    textMuted: '#6E6E73',
    textFaint: '#AAAAAA',
    tint: '#007AFF',
    tintText: '#0066CC', // tautan dan teks biru
    onTint: '#FFFFFF',
    glass: {
      frost: 'rgba(255,255,255,0.62)', // kartu konten
      lens: 'rgba(255,255,255,0.48)', // hero, tab bar, sheet, tombol melayang
      inset: 'rgba(29,29,31,0.05)', // input, chip, segmen di dalam kartu
      tint: 'rgba(0,122,255,0.88)', // tombol utama, kapsul aktif
    },
    rim: { hi: 'rgba(255,255,255,0.95)', mid: 'rgba(255,255,255,0.35)', lo: 'rgba(0,122,255,0.35)' },
    hairline: 'rgba(29,29,31,0.08)',
    gain: '#1E7A37',
    loss: '#D70015',
    asset: { cash: '#AAAAAA', stock: '#1D1D1F', crypto: '#FF9500' },
    lights: [
      { color: '#007AFF', alpha: 0.16, at: 'topLeft' },
      { color: '#AAAAAA', alpha: 0.22, at: 'bottomRight' },
    ],
    elev: { e1: 0.1, e2: 0.16 }, // opacity shadow hitam
  },
  dark: {
    canvas: '#1D1D1F',
    text: '#F5F5F7',
    textMuted: '#AAAAAA',
    textFaint: '#6E6E73',
    tint: '#007AFF',
    tintText: '#0A84FF',
    onTint: '#FFFFFF',
    glass: {
      frost: 'rgba(245,245,247,0.07)',
      lens: 'rgba(245,245,247,0.12)',
      inset: 'rgba(245,245,247,0.06)',
      tint: 'rgba(0,122,255,0.80)',
    },
    rim: { hi: 'rgba(245,245,247,0.70)', mid: 'rgba(245,245,247,0.14)', lo: 'rgba(0,122,255,0.60)' },
    hairline: 'rgba(245,245,247,0.08)',
    gain: '#30D158',
    loss: '#FF453A',
    asset: { cash: '#AAAAAA', stock: '#F5F5F7', crypto: '#FF9F0A' },
    lights: [
      { color: '#007AFF', alpha: 0.35, at: 'bottomRight' },
      { color: '#F5F5F7', alpha: 0.08, at: 'topLeft' },
    ],
    elev: { e1: 0.28, e2: 0.42 },
  },
} as const;

export type Theme = (typeof themes)['light'] | (typeof themes)['dark'];
export const useTheme = (): Theme => (useColorScheme() === 'light' ? themes.light : themes.dark);

export const radius = { sm: 10, md: 14, lg: 22, xl: 30, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, row: 8, group: 16, section: 28 } as const;
// shadow: { shadowColor: '#000', shadowOpacity: theme.elev.e1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }
// e2 memakai radius 26 dan offset y 14

export const motion = {
  fast: 120, base: 200, slow: 320, morph: 320, bloom: 420, count: 450,
  spring: {
    press: { tension: 220, friction: 12 }, // sedikit overshoot, terasa cair
    settle: { tension: 120, friction: 12 },
  },
} as const;
```

**Turunan di luar empat warna palet, dan alasannya:**
- `textMuted`, `textFaint`: `#AAAAAA` hanya 2,1:1 di atas `#F5F5F7`, jadi di mode terang abu itu hanya untuk ikon nonaktif dan hairline; teks sekunder memakai `#6E6E73` (4,7:1). Di mode gelap `#AAAAAA` lolos (7,3:1) dan dipakai langsung sebagai `textMuted`.
- `tintText`: `#007AFF` sebagai teks kecil hanya sekitar 3,7:1 (terang) dan 4,2:1 (gelap), jadi teks biru memakai `#0066CC` dan `#0A84FF`. Isi tombol tetap `#007AFF` dengan teks putih.
- `gain`, `loss`, `asset.crypto`: palet tidak punya warna data, jadi diambil dari warna sistem Apple dan disetel agar lolos kontras di tiap mode.
- Aset: kas abu, saham mengikuti warna teks (hitam atau putih), kripto oranye. Biru tidak dipakai sebagai warna aset supaya tetap berarti "interaktif".

## 4. Tipografi

Memakai font sistem (SF Pro di iOS, Roboto di Android) untuk semua teks, termasuk angka hero. Itu yang membuat tampilan terasa native dan Apple; tidak perlu `expo-font` atau font kustom. Angka memakai `fontVariant: ['tabular-nums']`.

| Peran | Ukuran / line height | Weight | Catatan |
|---|---|---|---|
| hero | 38 / 42 | 700 | `letterSpacing: -0.8`, `adjustsFontSizeToFit`, `numberOfLines={1}`, `minimumFontScale={0.6}`, `maxFontSizeMultiplier={1.2}` |
| title | 22 / 28 | 700 | judul layar |
| headline | 17 / 22 | 600 | judul kartu, nama aset |
| body | 15 / 22 | 400 | teks dan nilai baris |
| caption | 13 / 18 | 400 | `textMuted`, keterangan |
| micro | 11 / 14 | 600 | label tab, chip |

- Panjang baris di bawah 80 karakter. Angka selalu rata kanan di dalam baris daftar.
- Satu kata tidak diberi warna atau tebal berbeda di tengah judul.
- Teks sekunder memakai `textMuted`, bukan `textFaint`.

## 5. Sistem liquid glass

| Level | Dipakai untuk | Teknik | Radius | Shadow |
|---|---|---|---|---|
| `lens` | hero, tab bar, sheet, menu, tombol melayang | lensing + rim + specular + bloom sentuh | `xl` atau `pill` | `e2` |
| `frost` | kartu konten | blur 30 (iOS/web) + `glass.frost` + rim 1px | `lg` | `e1` |
| `inset` | input, chip, segmen di dalam kartu | `glass.inset` + hairline, tanpa blur | `md` atau `pill` | tidak ada |

Kartu `frost` sengaja lebih tenang dari `lens`: kaca penuh dicadangkan untuk lapisan kontrol. Di mode terang, kaca berupa putih tembus pandang dengan rim putih terang dan bayangan lembut; di mode gelap, putih-kelabu dengan rim tint biru di tepi kanan bawah.

### Komponen `LensGlass` (versi universal untuk Android, web, dan iOS lama)

Tidak ada API untuk membiaskan konten yang sedang di-scroll di belakangnya, jadi pembiasan dipalsukan dengan memanfaatkan fakta bahwa latar app adalah `AmbientLights` milik kita sendiri. Urutan lapisan dari bawah ke atas, semuanya di dalam wadah `overflow: 'hidden'`:

1. **Lensa.** Salinan `AmbientLights` berskala 1,2 sampai 1,35 terhadap pusat bentuk, digeser berlawanan arah parallax. Blur maksimal 8 (iOS/web: `BlurView` intensitas 30 di bawahnya, opsional).
2. **Isi.** Gradient 135 derajat dari `glass.lens` ke 40% alpha-nya.
3. **Rim.** Border gradient 1,5px (`rim.hi` kiri atas, `rim.mid`, `rim.lo` kanan bawah), dibuat dengan wadah `LinearGradient` ber-padding 1,5.
4. **Specular.** Busur terang di 35% bagian atas (putih .35 ke 0) dan satu kilau kecil di sudut kiri atas.
5. **Bloom sentuh.** Lingkaran putih (alpha .20) membesar dari titik sentuh lalu pudar selama `motion.bloom` (RN tidak punya radial gradient bawaan; pakai View melingkar, atau `react-native-svg` bila terpasang).
6. **Bayangan** hitam `e2` di luar wadah.

Cahaya latar (`AmbientLights`): dua sumber dari `theme.lights`, keduanya bergeser 0,25x kecepatan scroll supaya kaca terlihat membiaskan cahaya yang bergerak. Saat segmen alokasi dipilih, cahaya `tint` di belakang bar menguat sedikit.

### Tingkat platform

| Platform | Pendekatan |
|---|---|
| Android, web, iOS lama | `LensGlass` di atas. Android: `BlurView` bawaannya tidak mem-blur di `expo-blur` 14 (`experimentalBlurMethod` default `'none'`), jadi rancang agar tetap bagus tanpa blur dan naikkan alpha isi sekitar .10. `dimezisBlurView` boleh untuk paling banyak dua permukaan statis; library menyebut risiko performa dan glitch saat transisi `react-native-screens`. Web: `backdropFilter: 'blur(28px) saturate(150%)'`. |
| iOS 26+ (opsional) | Kaca asli lewat `expo-glass-effect` (`GlassView`, `GlassContainer`, `isInteractive`). Komponen ini hanya iOS dan tvOS; di platform lain jatuh ke `View` biasa. Butuh naik dari SDK 52 (tersedia di SDK 54 ke atas). Jangan beri `opacity` di bawah 1 pada `GlassView` atau induknya; gunakan prop `animate` dan `animationDuration` di `glassEffectStyle`. Periksa `isLiquidGlassAvailable()` dan `AccessibilityInfo.isReduceTransparencyEnabled()` sebelum memakai. |
| Refraksi sungguhan Android/web (opsional) | Shader runtime lewat `@shopify/react-native-skia` (AGSL butuh Android 13 atau lebih baru). Ada beberapa library pihak ketiga yang kecil dan baru untuk ini; evaluasi kualitas dan lisensinya sebelum dipakai. |

Tab bar tetap melayang. Indikator aktif berupa kapsul `glass.tint` yang meluncur antar tab.

## 6. Interaksi dan motion

**Sentuh pada elemen kaca** (`lens` dan kontrol): `onPressIn` memicu bloom dari titik sentuh, skala 1,04 dengan `spring.press` (overshoot kecil), rim naik ke `rim.hi`. Lepas: kembali dengan spring. Kartu `frost` dan baris daftar tidak membesar: kartu hanya menaikkan rim, baris menyorot latar dengan `glass.inset`.

**Gestur dan respons:**

| Gestur | Respons | Haptic |
|---|---|---|
| Geser di grafik hero | kursor `tint`, angka hero dan delta mengikuti titik; lepas = kembali ke nilai live dengan `spring.settle` | `selection` per titik, maksimal tiap 40 ms |
| Pindah tab atau segmen | kapsul meluncur dan meregang (`scaleX` sampai 1,14 saat bergerak) lalu menyatu kembali | `selection` |
| Scroll ke bawah | tab bar mengecil jadi kapsul berisi tab aktif; scroll ke atas atau ketuk kapsul untuk melebar kembali | tidak ada |
| Ketuk tombol yang membuka sheet atau menu | sheet tumbuh dari bingkai tombol (`measureInWindow`): posisi, ukuran, dan radius bermorf selama `motion.morph` | `light` |
| Tarik sheet ke bawah | mengikuti jari dengan sedikit tahanan, dim latar ikut berkurang; ada grabber | tidak ada |
| Ketuk segmen alokasi | segmen membesar, yang lain redup 40%, jumlah tampil; ketuk lagi untuk reset | `selection` |
| Tekan lama baris aset | menu aksi cepat (tambah lot, jual, detail) tumbuh dari baris | `medium` |
| Geser baris rekening | aksi: catat mutasi, ubah | `light` saat melewati ambang |
| Ketuk ikon mata | nilai blur lalu berganti `••••` dalam 180 ms | `medium` |
| Tarik untuk refresh | tint `tint`, titik LIVE berkedip sekali | `light` saat dilepas |

**Specular mengikuti perangkat (opsional).** Sudut kilap bergeser sedikit mengikuti kemiringan lewat `expo-sensors` (DeviceMotion, maksimal 30 fps). Nonaktif saat Reduce Motion.
**Angka berubah.** Nilai uang bergulir per digit selama `count`. Dilewati saat mode privasi aktif.
**Simpan mutasi atau impor berhasil.** Saldo bergulir ke nilai baru dan haptic `success`. Aksi destruktif memakai dialog konfirmasi dan haptic `warning`. Aksi rutin yang bisa dibatalkan memakai undo.
**Memuat.** Skeleton kaca dengan satu garis shimmer untuk layout yang sudah diketahui. `LuxuryLoader` hanya untuk cold start, tanpa cincin pelangi dan tanpa loop rotasi.
**Anggaran gerak.** Durasi hanya dari `motion`. Satu-satunya loop idle: titik LIVE.
**Reduce Motion / Reduce Transparency.** Jika Reduce Motion aktif, matikan parallax, bloom, angka bergulir, peregangan kapsul, dan loop; crossfade 120 ms tetap boleh. Jika Reduce Transparency aktif, `lens` dan `frost` berganti ke isi buram `canvas` + rim, tanpa lapisan lensa.

## 7. Layar

- **Overview.** Urutan: hero `lens` (scrub) lalu bar alokasi interaktif lalu satu kartu `frost` "Pergerakan terbesar" berisi 4 baris lalu aksi cepat. Bento boleh asimetris menurut prioritas data: hero dua kali lebih tinggi, sisanya satu ukuran per jenis informasi. Header: logo, titik LIVE dan waktu, refresh, ikon mata sebagai tombol `lens` kecil.
- **Accounts.** Daftar dikelompokkan (Bank, E-wallet, RDN), satu kartu `frost` per kelompok berisi baris. Kotak "Tempel mutasi" adalah input `inset` besar; hasil parse AI muncul sebagai baris konfirmasi yang bisa diedit (jenis, nominal, rekening) dan tombol utama "Simpan mutasi" (`glass.tint`). Preset simulasi menjadi chip `inset`.
- **Portfolio.** Segmen Saham | Kripto (kapsul meluncur), pencarian di atas daftar. Baris: ticker, nama, "12 lot" (lembar di keterangan), nilai rata kanan, PnL berformat tanda dan panah. Ketuk baris membuka detail di tempat (harga rata-rata, PnL belum terealisasi, mini grafik).
- **Sync SoA.** Alur: pilih berkas lalu (jika PDF terenkripsi) kolom kata sandi muncul di tempat lalu pratinjau transaksi lalu "Terapkan ke portofolio". Sebelum menerapkan, tampilkan dampaknya: "Kas RDN −Rp …, BBCA +10 lot". Chip BUY/SELL/DIVIDEN netral dan tidak memakai warna `gain`/`loss`.

## 8. Teks dan format

- Bahasa Indonesia, sentence case, kata kerja aktif. Tombol menyebut hasilnya ("Simpan mutasi", "Impor statement"), nama aksi sama di seluruh alur dan di toast ("Mutasi disimpan").
- Label utama: "Kekayaan bersih", "Kas", "Saham", "Kripto". Rentang waktu: `1H 1M 1B 1T Semua`.
- Rupiah: `Rp 1.250.000` (pemisah ribuan titik, tanpa desimal). Ringkas memakai koma desimal: `Rp 1,25 M`, `Rp 2,5 jt` (perbaiki `formatIDR` yang kini memakai titik desimal).
- Perubahan selalu bertanda dan berpanah, jangan hanya warna: `▲ +2,35%`, `▼ −Rp 150.000` dengan tanda minus sebenarnya (U+2212). Hijau naik dan merah turun, sesuai kebiasaan pasar Indonesia.
- Ticker tampil tanpa `.JK`. Lot ditulis "12 lot".
- Keadaan kosong menyebut langkah berikutnya ("Tambah rekening pertama"). Error menjelaskan apa yang salah dan cara memperbaikinya, tanpa minta maaf.

## 9. Aksesibilitas

- Target sentuh minimal 44 x 44 pt (`hitSlop` untuk ikon kecil). Ikon tanpa teks wajib `accessibilityLabel`.
- Warna bukan satu-satunya penanda (tanda +/− dan panah selalu ada).
- `accessibilityRole` dan `accessibilityState` pada tab, segmen, dan toggle.
- Uji kontras teks di atas kaca pada titik paling terang dari cahaya latar, di mode terang maupun gelap.
- Putih di atas `#007AFF` sekitar 4:1, praktik umum iOS; karena itu teks tombol minimal 17px semibold. Jika perlu 4,5:1, gelapkan isi tombol ke `#0071E3`.
- Batasi skala font angka hero (`maxFontSizeMultiplier`).
- Mode privasi tidak boleh membocorkan nominal lewat label aksesibilitas atau notifikasi.

## 10. Dependensi

Tanpa menambah apa pun sekarang bisa dipakai: `Animated`, `PanResponder`, `Pressable`, `LayoutAnimation`, `useColorScheme`, `expo-blur`, `expo-linear-gradient`, `expo-haptics`. `LensGlass` versi dasar (lensa, rim, specular, bloom) bisa dibuat dengan itu saja, dan font sistem berarti tidak perlu `expo-font`.

Disarankan untuk interaksi penuh (butuh persetujuan pemilik; README saat ini sengaja menghindari SVG demi stabilitas build Android, jadi uji build APK di GitHub Actions setelah menambah):

```
npx expo install react-native-svg react-native-reanimated react-native-gesture-handler
```

- `react-native-svg`: grafik garis hero yang bisa di-scrub dan radial bloom. Tanpa SVG, pertahankan `Sparkline` berbasis View dengan hit-test per batang.
- Reanimated dan Gesture Handler: scrub, morph sheet, peregangan kapsul, dan geser baris yang mulus. Bungkus root dengan `GestureHandlerRootView`. Jalankan `npx expo-doctor` setelah instalasi.
- Opsional: `expo-sensors` (specular mengikuti kemiringan), `expo-glass-effect` (hanya jika naik SDK), `@shopify/react-native-skia` (refraksi sungguhan).

## 11. Ikon dan aset

Ikon memakai kubus kaca dengan garis naik, dirender dalam palet Apple Modern: latar grafit `#1D1D1F`, kaca putih-kelabu, garis dan titik biru `#007AFF`. Salin ke folder `assets/` (menimpa berkas lama):

| Berkas | Ukuran | Catatan |
|---|---|---|
| `icon.png` | 1024 x 1024 | tanpa alpha, bleed penuh; iOS menerapkan sudut membulat sendiri |
| `adaptive-icon.png` | 1024 x 1024 | transparan, isi di dalam safe zone Android |
| `splash.png` | 1024 x 1024 | ubin ikon membulat di kanvas transparan, terbaca di latar terang maupun gelap |
| `favicon.png` | 128 x 128 | sudut membulat |

Di `app.json`:
- `userInterfaceStyle`: `"automatic"` (sebelumnya `"dark"`).
- `backgroundColor`, `android.backgroundColor`, `android.adaptiveIcon.backgroundColor`, dan `splash.backgroundColor`: `#1D1D1F`.
- Pakai `StatusBar style="auto"` di root layout.

`LogoIcon` dan `HeaderBar` memakai `assets/icon.png`; karena ikon kini bleed penuh, pembulatan sudut sepenuhnya dari komponen.

## 12. Migrasi bertahap

1. Buat `src/theme/tokens.ts`, lalu ganti hex di komponen dengan token dari `useTheme()`. Cari: `grep -rnE "#(38BDF8|10B981|F59E0B|F43F5E|080C14|F8FAFC|94A3B8|64748B|475569|0F172A)" app src`
2. Tulis `LensGlass`, `FrostCard` (ganti `GlassCard`), dan `InsetSurface`. Pindahkan `AmbientBackground` ke `AmbientLights` yang bisa dirender ulang di dalam lensa.
3. Ganti `TouchableOpacity` dengan `Pressable` per peran. Cari: `grep -rn "TouchableOpacity" app src`
4. Hapus glow berwarna dan orb lama. Cari: `grep -rnP "shadowColor: '#(?!000)" app src`. `ScreenTransition`: hanya sekali per sesi.
5. Hero scrub, bar alokasi interaktif, angka bergulir, kapsul tab meluncur, tab bar yang mengecil saat scroll.
6. Hapus label ALL CAPS ("TOTAL NET WORTH", "IDX & CRYPTO LIVE") dan cincin pelangi di `LuxuryLoader`. Perbaiki format ringkas di `formatIDR` agar memakai koma desimal.
7. Uji kedua mode di perangkat (terang dan gelap), termasuk Reduce Motion dan Reduce Transparency.
8. Opsional: naik SDK dan ganti `LensGlass` dengan `GlassView` di iOS 26+.

## 13. Checklist sebelum selesai

- [ ] Tidak ada hex, radius, atau durasi mentah di komponen baru.
- [ ] Tidak ada warna yang dipakai untuk dua arti (bagian 2, aturan 2). Biru hanya untuk interaksi.
- [ ] Tidak ada glow berwarna, gradient berwarna, atau label ALL CAPS.
- [ ] Tidak ada kaca di atas kaca; kartu data memakai `frost`, bukan `lens`.
- [ ] Tampilan rapi di mode terang dan gelap, di Android tanpa `BlurView`, dan saat Reduce Transparency aktif.
- [ ] Angka uang tabular, rata kanan, dan tertutup saat mode privasi.
- [ ] Setiap interaksi punya umpan balik sesuai bagian 6 dan menghormati Reduce Motion.
- [ ] Kontras teks ≥ 4,5:1 di kedua mode dan target sentuh ≥ 44 pt.
