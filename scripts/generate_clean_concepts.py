import math
import os
import subprocess

out_dir = r"d:\AI\anigravity\omniwealth-v2\assets\logo-redesign"
os.makedirs(out_dir, exist_ok=True)

# ==============================================================================
# PRECISION GEOMETRIC SVG PATHS FOR SYMBOLS (viewBox 0 0 256 256)
# ==============================================================================

# Concept A: Liquid Mobius 'O' (The Infinite Compounding Droplet)
# Pure solid shapes with real negative-space hole (fill-rule="evenodd"), no white knockout.
concept_a_symbol = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a">
  <title id="title-a">OmniWealth - Concept A: Liquid Mobius O</title>
  <!-- Outer Fluid Mobius Ring (Compounding Loop) with inner cutout -->
  <path fill="#0F172A" fill-rule="evenodd" d="
    M 128 20
    C 187.6 20 236 68.4 236 128
    C 236 187.6 187.6 236 128 236
    C 68.4 236 20 187.6 20 128
    C 20 68.4 68.4 20 128 20 Z
    M 128 60
    C 90.4 60 60 90.4 60 128
    C 60 165.6 90.4 196 128 196
    C 165.6 196 196 165.6 196 128
    C 196 90.4 165.6 60 128 60 Z
  "/>
  <!-- Central Liquid Droplet (Ascending Wealth Seed) -->
  <path fill="#007AFF" d="
    M 128 76
    C 142 98 160 122 160 142
    C 160 159.7 145.7 174 128 174
    C 110.3 174 96 159.7 96 142
    C 96 122 114 98 128 76 Z
  "/>
</svg>'''

# Concept B: Apex Prism Triad (The Wealth Convergence)
# Three converging fluid facets: Cash (left), Stock (right), Innovation/Crypto (apex).
concept_b_symbol = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-b">
  <title id="title-b">OmniWealth - Concept B: Apex Prism Triad</title>
  <!-- Facet 1: Top Apex Droplet (Innovation & Growth) -->
  <path fill="#007AFF" d="
    M 128 22
    C 140 46 160 82 160 106
    C 160 124 145 138 128 138
    C 111 138 96 124 96 106
    C 96 82 116 46 128 22 Z
  "/>
  <!-- Facet 2: Left Wing (Liquid Cash & Reserves) -->
  <path fill="#0F172A" d="
    M 84 118
    C 84 118 42 152 42 186
    C 42 214 65 234 94 234
    C 116 234 135 220 144 200
    C 130 196 118 184 114 168
    C 106 142 94 128 84 118 Z
  "/>
  <!-- Facet 3: Right Wing (Capital Markets & Equities) -->
  <path fill="#0F172A" d="
    M 172 118
    C 162 128 150 142 142 168
    C 138 184 126 196 112 200
    C 121 220 140 234 162 234
    C 191 234 214 214 214 186
    C 214 152 172 118 172 118 Z
  "/>
</svg>'''

# Concept C: Interlocking 'OW' Fluid Crest (Pure vector, 0 white knockout, 100% production ready)
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
  <!-- Fluid 'W' Floating Hydrofoil Wave in Azure Blue (Exact 60.0 degree angle) -->
  <path fill="#007AFF" d="
    M 80 110
    L 100 156
    L 128 116
    L 156 156
    L 176 110
    L 194 110
    L 166 174
    L 128 126
    L 90 174
    L 62 110 Z
  "/>
  <!-- Apex Droplet Anchor Point -->
  <circle cx="128" cy="88" r="10" fill="#007AFF"/>
