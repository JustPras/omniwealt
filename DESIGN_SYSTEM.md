# OmniWealth Signature UI System: "Warm Titanium & Champagne Liquid Glass"

## 1. Core Visual Identity & Anti-Slop Rules
- **Theme:** Warm Titanium & Champagne Liquid Glass (Private Banking Terminal & Swiss Vault aesthetic).
- **Strict Color Ban:** NO generic fintech blue, cyan, indigo, or neon purple gradients. NO 3D illustrations or circular pie charts.
- **Typography:**
  - UI, Headings & Labels: `'Plus Jakarta Sans', sans-serif`
  - Numbers, Rp Currency, Tickers, Lots, Dates: `'JetBrains Mono', monospace` with strict `font-variant-numeric: tabular-nums`.

## 2. Color Tokens (CSS & React Native Tokens)
- `Colors.palette.canvas`: `#0A0A09` (Warm Carbon OLED)
- `Colors.palette.elevated`: `#141412` (Smoked Basalt for Drawers/Modals)
- `Colors.palette.champagneGold`: `#D4AF37` (Primary Brand / IDX Stocks / AI Active)
- `Colors.palette.sovereignJade`: `#2EBD85` (Sovereign Jade / Profit / RDN / Verified)
- `Colors.palette.terracottaRose`: `#E15241` (Terracotta Rose / Loss / Expense)
- `Colors.palette.titaniumSilver`: `#94A3B8` (Titanium Silver / Bank Cash)
- `Colors.palette.burnishedCopper`: `#E07A5F` (Burnished Copper / Crypto & Web3)
- `Colors.palette.alabasterWhite`: `#F5F3EF` (Alabaster White / Primary Text)
- `Colors.palette.naturalTitanium`: `#A39E93` (Natural Titanium / Secondary Text)
- `Colors.palette.darkPewter`: `#57534E` (Dark Pewter / Index Tags `01 //`)

## 3. Surface & Elevation Architecture
- **`.quartz-card` (`GlassCard level="base"`):** Tactile quartz container with asymmetric specular border (1px top-left highlight, bottom-right fade), backdrop blur, and warm dark glass fill.
- **`.hero-bullion-card` (`GlassCard level="bullion"`):** Hero portfolio container with champagne gold top-left specular rim, warm ambient gold glow, and 1px dashed perforation line separator.
- **Floating Bottom Capsule:** Floating navigation dock with safe-area insets (`insets.bottom`), minimum 44x44px touch targets, frosted glass blur, and champagne gold active states.
- **Dual Dropzone & Vault Slip:** Automated wealth ingestion card and perforated vault slip for statement extraction with monospace alignment and cryptographic attestation.
