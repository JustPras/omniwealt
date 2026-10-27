import math

CLEAN_ANGLES = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]

def check_needle(p_center, p_tip, p_wing_left, p_wing_right):
    lines = [
        (p_center, p_wing_left),
        (p_wing_left, p_tip),
        (p_tip, p_wing_right),
        (p_wing_right, p_center),
    ]
    bad = []
    for a, b in lines:
        ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0])) % 180
        closest = min(CLEAN_ANGLES, key=lambda c: abs(c - ang))
        dev = abs(closest - ang)
        if 0.3 < dev <= 3.0:
            bad.append((a, b, ang, closest, dev))
    return len(bad) == 0, bad

# Center is (128, 128)
# Compass needle points 45 degrees up-right: tip = (128 + L, 128 - L)
# Left wing = (128 - w1, 128 - w2), right wing = (128 + w2, 128 + w1) etc.
found = []
for L in range(40, 60):
    tip = (128 + L, 128 - L)
    for w in range(10, 25):
        # wings along perpendicular diagonal (slope = 1): (128 - w, 128 - w) and (128 + w, 128 + w)?
        # Wait, the 45 deg line has slope -1 (dx = L, dy = -L).
        # The perpendicular line has slope 1 (dx = w, dy = w).
        # So wings along the perpendicular:
        # wing_l = (128 - w, 128 - w)
        # wing_r = (128 + w, 128 + w)
        # Tip is (128 + L, 128 - L)
        # Let's test!
        ok, bad = check_needle((128, 128), tip, (128 - w, 128 - w), (128 + w, 128 + w))
        if ok:
            # Check angle from wing_l to tip:
            # dx = L + w, dy = -L + w
            # If L=48, w=16: dx = 64, dy = -32 -> atan2(-32, 64) = -26.56° -> 153.4° (dev from 150 = 3.4° > 3.0!)
            found.append((L, w, tip, (128 - w, 128 - w), (128 + w, 128 + w)))

for w in range(10, 25):
    ok, bad = check_needle((128, 128), (176, 80), (128 - w, 128 - w), (128 + w, 128 + w))
    print(f"w={w}: ok={ok}, bad={bad}")

