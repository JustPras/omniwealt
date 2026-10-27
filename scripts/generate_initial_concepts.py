import math
import os

out_dir = r"d:\AI\anigravity\omniwealth-v2\assets\logo-redesign"
os.makedirs(out_dir, exist_ok=True)

# ==========================================
# 1. CONCEPT A: LIQUID MOBIUS 'O'
# Infinite fluid loop with a central droplet
# ==========================================
concept_a_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a">
  <title id="title-a">OmniWealth - Concept A: Liquid Mobius O</title>
  <!-- Liquid Mobius Outer Ribbon (compounding infinity O) -->
  <path fill="#0F172A" fill-rule="evenodd" d="
    M 128 20
    C 188 20 236 68 236 128
    C 236 188 188 236 128 236
    C 68 236 20 188 20 128
    C 20 68 68 20 128 20 Z
    M 128 58
    C 89 58 58 89 58 128
    C 58 167 89 198 128 198
    C 167 198 198 167 198 128
    C 198 89 167 58 128 58 Z
  "/>
  <!-- Fluid Upward Growth Teardrop nestled in center -->
  <path fill="#007AFF" d="
    M 128 72
    C 142 98 162 124 162 144
    A 34 34 0 0 1 94 144
    C 94 124 114 98 128 72 Z
  "/>
  <!-- Specular glint on inner droplet -->
  <circle cx="118" cy="132" r="7" fill="#FFFFFF" opacity="0.9"/>
</svg>'''

# ==========================================
# 2. CONCEPT B: PRISM TRIAD (Wealth Triad)
# Three converging fluid facets (Cash, Stock, Crypto)
# ==========================================
concept_b_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-b">
  <title id="title-b">OmniWealth - Concept B: Apex Prism Triad</title>
  <!-- Facet 1: Top Apex Droplet (Web3 / Innovation) -->
  <path fill="#007AFF" d="
    M 128 22
    C 140 46 160 82 160 106
    C 160 124 145 138 128 138
    C 111 138 96 124 96 106
    C 96 82 116 46 128 22 Z
  "/>
  <!-- Facet 2: Bottom-Left Wing (Liquid Cash & Stability) -->
  <path fill="#0F172A" d="
    M 84 118
    C 84 118 42 152 42 186
    C 42 214 65 234 94 234
    C 116 234 135 220 144 200
    C 130 196 118 184 114 168
    C 106 142 94 128 84 118 Z
  "/>
  <!-- Facet 3: Bottom-Right Wing (Equity Growth / Capital) -->
  <path fill="#0F172A" d="
    M 172 118
    C 162 128 150 142 142 168
    C 138 184 126 196 112 200
    C 121 220 140 234 162 234
    C 191 234 214 214 214 186
    C 214 152 172 118 172 118 Z
  "/>
</svg>'''

# ==========================================
# 3. CONCEPT C: LIQUID HORIZON MONOGRAM ('OW' CAPSULE)
# Luxury horizontal pill capsule with intertwined O and W
# ==========================================
concept_c_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-c">
  <title id="title-c">OmniWealth - Concept C: Liquid Horizon Capsule</title>
  <!-- Outer Rounded Squircle Glass Tile -->
  <rect x="24" y="24" width="208" height="208" rx="54" fill="#0F172A"/>
  <!-- Fluid Outer 'O' Ring in Negative Space / Cyan-Blue Accent -->
  <circle cx="128" cy="128" r="76" fill="none" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round"/>
  <!-- Geometric 'W' Fluid Wave cutting across base -->
  <path fill="none" stroke="#007AFF" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" d="
    M 84 112
    L 106 164
    L 128 126
    L 150 164
    L 172 112
  "/>
  <!-- Droplet Crown Specular Point -->
  <circle cx="128" cy="74" r="9" fill="#007AFF"/>
</svg>'''

with open(os.path.join(out_dir, "concept-a.svg"), "w", encoding="utf-8") as f:
    f.write(concept_a_svg)

with open(os.path.join(out_dir, "concept-b.svg"), "w", encoding="utf-8") as f:
    f.write(concept_b_svg)

with open(os.path.join(out_dir, "concept-c.svg"), "w", encoding="utf-8") as f:
    f.write(concept_c_svg)

print("Symbols A, B, C generated successfully.")
