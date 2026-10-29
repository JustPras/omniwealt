const fs = require('fs');
const path = require('path');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = require('D:/AI/anigravity/money-tracker/node_modules/sharp');
}

const ASSETS_DIR = 'D:\\AI\\anigravity\\omniwealth-v2\\assets';
const WEB_PUBLIC_DIR = 'D:\\AI\\anigravity\\money-tracker\\public';
const BRAND_KIT_DIR = path.join(ASSETS_DIR, 'brand-kit');

// 1. Signature SVG: Concept A (Champagne Bullion & Natural Titanium)
const svgSignatureDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5E6B3" />
      <stop offset="30%" stop-color="#E8CA65" />
      <stop offset="70%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#997E20" />
    </linearGradient>
    <linearGradient id="titaniumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="45%" stop-color="#F5F3EF" />
      <stop offset="85%" stop-color="#A39E93" />
      <stop offset="100%" stop-color="#78716C" />
    </linearGradient>
  </defs>

  <g id="omni-mark">
    <!-- Pillar 1: Liquid Cash & Banking Arc (Left) in Natural Titanium -->
    <path id="arc-left" fill="url(#titaniumGrad)" d="
      M 116 22
      C 58 28 22 72 22 128
      C 22 158 35 186 56 206
      L 76 182
      C 62 167 52 148 52 128
      C 52 86 78 52 116 48
      Z
    "/>

    <!-- Pillar 2: Capital Markets & IDX Equities Arc (Right) in Natural Titanium -->
    <path id="arc-right" fill="url(#titaniumGrad)" d="
      M 140 22
      C 198 28 234 72 234 128
      C 234 158 221 186 200 206
      L 180 182
      C 194 167 204 148 204 128
      C 204 86 178 52 140 48
      Z
    "/>

    <!-- Pillar 3: Web3 & Growth Catalyst Arc (Bottom Base) in Champagne Gold -->
    <path id="arc-bottom" fill="url(#goldGrad)" d="
      M 72 216
      C 88 228 107 236 128 236
      C 149 236 168 228 184 216
      L 168 194
      C 156 202 143 208 128 208
      C 113 208 100 202 88 194
      Z
    "/>

    <!-- Central Asset Nexus Ring in Radiant Champagne Gold -->
    <path id="nexus-core" fill="url(#goldGrad)" fill-rule="evenodd" d="
      M 128 98
      C 144.6 98 158 111.4 158 128
      C 158 144.6 144.6 158 128 158
      C 111.4 158 98 144.6 98 128
      C 98 111.4 111.4 98 128 98 Z
      M 128 114
      C 120.3 114 114 120.3 114 128
      C 114 135.7 120.3 142 128 142
      C 135.7 142 142 135.7 142 128
      C 142 120.3 135.7 114 128 114 Z
    "/>
  </g>
</svg>`;

// 2. Pure Bullion Gold (Monolith Gold Luxury)
const svgPureGold = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="pureGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF2CC" />
      <stop offset="25%" stop-color="#E8CA65" />
      <stop offset="65%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#8C7119" />
    </linearGradient>
  </defs>

  <path fill="url(#pureGold)" d="
    M 116 22
    C 58 28 22 72 22 128
    C 22 158 35 186 56 206
    L 76 182
    C 62 167 52 148 52 128
    C 52 86 78 52 116 48
    Z
  "/>
  <path fill="url(#pureGold)" d="
    M 140 22
    C 198 28 234 72 234 128
    C 234 158 221 186 200 206
    L 180 182
    C 194 167 204 148 204 128
    C 204 86 178 52 140 48
    Z
  "/>
  <path fill="url(#pureGold)" d="
    M 72 216
    C 88 228 107 236 128 236
    C 149 236 168 228 184 216
    L 168 194
    C 156 202 143 208 128 208
    C 113 208 100 202 88 194
    Z
  "/>
  <path fill="url(#pureGold)" fill-rule="evenodd" d="
    M 128 98
    C 144.6 98 158 111.4 158 128
    C 158 144.6 144.6 158 128 158
    C 111.4 158 98 144.6 98 128
    C 98 111.4 111.4 98 128 98 Z
    M 128 114
    C 120.3 114 114 120.3 114 128
    C 114 135.7 120.3 142 128 142
    C 135.7 142 142 135.7 142 128
    C 142 120.3 135.7 114 128 114 Z
  "/>
</svg>`;

