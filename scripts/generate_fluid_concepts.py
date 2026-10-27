import os
import math

out_dir = r"d:\AI\anigravity\omniwealth-v2\assets\logo-redesign"
os.makedirs(out_dir, exist_ok=True)

# ==============================================================================
# FLUID, ORGANIC, NON-RIGID LOGO MARKS (viewBox 0 0 256 256)
# ==============================================================================

# ------------------------------------------------------------------------------
# Concept 1: The Fluid Droplet Ripple (Tetesan Embun Mengalir)
# Pure organic liquid motion: an asymmetrical sweeping droplet forming a fluid whirlpool O.
# No straight lines, no rigid boxiness, smooth surface tension.
# ------------------------------------------------------------------------------
fluid_concept_1 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-f1">
  <title id="title-f1">OmniWealth - Concept 1: Fluid Droplet Ripple</title>
  <!-- Outer Sweeping Liquid Wave (Swirling Fluid Stream O) -->
  <path fill="#0F172A" fill-rule="evenodd" d="
    M 128 20
    C 192 20 236 68 236 130
    C 236 194 186 236 124 236
    C 62 236 20 190 20 128
    C 20 74 58 32 108 22
    C 118 20 126 28 124 38
    C 122 47 114 54 105 56
    C 72 64 48 93 48 128
    C 48 172 82 208 124 208
    C 168 208 208 174 208 130
    C 208 86 174 48 128 48
    C 117 48 109 40 110 29
    C 111 20 119 20 128 20 Z
  "/>
  <!-- Inner Living Water Droplet nestled naturally inside the fluid stream -->
  <path fill="#007AFF" d="
    M 134 82
    C 152 108 172 134 172 156
    C 172 179.2 153.2 198 130 198
    C 106.8 198 88 179.2 88 156
    C 88 134 114 108 134 82 Z
  "/>
</svg>'''

# ------------------------------------------------------------------------------
# Concept 2: The Continuous Liquid Ribbon (Pita Fluida Melengkung)
# Smooth, viscous fluid ribbon flowing in continuous compounding motion.
# Tapered organic curve, soft curves and gentle flowing rhythm.
# ------------------------------------------------------------------------------
fluid_concept_2 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-f2">
  <title id="title-f2">OmniWealth - Concept 2: Continuous Liquid Ribbon</title>
  <!-- Primary Sweeping Fluid Arm (Deep Obsidian Ink) -->
  <path fill="#0F172A" d="
    M 128 24
    C 185 24 232 71 232 128
    C 232 185 185 232 128 232
    C 88 232 53 210 35 178
    C 29 168 34 156 45 153
    C 55 150 66 156 73 166
    C 86 186 106 198 128 198
    C 166.7 198 198 166.7 198 128
    C 198 89.3 166.7 58 128 58
    C 102 58 79 73 67 95
    C 61 106 48 109 38 103
    C 28 97 26 84 34 73
    C 54 38 89 24 128 24 Z
  "/>
  <!-- Secondary Dynamic Wave Stream (Azure Blue Accent) flowing into the loop -->
  <path fill="#007AFF" d="
    M 42 124
    C 54 84 94 62 136 68
    C 147 70 154 80 151 90
    C 148 100 137 106 127 104
    C 98 100 72 116 68 142
    C 66 153 56 160 46 157
    C 36 154 30 144 33 134
    C 35 130 38 127 42 124 Z
  "/>
  <!-- Liquid Droplet Nucleus floating at center-right -->
  <circle cx="132" cy="132" r="24" fill="#007AFF"/>
</svg>'''

# ------------------------------------------------------------------------------
# Concept 3: The Tactile Liquid Pebble (Batu Kaca Air & Tetesan Lembut)
# Organic hyper-rounded squircle (Apple pebble aesthetic) with an organic liquid aperture.
# Highly touchable, soft, friendly, ultra-luxurious, zero harsh corners.
# ------------------------------------------------------------------------------
fluid_concept_3 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-f3">
  <title id="title-f3">OmniWealth - Concept 3: Tactile Liquid Pebble</title>
  <!-- Organic Smooth Pebble Silhouette (Super-smooth continuous curvature) -->
  <path fill="#0F172A" fill-rule="evenodd" d="
    M 128 20
    C 195 20 236 61 236 128
    C 236 195 195 236 128 236
    C 61 236 20 195 20 128
    C 20 61 61 20 128 20 Z
    M 128 66
    C 86 66 58 96 58 134
    C 58 170 88 194 128 194
    C 168 194 198 170 198 134
    C 198 96 170 66 128 66 Z
  "/>
  <!-- Smooth Organic Water Teardrop Core (Soft Curved Droplet) -->
  <path fill="#007AFF" d="
    M 128 88
    C 142 108 162 130 162 148
    C 162 166.8 146.8 182 128 182
    C 109.2 182 94 166.8 94 148
    C 94 130 114 108 128 88 Z
  "/>
</svg>'''

# Save the 3 new fluid concepts
with open(os.path.join(out_dir, "concept-a.svg"), "w", encoding="utf-8") as f:
    f.write(fluid_concept_1)

with open(os.path.join(out_dir, "concept-b.svg"), "w", encoding="utf-8") as f:
    f.write(fluid_concept_2)

with open(os.path.join(out_dir, "concept-c.svg"), "w", encoding="utf-8") as f:
    f.write(fluid_concept_3)

# Function to build lockups cleanly without external imports
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

lockup_1 = make_lockup(extract_inner(fluid_concept_1), "lockup-a")
lockup_2 = make_lockup(extract_inner(fluid_concept_2), "lockup-b")
lockup_3 = make_lockup(extract_inner(fluid_concept_3), "lockup-c")

with open(os.path.join(out_dir, "lockup-a.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_1)
with open(os.path.join(out_dir, "lockup-b.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_2)
with open(os.path.join(out_dir, "lockup-c.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_3)

print("Generated 3 organic, fluid, non-rigid logo concepts and lockups.")
