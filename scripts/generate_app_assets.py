import os
import subprocess

render_script = r"d:\AI\anigravity\money-tracker\.agents\skills\logo-design\skills\logo-design\scripts\render_png.py"
assets_dir = r"d:\AI\anigravity\omniwealth-v2\assets"
brand_kit_dir = r"d:\AI\anigravity\omniwealth-v2\assets\brand-kit"

# 1. Main App Icon SVG (1024x1024 with #0F172A background)
# Symbol is 256x256 originally.
# To scale to 620px: scale = 620 / 256 = 2.421875
# translate = (1024 - 620) / 2 = 202
app_icon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#0F172A" />
  <g transform="translate(202, 202) scale(2.421875)">
    <!-- Pillar 1: Liquid Cash & Banking Arc (Left) in Crisp White -->
    <path fill="#FFFFFF" d="
      M 116 22
      C 58 28 22 72 22 128
      C 22 158 35 186 56 206
      L 76 182
      C 62 167 52 148 52 128
      C 52 86 78 52 116 48
      Z
    "/>
    <!-- Pillar 2: Capital Markets & IDX Equities Arc (Right) in Crisp White -->
    <path fill="#FFFFFF" d="
      M 140 22
      C 198 28 234 72 234 128
      C 234 158 221 186 200 206
      L 180 182
      C 194 167 204 148 204 128
      C 204 86 178 52 140 48
      Z
    "/>
    <!-- Pillar 3: Web3 & Growth Catalyst Arc (Bottom Base) in Apple Blue -->
    <path fill="#007AFF" d="
      M 72 216
      C 88 228 107 236 128 236
      C 149 236 168 228 184 216
      L 168 194
      C 156 202 143 208 128 208
      C 113 208 100 202 88 194
      Z
    "/>
    <!-- Central Asset Nexus Ring with real hole (evenodd) in Apple Blue -->
    <path fill="#007AFF" fill-rule="evenodd" d="
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
</svg>'''

# 2. Android Adaptive Icon Foreground SVG (1024x1024 transparent, 480px mark centered)
# scale = 480 / 256 = 1.875
# translate = (1024 - 480) / 2 = 272
adaptive_icon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <g transform="translate(272, 272) scale(1.875)">
    <!-- Pillar 1: Liquid Cash & Banking Arc (Left) in Crisp White -->
    <path fill="#FFFFFF" d="
      M 116 22
      C 58 28 22 72 22 128
      C 22 158 35 186 56 206
      L 76 182
      C 62 167 52 148 52 128
      C 52 86 78 52 116 48
      Z
    "/>
    <!-- Pillar 2: Capital Markets & IDX Equities Arc (Right) in Crisp White -->
    <path fill="#FFFFFF" d="
      M 140 22
      C 198 28 234 72 234 128
      C 234 158 221 186 200 206
      L 180 182
      C 194 167 204 148 204 128
      C 204 86 178 52 140 48
      Z
    "/>
    <!-- Pillar 3: Web3 & Growth Catalyst Arc (Bottom Base) in Apple Blue -->
    <path fill="#007AFF" d="
      M 72 216
      C 88 228 107 236 128 236
      C 149 236 168 228 184 216
      L 168 194
      C 156 202 143 208 128 208
      C 113 208 100 202 88 194
      Z
    "/>
    <!-- Central Asset Nexus Ring with real hole (evenodd) in Apple Blue -->
    <path fill="#007AFF" fill-rule="evenodd" d="
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
</svg>'''

# 3. Transparent Favicon SVG (tight 256x256)
favicon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <!-- Pillar 1: Liquid Cash & Banking Arc (Left) -->
  <path fill="#007AFF" d="
    M 116 22
    C 58 28 22 72 22 128
    C 22 158 35 186 56 206
    L 76 182
    C 62 167 52 148 52 128
    C 52 86 78 52 116 48
    Z
  "/>
  <!-- Pillar 2: Capital Markets & IDX Equities Arc (Right) -->
  <path fill="#007AFF" d="
    M 140 22
    C 198 28 234 72 234 128
    C 234 158 221 186 200 206
    L 180 182
    C 194 167 204 148 204 128
    C 204 86 178 52 140 48
    Z
  "/>
  <!-- Pillar 3: Web3 & Growth Catalyst Arc (Bottom Base) -->
  <path fill="#007AFF" d="
    M 72 216
    C 88 228 107 236 128 236
    C 149 236 168 228 184 216
    L 168 194
    C 156 202 143 208 128 208
    C 113 208 100 202 88 194
    Z
  "/>
  <!-- Central Asset Nexus Ring with real hole (evenodd) -->
  <path fill="#007AFF" fill-rule="evenodd" d="
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
</svg>'''

tmp_app_icon = os.path.join(brand_kit_dir, "app-icon-master.svg")
tmp_adaptive = os.path.join(brand_kit_dir, "adaptive-icon-master.svg")
tmp_favicon = os.path.join(brand_kit_dir, "favicon-master.svg")

with open(tmp_app_icon, "w", encoding="utf-8") as f:
    f.write(app_icon_svg)
with open(tmp_adaptive, "w", encoding="utf-8") as f:
    f.write(adaptive_icon_svg)
with open(tmp_favicon, "w", encoding="utf-8") as f:
    f.write(favicon_svg)

print("Saved SVG masters for App Icon, Adaptive Icon, and Favicon.")