// 3. App Icon Master (1024x1024 with Warm Carbon OLED canvas & 1px specular rim)
const svgAppIcon1024 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="carbonBg" cx="30%" cy="20%" r="90%">
      <stop offset="0%" stop-color="#1C1C19" />
      <stop offset="50%" stop-color="#121210" />
      <stop offset="100%" stop-color="#0A0A09" />
    </radialGradient>
    <linearGradient id="rimSpecular" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(212, 175, 55, 0.45)" />
      <stop offset="40%" stop-color="rgba(255, 255, 255, 0.18)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.03)" />
    </linearGradient>
    <linearGradient id="goldIcon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5E6B3" />
      <stop offset="30%" stop-color="#E8CA65" />
      <stop offset="70%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#997E20" />
    </linearGradient>
    <linearGradient id="titaniumIcon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="45%" stop-color="#F5F3EF" />
      <stop offset="85%" stop-color="#A39E93" />
      <stop offset="100%" stop-color="#78716C" />
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="1024" height="1024" rx="230" fill="url(#carbonBg)" />

  <!-- Asymmetric Specular Border -->
  <rect x="3" y="3" width="1018" height="1018" rx="227" fill="none" stroke="url(#rimSpecular)" stroke-width="6" />

  <!-- Ambient Gold Glow Orb Behind Symbol -->
  <circle cx="512" cy="512" r="280" fill="rgba(212, 175, 55, 0.08)" filter="blur(60px)" />

  <!-- Centered Nexus Symbol (scaled from 256x256 to ~540x540) -->
  <g transform="translate(242, 242) scale(2.11)">
    <!-- Pillar 1: Liquid Cash & Banking Arc (Left) -->
    <path fill="url(#titaniumIcon)" d="
      M 116 22
      C 58 28 22 72 22 128
      C 22 158 35 186 56 206
      L 76 182
      C 62 167 52 148 52 128
      C 52 86 78 52 116 48
      Z
    "/>
    <!-- Pillar 2: Capital Markets & IDX Equities Arc (Right) -->
    <path fill="url(#titaniumIcon)" d="
      M 140 22
      C 198 28 234 72 234 128
      C 234 158 221 186 200 206
      L 180 182
      C 194 167 204 148 204 128
      C 204 86 178 52 140 48
      Z
    "/>
    <!-- Pillar 3: Web3 Arc (Bottom Base) -->
    <path fill="url(#goldIcon)" d="
      M 72 216
      C 88 228 107 236 128 236
      C 149 236 168 228 184 216
      L 168 194
      C 156 202 143 208 128 208
      C 113 208 100 202 88 194
      Z
    "/>
    <!-- Central Nexus Ring -->
    <path fill="url(#goldIcon)" fill-rule="evenodd" d="
      M 128 98
      C 144.6 98 158 111.4 158 128
      C 158 144.6 144.6 158 128 158
      C 111.4 158 98 144.6 98 128
      C 98 111.4 111.4 98 128 98 Z
      M 128 114
      C 120.3 114 114 120.3 114 128
      C 114 135.7 120.3 142 128 142
      C 135.7 142 142 135.7 142 128
      C 142 120.3 135.7 114 128 114 Z
    "/>
  </g>
</svg>`;

// 4. Full Brand Lockup with Typography (Horizontal)
const svgBrandLockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 120" width="460" height="120">
  <defs>
    <linearGradient id="goldLockup" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5E6B3" />
      <stop offset="35%" stop-color="#E8CA65" />
      <stop offset="70%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#997E20" />
    </linearGradient>
    <linearGradient id="titaniumLockup" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#F5F3EF" />
      <stop offset="100%" stop-color="#A39E93" />
    </linearGradient>
  </defs>

  <!-- Nexus Icon Mark at Left (0..120) -->
  <g transform="translate(14, 14) scale(0.36)">
    <path fill="url(#titaniumLockup)" d="M 116 22 C 58 28 22 72 22 128 C 22 158 35 186 56 206 L 76 182 C 62 167 52 148 52 128 C 52 86 78 52 116 48 Z"/>
    <path fill="url(#titaniumLockup)" d="M 140 22 C 198 28 234 72 234 128 C 234 158 221 186 200 206 L 180 182 C 194 167 204 148 204 128 C 204 86 178 52 140 48 Z"/>
    <path fill="url(#goldLockup)" d="M 72 216 C 88 228 107 236 128 236 C 149 236 168 228 184 216 L 168 194 C 156 202 143 208 128 208 C 113 208 100 202 88 194 Z"/>
    <path fill="url(#goldLockup)" fill-rule="evenodd" d="M 128 98 C 144.6 98 158 111.4 158 128 C 158 144.6 144.6 158 128 158 C 111.4 158 98 144.6 98 128 C 98 111.4 111.4 98 128 98 Z M 128 114 C 120.3 114 114 120.3 114 128 C 114 135.7 120.3 142 128 142 C 135.7 142 142 135.7 142 128 C 142 120.3 135.7 114 128 114 Z"/>
  </g>

  <!-- Typography -->
  <text x="124" y="62" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="34" font-weight="800" fill="#F5F3EF" letter-spacing="-0.5">
    Omni<tspan fill="url(#goldLockup)">Wealth</tspan>
  </text>
  <text x="125" y="86" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#A39E93" letter-spacing="2.4">
    WARM TITANIUM // VAULT
  </text>
</svg>`;

