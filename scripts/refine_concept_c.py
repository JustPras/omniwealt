import math
import os

out_dir = r"d:\AI\anigravity\omniwealth-v2\assets\logo-redesign"

# Exact 60 degree geometry for W
# dx = 20, dy = 20 * tan(60 deg) = 20 * 1.7320508 = 34.641
# Points:
# P0: (88, 120)
# P1: (108, 120 + 34.641) = (108, 154.64)
# P2: (128, 120)
# P3: (148, 154.64)
# P4: (168, 120)

concept_c_symbol = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-c">
  <title id="title-c">OmniWealth - Concept C: Liquid Horizon Capsule</title>
  <!-- Outer Rounded Squircle with Central Ring Cutout (Compound Evenodd Path) -->
  <path fill="#0F172A" fill-rule="evenodd" d="
    M 80 24
    H 176
    C 209.1 24 236 50.9 236 84
    V 172
    C 236 205.1 209.1 232 176 232
    H 80
    C 46.9 232 20 205.1 20 172
    V 84
    C 20 50.9 46.9 24 80 24 Z
    M 128 54
    C 168.9 54 202 87.1 202 128
    C 202 168.9 168.9 202 128 202
    C 87.1 202 54 168.9 54 128
    C 54 87.1 87.1 54 128 54 Z
  "/>
  <!-- Inner White Disc Background -->
  <circle cx="128" cy="128" r="66" fill="#F8FAFC"/>
  <!-- Fluid 'W' Precision Wave with exact 60.0 degree angle -->
  <path fill="none" stroke="#007AFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" d="
    M 92 120
    L 110 151.18
    L 128 120
    L 146 151.18
    L 164 120
  "/>
  <!-- Crown Apex Droplet -->
  <circle cx="128" cy="92" r="9" fill="#007AFF"/>
</svg>'''

with open(os.path.join(out_dir, "concept-c.svg"), "w", encoding="utf-8") as f:
    f.write(concept_c_symbol)

print("Updated concept C.")
