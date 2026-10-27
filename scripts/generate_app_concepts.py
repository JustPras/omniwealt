import os
import math

out_dir = r"d:\AI\anigravity\omniwealth-v2\assets\logo-redesign"
os.makedirs(out_dir, exist_ok=True)

# ==============================================================================
# APP-CENTRIC LOGO MARKS FOR OMNIWEALTH (viewBox 0 0 256 256)
# Focus: True Net Worth, Omni-Asset Convergence, Wealth Navigation & Growth
# ==============================================================================

# ------------------------------------------------------------------------------
# Concept 1: The Wealth Compass / Polaris 'O' (Navigasi Kekayaan 360°)
# App Focus: OmniWealth as the 360-degree financial compass for tracking True Net Worth.
# Geometry: Bold outer 'O' ring (Omni) with a dynamic 45-degree ascending compass diamond
# pointing toward the top-right growth quadrant.
# ------------------------------------------------------------------------------
app_concept_1 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-app-1">
  <title id="title-app-1">OmniWealth - Concept 1: Wealth Compass O</title>
  <!-- Outer 'O' (Omni: 360-degree complete financial view) -->
  <path fill="#0F172A" fill-rule="evenodd" d="
    M 128 20
    C 187.6 20 236 68.4 236 128
    C 236 187.6 187.6 236 128 236
    C 68.4 236 20 187.6 20 128
    C 20 68.4 68.4 20 128 20 Z
    M 128 56
    C 88.2 56 56 88.2 56 128
    C 56 167.8 88.2 200 128 200
    C 167.8 200 200 167.8 200 128
    C 200 88.2 167.8 56 128 56 Z
  "/>
  <!-- 45-Degree Ascending Compass Arrow (Top-Right Growth Trajectory) -->
  <!-- Upper-Right Arrow Head (Active Financial Trajectory in Azure Blue) -->
  <path fill="#007AFF" d="
    M 128 128
    L 120 110
    L 174 82
    L 146 136
    Z
  "/>
  <!-- Lower-Left Compass Needle Tail (Foundation / Anchor in Deep Slate) -->
  <path fill="#334155" d="
    M 128 128
    L 136 146
    L 82 174
    L 110 120
    Z
  "/>
  <!-- Central Precision Pivot -->
  <circle cx="128" cy="128" r="8" fill="#FFFFFF"/>
  <circle cx="128" cy="128" r="4" fill="#0F172A"/>
</svg>'''

# ------------------------------------------------------------------------------
# Concept 2: The Asset Convergence Nexus (Pusat Penyatuan Multi-Aset)
# App Focus: "Omni" = integrating all financial buckets (Cash, Stocks IDX, Crypto, Liabilities)
# Geometry: 3 interlocking orbital segments forming a unified 'O' ring around a central core.
# ------------------------------------------------------------------------------
app_concept_2 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-app-2">
  <title id="title-app-2">OmniWealth - Concept 2: Asset Convergence Nexus</title>
  <!-- Segment 1: Liquid Cash & Banking Pillar (Left Arc) -->
  <path fill="#0F172A" d="
    M 116 22
    C 58 28 22 72 22 128
    C 22 158 35 186 56 206
    L 76 182
    C 62 167 52 148 52 128
    C 52 86 78 52 116 48
    Z
  "/>
  <!-- Segment 2: Capital Markets & Equities Pillar (Right Arc) -->
  <path fill="#0F172A" d="
    M 140 22
    C 198 28 234 72 234 128
    C 234 158 221 186 200 206
    L 180 182
    C 194 167 204 148 204 128
    C 204 86 178 52 140 48
    Z
  "/>
  <!-- Segment 3: Web3 & Growth Catalyst Pillar (Bottom Ascending Base) in Azure Blue -->
  <path fill="#007AFF" d="
    M 72 216
    C 88 228 107 236 128 236
    C 149 236 168 228 184 216
    L 168 194
    C 156 202 143 208 128 208
    C 113 208 100 202 88 194
    Z
  "/>
  <!-- Central Wealth Nucleus (True Net Worth convergence core) -->
  <circle cx="128" cy="128" r="32" fill="#007AFF"/>
  <circle cx="128" cy="128" r="14" fill="#FFFFFF"/>
</svg>'''