async function generateAll() {
  console.log('--- Generating OmniWealth Warm Titanium & Champagne Logos ---');

  // 1. Write SVG Masters
  fs.writeFileSync(path.join(ASSETS_DIR, 'logo-transparent.svg'), svgSignatureDark);
  fs.writeFileSync(path.join(BRAND_KIT_DIR, 'omniwealth-nexus-transparent-dark.svg'), svgSignatureDark);
  fs.writeFileSync(path.join(BRAND_KIT_DIR, 'omniwealth-nexus-transparent-light.svg'), svgSignatureDark);
  fs.writeFileSync(path.join(BRAND_KIT_DIR, 'omniwealth-nexus-pure-gold.svg'), svgPureGold);
  fs.writeFileSync(path.join(BRAND_KIT_DIR, 'app-icon-master.svg'), svgAppIcon1024);
  fs.writeFileSync(path.join(BRAND_KIT_DIR, 'omniwealth-lockup.svg'), svgBrandLockup);

  if (fs.existsSync(WEB_PUBLIC_DIR)) {
    fs.writeFileSync(path.join(WEB_PUBLIC_DIR, 'logo-transparent.svg'), svgSignatureDark);
    fs.writeFileSync(path.join(WEB_PUBLIC_DIR, 'logo-lockup.svg'), svgBrandLockup);
  }

  // 2. Render High-Resolution Raster PNGs using Sharp
  const markBuf = Buffer.from(svgSignatureDark);
  const iconBuf = Buffer.from(svgAppIcon1024);
  const lockupBuf = Buffer.from(svgBrandLockup);

  // App Icon 1024x1024
  await sharp(iconBuf)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('✓ Rendered icon.png (1024x1024)');

  await sharp(iconBuf)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
  console.log('✓ Rendered adaptive-icon.png (1024x1024)');

  await sharp(iconBuf)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('✓ Rendered splash-icon.png (1024x1024)');

  // Logo Marks
  await sharp(markBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(ASSETS_DIR, 'logo-mark-dark.png'));
  console.log('✓ Rendered logo-mark-dark.png (512x512)');

  await sharp(markBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(ASSETS_DIR, 'logo-mark-light.png'));
  console.log('✓ Rendered logo-mark-light.png (512x512)');

  await sharp(markBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(ASSETS_DIR, 'logo-mark.png'));
  console.log('✓ Rendered logo-mark.png (512x512)');

  await sharp(markBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(ASSETS_DIR, 'logo-mark-white.png'));
  console.log('✓ Rendered logo-mark-white.png (512x512)');

  await sharp(markBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(ASSETS_DIR, 'logo-mark-black.png'));
  console.log('✓ Rendered logo-mark-black.png (512x512)');

  await sharp(markBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(ASSETS_DIR, 'logo-transparent.png'));
  console.log('✓ Rendered logo-transparent.png (512x512)');

  // Favicons
  await sharp(markBuf)
    .resize(64, 64)
    .png()
    .toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log('✓ Rendered favicon.png (64x64)');

  if (fs.existsSync(WEB_PUBLIC_DIR)) {
    fs.writeFileSync(path.join(WEB_PUBLIC_DIR, 'icon.svg'), svgAppIcon1024);
    await sharp(markBuf)
      .resize(512, 512)
      .png()
      .toFile(path.join(WEB_PUBLIC_DIR, 'logo.png'));
    await sharp(markBuf)
      .resize(64, 64)
      .png()
      .toFile(path.join(WEB_PUBLIC_DIR, 'favicon.png'));
    await sharp(iconBuf)
      .resize(192, 192)
      .png()
      .toFile(path.join(WEB_PUBLIC_DIR, 'icon-192.png'));
    await sharp(iconBuf)
      .resize(512, 512)
      .png()
      .toFile(path.join(WEB_PUBLIC_DIR, 'icon-512.png'));
    await sharp(iconBuf)
      .resize(192, 192)
      .png()
      .toFile(path.join(WEB_PUBLIC_DIR, 'icon-maskable-192.png'));
    await sharp(iconBuf)
      .resize(512, 512)
      .png()
      .toFile(path.join(WEB_PUBLIC_DIR, 'icon-maskable-512.png'));
    console.log('✓ Synced web public assets in money-tracker');
  }

  console.log('All Warm Titanium & Champagne Logo Assets generated successfully!');
}

generateAll().catch(console.error);
