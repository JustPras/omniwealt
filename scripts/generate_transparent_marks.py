import os
import subprocess

brand_kit_dir = r"d:\AI\anigravity\omniwealth-v2\assets\brand-kit"
assets_dir = r"d:\AI\anigravity\omniwealth-v2\assets"
render_script = r"d:\AI\anigravity\money-tracker\.agents\skills\logo-design\skills\logo-design\scripts\render_png.py"

# Transparent Mark for Dark Mode (White pillars + Apple Blue nexus, NO background)
svg_dark = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
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
</svg>'''

# Transparent Mark for Light Mode (Dark Navy/Slate pillars + Apple Blue nexus, NO background)
svg_light = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <!-- Pillar 1: Liquid Cash & Banking Arc (Left) in Dark Slate #0F172A -->
  <path fill="#0F172A" d="
    M 116 22
    C 58 28 22 72 22 128
    C 22 158 35 186 56 206
    L 76 182
    C 62 167 52 148 52 128
    C 52 86 78 52 116 48
    Z
  "/>
  <!-- Pillar 2: Capital Markets & IDX Equities Arc (Right) in Dark Slate #0F172A -->
  <path fill="#0F172A" d="
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
</svg>'''

svg_dark_path = os.path.join(brand_kit_dir, "omniwealth-nexus-transparent-dark.svg")
svg_light_path = os.path.join(brand_kit_dir, "omniwealth-nexus-transparent-light.svg")

with open(svg_dark_path, "w", encoding="utf-8") as f:
    f.write(svg_dark)

with open(svg_light_path, "w", encoding="utf-8") as f:
    f.write(svg_light)

# Output paths for PNGs (512x512)
png_dark = os.path.join(assets_dir, "logo-mark-dark.png")
png_light = os.path.join(assets_dir, "logo-mark-light.png")

subprocess.run(["python", render_script, svg_dark_path, "-o", png_dark, "--width", "512", "--height", "512"], check=True)
subprocess.run(["python", render_script, svg_light_path, "-o", png_light, "--width", "512", "--height", "512"], check=True)

print("Rendered transparent dark and light logo marks.")