# ------------------------------------------------------------------------------
# Concept 3: The Ascending Ledger 'OW' (Neraca Saldo & Pertumbuhan Bertingkat)
# App Focus: Net Worth formula (Asset - Debt) and continuous stair-step wealth compounding.
# Geometry: Clean 'O' perimeter with 3 ascending stepped wealth columns inside forming 'W'.
# ------------------------------------------------------------------------------
app_concept_3 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-app-3">
  <title id="title-app-3">OmniWealth - Concept 3: Ascending Ledger OW</title>
  <!-- Outer Protective Wealth Vault 'O' (Perimeter ring) -->
  <path fill="#0F172A" fill-rule="evenodd" d="
    M 128 20
    C 187.6 20 236 68.4 236 128
    C 236 187.6 187.6 236 128 236
    C 68.4 236 20 187.6 20 128
    C 20 68.4 68.4 20 128 20 Z
    M 128 48
    C 83.8 48 48 83.8 48 128
    C 48 172.2 83.8 208 128 208
    C 172.2 208 208 172.2 208 128
    C 208 83.8 172.2 48 128 48 Z
  "/>
  <!-- Column 1: Base Reserves / Liquid Cash (Height 54) -->
  <rect x="74" y="132" width="26" height="54" rx="13" fill="#334155"/>
  <!-- Column 2: Investment Portfolio / Saham IDX (Height 80) -->
  <rect x="115" y="106" width="26" height="80" rx="13" fill="#007AFF"/>
  <!-- Column 3: Total Net Worth Apex / Capital Growth (Height 106) -->
  <rect x="156" y="80" width="26" height="106" rx="13" fill="#007AFF"/>
  <!-- Growth Momentum Indicator Dot at Peak -->
  <circle cx="169" cy="58" r="8" fill="#007AFF"/>
</svg>'''

# Save the 3 app-centric symbols
with open(os.path.join(out_dir, "concept-a.svg"), "w", encoding="utf-8") as f:
    f.write(app_concept_1)

with open(os.path.join(out_dir, "concept-b.svg"), "w", encoding="utf-8") as f:
    f.write(app_concept_2)

with open(os.path.join(out_dir, "concept-c.svg"), "w", encoding="utf-8") as f:
    f.write(app_concept_3)

# Function to build lockups cleanly
def extract_inner(svg_str):
    start = svg_str.find('>') + 1
    end = svg_str.rfind('</svg>')
    return svg_str[start:end].strip()

# Wordmark paths
wordmark_path_data = '''
  <path fill="#0F172A" fill-rule="evenodd" d="M 370 76 C 401 76 425 100 425 131 C 425 162 401 186 370 186 C 339 186 315 162 315 131 C 315 100 339 76 370 76 Z M 370 95 C 350 95 334 111 334 131 C 334 151 350 167 370 167 C 390 167 406 151 406 131 C 406 111 390 95 370 95 Z"/>
  <path fill="#0F172A" d="M 440 102 H 457 V 114 C 462 105 471 100 482 100 C 493 100 501 106 505 116 C 511 106 521 100 533 100 C 549 100 557 110 557 127 V 184 H 540 V 131 C 540 120 535 115 526 115 C 517 115 511 121 511 133 V 184 H 494 V 131 C 494 120 489 115 480 115 C 471 115 465 121 465 133 V 184 H 448 V 102 Z"/>
  <path fill="#0F172A" d="M 574 102 H 591 V 115 C 596 105 606 100 618 100 C 635 100 644 110 644 127 V 184 H 627 V 131 C 627 120 622 115 612 115 C 603 115 597 121 597 133 V 184 H 574 V 102 Z"/>
  <path fill="#0F172A" d="M 661 102 H 678 V 184 H 661 V 102 Z M 660 83 C 660 77 665 72 670 72 C 675 72 680 77 680 83 C 680 89 675 94 670 94 C 665 94 660 89 660 83 Z"/>
  <path fill="#007AFF" d="M 698 76 H 718 L 733 148 L 748 76 H 767 L 782 148 L 797 76 H 817 L 793 184 H 772 L 757 118 L 742 184 H 721 Z"/>
  <path fill="#0F172A" fill-rule="evenodd" d="M 830 143 H 877 C 876 128 867 115 854 115 C 841 115 832 126 830 143 Z M 854 100 C 874 100 894 114 894 140 V 147 H 830 C 832 163 842 171 855 171 C 865 171 873 166 877 159 L 892 166 C 884 179 871 186 854 186 C 831 186 813 168 813 143 C 813 118 831 100 854 100 Z"/>
  <path fill="#0F172A" fill-rule="evenodd" d="M 946 122 V 184 H 931 V 172 C 926 181 916 186 905 186 C 890 186 877 175 877 158 C 877 141 891 131 911 131 H 930 V 127 C 930 118 923 113 912 113 C 903 113 896 117 893 123 L 879 116 C 885 106 897 100 913 100 C 934 100 946 109 946 122 Z M 930 143 H 913 C 902 143 895 149 895 158 C 895 167 902 173 911 173 C 922 173 930 165 930 155 Z"/>
  <path fill="#0F172A" d="M 961 74 H 978 V 184 H 961 Z"/>
  <path fill="#0F172A" d="M 1002 85 V 102 H 1017 V 116 H 1002 V 162 C 1002 169 1005 172 1012 172 H 1017 V 185 C 1013 186 1007 186 1001 186 C 989 186 985 179 985 166 V 116 H 974 V 102 H 985 V 85 Z"/>
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

lockup_1 = make_lockup(extract_inner(app_concept_1), "lockup-a")
lockup_2 = make_lockup(extract_inner(app_concept_2), "lockup-b")
lockup_3 = make_lockup(extract_inner(app_concept_3), "lockup-c")

with open(os.path.join(out_dir, "lockup-a.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_1)
with open(os.path.join(out_dir, "lockup-b.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_2)
with open(os.path.join(out_dir, "lockup-c.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_3)

print("Generated 3 App-Centric logo concepts and lockups.")
