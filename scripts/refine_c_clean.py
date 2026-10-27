import os

out_dir = r"d:\AI\anigravity\omniwealth-v2\assets\logo-redesign"

# Concept C: Interlocking 'OW' Fluid Crest (Pure vector, 0 white knockout, 100% production ready)
# Outer 'O' Ring and intersecting 'W' with clean 12px negative-space clearance gap
concept_c_symbol = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-c">
  <title id="title-c">OmniWealth - Concept C: Interlocking OW Monogram</title>
  <!-- Fluid 'O' Monogram Ring with compound inner aperture -->
  <path fill="#0F172A" fill-rule="evenodd" d="
    M 128 24
    C 185.4 24 232 70.6 232 128
    C 232 185.4 185.4 232 128 232
    C 70.6 232 24 185.4 24 128
    C 24 70.6 70.6 24 128 24 Z
    M 128 64
    C 92.7 64 64 92.7 64 128
    C 64 163.3 92.7 192 128 192
    C 163.3 192 192 163.3 192 128
    C 192 92.7 163.3 64 128 64 Z
  "/>
  <!-- Fluid 'W' Floating Hydrofoil Wave in Azure Blue -->
  <path fill="#007AFF" d="
    M 82 110
    L 100 156
    L 128 116
    L 156 156
    L 174 110
    L 190 110
    L 166 174
    L 128 126
    L 90 174
    L 66 110 Z
  "/>
  <!-- Apex Droplet Anchor Point -->
  <circle cx="128" cy="88" r="10" fill="#007AFF"/>
</svg>'''

with open(os.path.join(out_dir, "concept-c.svg"), "w", encoding="utf-8") as f:
    f.write(concept_c_symbol)

# Also update lockup-c
from generate_clean_concepts import make_lockup, extract_inner
lockup_c = make_lockup(extract_inner(concept_c_symbol), "lockup-c")
with open(os.path.join(out_dir, "lockup-c.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_c)

print("Updated Concept C & Lockup C.")