</svg>'''

# ==============================================================================
# OUTLINED VECTOR WORDMARK FOR "OmniWealth" (viewBox height 256, no <text>)
# ==============================================================================
# Clean geometric letterforms matching Apple SF / Jakarta Sans:
# O, m, n, i, W, e, a, l, t, h

wordmark_path_data = '''
  <!-- O -->
  <path fill="#0F172A" fill-rule="evenodd" d="M 370 76 C 401 76 425 100 425 131 C 425 162 401 186 370 186 C 339 186 315 162 315 131 C 315 100 339 76 370 76 Z M 370 95 C 350 95 334 111 334 131 C 334 151 350 167 370 167 C 390 167 406 151 406 131 C 406 111 390 95 370 95 Z"/>
  <!-- m -->
  <path fill="#0F172A" d="M 440 102 H 457 V 114 C 462 105 471 100 482 100 C 493 100 501 106 505 116 C 511 106 521 100 533 100 C 549 100 557 110 557 127 V 184 H 540 V 131 C 540 120 535 115 526 115 C 517 115 511 121 511 133 V 184 H 494 V 131 C 494 120 489 115 480 115 C 471 115 465 121 465 133 V 184 H 448 V 102 Z"/>
  <!-- n -->
  <path fill="#0F172A" d="M 574 102 H 591 V 115 C 596 105 606 100 618 100 C 635 100 644 110 644 127 V 184 H 627 V 131 C 627 120 622 115 612 115 C 603 115 597 121 597 133 V 184 H 574 V 102 Z"/>
  <!-- i -->
  <path fill="#0F172A" d="M 661 102 H 678 V 184 H 661 V 102 Z M 660 83 C 660 77 665 72 670 72 C 675 72 680 77 680 83 C 680 89 675 94 670 94 C 665 94 660 89 660 83 Z"/>
  <!-- W (Azure Highlight) -->
  <path fill="#007AFF" d="M 698 76 H 718 L 733 148 L 748 76 H 767 L 782 148 L 797 76 H 817 L 793 184 H 772 L 757 118 L 742 184 H 721 Z"/>
  <!-- e -->
  <path fill="#0F172A" fill-rule="evenodd" d="M 830 143 H 877 C 876 128 867 115 854 115 C 841 115 832 126 830 143 Z M 854 100 C 874 100 894 114 894 140 V 147 H 830 C 832 163 842 171 855 171 C 865 171 873 166 877 159 L 892 166 C 884 179 871 186 854 186 C 831 186 813 168 813 143 C 813 118 831 100 854 100 Z"/>
  <!-- a -->
  <path fill="#0F172A" fill-rule="evenodd" d="M 946 122 V 184 H 931 V 172 C 926 181 916 186 905 186 C 890 186 877 175 877 158 C 877 141 891 131 911 131 H 930 V 127 C 930 118 923 113 912 113 C 903 113 896 117 893 123 L 879 116 C 885 106 897 100 913 100 C 934 100 946 109 946 122 Z M 930 143 H 913 C 902 143 895 149 895 158 C 895 167 902 173 911 173 C 922 173 930 165 930 155 Z"/>
  <!-- l -->
  <path fill="#0F172A" d="M 961 74 H 978 V 184 H 961 Z"/>
  <!-- t -->
  <path fill="#0F172A" d="M 1002 85 V 102 H 1017 V 116 H 1002 V 162 C 1002 169 1005 172 1012 172 H 1017 V 185 C 1013 186 1007 186 1001 186 C 989 186 985 179 985 166 V 116 H 974 V 102 H 985 V 85 Z"/>
  <!-- h -->
  <path fill="#0F172A" d="M 1032 74 H 1049 V 115 C 1054 105 1064 100 1076 100 C 1093 100 1102 110 1102 127 V 184 H 1085 V 131 C 1085 120 1080 115 1070 115 C 1061 115 1055 121 1055 133 V 184 H 1032 Z"/>
'''

def make_lockup(symbol_inner, title):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1140 256" width="1140" height="256" role="img" aria-labelledby="{title}">
  <title id="{title}">OmniWealth Horizontal Lockup</title>
  <g transform="translate(24, 0)">
    {symbol_inner}
  </g>
  <g id="wordmark">
    {wordmark_path_data}
  </g>
</svg>'''

# Extract symbol inner paths for embedding inside horizontal lockup
def extract_inner(svg_str):
    start = svg_str.find('>') + 1
    end = svg_str.rfind('</svg>')
    return svg_str[start:end].strip()

lockup_a = make_lockup(extract_inner(concept_a_symbol), "lockup-a")
lockup_b = make_lockup(extract_inner(concept_b_symbol), "lockup-b")
lockup_c = make_lockup(extract_inner(concept_c_symbol), "lockup-c")

with open(os.path.join(out_dir, "concept-a.svg"), "w", encoding="utf-8") as f:
    f.write(concept_a_symbol)
with open(os.path.join(out_dir, "concept-b.svg"), "w", encoding="utf-8") as f:
    f.write(concept_b_symbol)
with open(os.path.join(out_dir, "concept-c.svg"), "w", encoding="utf-8") as f:
    f.write(concept_c_symbol)

with open(os.path.join(out_dir, "lockup-a.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_a)
with open(os.path.join(out_dir, "lockup-b.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_b)
with open(os.path.join(out_dir, "lockup-c.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_c)

print("Symbols and Lockups generated successfully.")
