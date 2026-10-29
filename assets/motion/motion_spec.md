# OmniWealth — Motion Specification (Pixel2Motion)
*Motion Voice: Perpetual Harmonic Convergence*

---

## 1. Motion Brief & Brand Personality

- **Brand**: OmniWealth (Air-Gapped Sovereign Personal Wealth Sanctuary)
- **Motion Personality**: **Sovereign, Perpetual, Precise**
- **Derivation**:
  - *Energy Axis*: Low-to-Medium (Calm, institutional, perpetual energy without haste or anxiety).
  - *Tone Axis*: Serious & Refined (Swiss bullion vault, high-net-worth privacy, mathematical precision).
- **Usage Context**: **Continuous Loading & Background Ledger Sync State**
  - Continuous seamless loop (`2400ms` period on a shared clock).
  - Hypnotic, non-distracting, calming even after 60+ seconds of prolonged execution (e.g. OCR PDF parsing or multi-chain wallet reconciliation).

---

## 2. Disney Principles Applied to the Loading State

| Principle | Logo Application | Parameter Range / Implementation |
| :--- | :--- | :--- |
| **Staging** | Central Singularity anchored at (128, 128); outer arcs converge inward | The Central Nexus Core remains the geometric focal anchor; background glow pulses softly behind. |
| **Slow In / Slow Out** | Non-linear, silky cubic-bezier easing curves on all keyframes | Respiration: `cubic-bezier(0.45, 0.05, 0.55, 0.95)`; Gravitational pull: `cubic-bezier(0.4, 0, 0.2, 1)`. |
| **Overlapping Action** | Phased triad breathing — parts never start or peak together | `#arc-left` leads at 0%, `#arc-right` follows at 33.3% (+800ms), `#arc-bottom` follows at 66.6% (+1600ms). |
| **Follow Through** | Elastic recovery after contraction beat | Each arc rebounds slightly (+1px outer expansion) before settling smoothly to baseline. |
| **Secondary Action** | Ambient gold corona bloom & celestial gyroscopic hover | `#nexus-core` expands a gold shadow `drop-shadow(0 0 12px rgba(212,175,55,0.65))`; root container hovers 2.5px. |
| **Solid Drawing** | Strict geometric integrity preserved | 0% destructive squash/stretch; subtle radial translation (≤3.5px) and scale (≤8.5%) only. |
| **Appeal & Restraint** | Institutional Swiss elegance | No bouncy cartoon deformation; dignified, perpetual mechanical balance. |

---

## 3. Timeline & Choreography Table (Shared Clock: 2400ms)

All actors operate synchronously on a single 2400ms period (`--p2m-duration: 2400ms`):

```
Time (ms)  0ms       600ms      1200ms     1800ms     2400ms
Phase      0%        25%        50%        75%        100%
─────────────────────────────────────────────────────────────
#nexus     Rest      Scale ↑    Peak 1.09x Scale ↓    Rest (1.0x)
#arc-left  Contract  Peak In    Relax      Rebound    Rest (0px)
#arc-right Rebound   Contract   Peak In    Relax      Rebound (-0.6px)
#arc-bot   Relax     Rebound    Contract   Peak In    Relax (-2.2px)
#omni-mark Baseline  Hover ↑    Peak 2.5px Hover ↓    Baseline (0px)
```

### Keyframe Coordinates & Literal Easing Values:

1. **`#omni-mark` (Root Gyroscope)**:
   - `0%`: `transform: translateY(0px) rotate(0deg);`
   - `50%`: `transform: translateY(-2.5px) rotate(1.2deg);` `[cubic-bezier(0.45, 0.05, 0.55, 0.95)]`
   - `100%`: `transform: translateY(0px) rotate(0deg);`

2. **`#nexus-core` (Central Singularity Respiration)**:
   - `0%`: `transform: scale(1.0); opacity: 0.88; filter: drop-shadow(0 0 0px rgba(212,175,55,0));`
   - `50%`: `transform: scale(1.085); opacity: 1.0; filter: drop-shadow(0 0 12px rgba(212,175,55,0.65));` `[cubic-bezier(0.45, 0.05, 0.55, 0.95)]`
   - `100%`: `transform: scale(1.0); opacity: 0.88; filter: drop-shadow(0 0 0px rgba(212,175,55,0));`

3. **`#arc-left` (Banking & Cash Pillar — Phase 0%)**:
   - `0%`: `transform: translate(0px, 0px) scale(1.0); opacity: 0.92;`
   - `25%`: `transform: translate(3.5px, 0px) scale(0.985); opacity: 1.0;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `50%`: `transform: translate(0px, 0px) scale(1.0); opacity: 0.92;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `75%`: `transform: translate(-1.2px, 0px) scale(1.008); opacity: 0.86;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `100%`: `transform: translate(0px, 0px) scale(1.0); opacity: 0.92;`

4. **`#arc-right` (Equities & IDX Pillar — Phase 33.3% / +800ms)**:
   - `0%`: `transform: translate(-0.6px, 0px) scale(1.004); opacity: 0.88;`
   - `33.3%`: `transform: translate(0px, 0px) scale(1.0); opacity: 0.92;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `58.3%`: `transform: translate(-3.5px, 0px) scale(0.985); opacity: 1.0;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `83.3%`: `transform: translate(0px, 0px) scale(1.0); opacity: 0.92;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `100%`: `transform: translate(-0.6px, 0px) scale(1.004); opacity: 0.88;`

5. **`#arc-bottom` (Web3 & Yield Pillar — Phase 66.6% / +1600ms)**:
   - `0%`: `transform: translate(0px, -2.2px) scale(0.99); opacity: 0.96;`
   - `16.6%`: `transform: translate(0px, 0px) scale(1.0); opacity: 0.92;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `41.6%`: `transform: translate(0px, 1.2px) scale(1.008); opacity: 0.86;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `66.6%`: `transform: translate(0px, 0px) scale(1.0); opacity: 0.92;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `91.6%`: `transform: translate(0px, -3.2px) scale(0.985); opacity: 1.0;` `[cubic-bezier(0.4, 0, 0.2, 1)]`
   - `100%`: `transform: translate(0px, -2.2px) scale(0.99); opacity: 0.96;`

---

## 4. Atomic Motion Studies

1. **Study A: Respiration (Ambient Sync)**:
   - Isolated harmonic breathing for low-key background syncing indicators.
2. **Study B: Gyroscope (High-Intensity Ingestion)**:
   - Continuous smooth rotational precession (`0.9° / frame`) for heavy AI Bank OCR and PDF statement parsing.
3. **Study C: Magnetic Hover (Cursor Focus)**:
   - Dynamic elevation (`scale(1.12) translateY(-2px)`) with instant spring response.
4. **Study D: Haptic Press & Settle (Touch Feedback)**:
   - Immediate crisp compression (`scale(0.88)` at 100ms) with bouncy settling (`cubic-bezier(0.34, 1.56, 0.64, 1)` at 360ms).

---

## 5. Reduced Motion & Final Frame Contract

- **`prefers-reduced-motion: reduce`**:
  All keyframes and transitions are suppressed (`animation: none !important`). The logo renders at its static reference state with 100% opacity and 0 transform offset.
- **Same-Pipeline QA (`?static=1` vs `?t=2400`)**:
  Both resolve to the exact identical geometry, verified to `0 diff`.
