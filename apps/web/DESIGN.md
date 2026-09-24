# GOOGLE STITCH DESIGN SPECIFICATION: AETHER-STITCH
## Bespoke Autonomous Statutory Intelligence & Regulatory Compiler

---

### 1. Design System Overview & Philosophy
**AETHER-STITCH** is a bespoke, non-generic Google Stitch design system specifically engineered for **RegCompiler** (Autonomous Statutory Intelligence & Regulation-as-Code Compiler). 

Unlike standard, generic AI templates or flat Material designs, AETHER-STITCH embodies the aesthetic of high-assurance statutory mission control—combining the tactical density of Palantir Foundry, the typographic precision of Linear, and the deep optical richness of Stripe Press.

#### Core Tenets:
1. **Deterministic Authority**: Every UI element signals cryptographic certainty, formal statutory grounding, and zero-hallucination rigor.
2. **Obsidian Surface Architecture**: Multi-layered dark glass surfaces (`#03070C` void, `#080D14` tactical deck, `#0E1520` elevated cards) with subtle optical refraction (`backdrop-blur-2xl`).
3. **Cyber-Tactical Lighting**: Precision chromatic accents (Luminescent Cyan `#00F0FF`, Statutory Emerald `#10B981`, Advisory Amber `#F59E0B`, Violation Rose `#F43F5E`) used sparingly as functional telemetry, not decorative noise.
4. **Information Density & Micro-Typography**: High-density data tables, monospaced metadata badges (`font-mono text-[10px] tracking-widest uppercase`), and HUD crosshair corner brackets (`+ [NODE: 01] +`).
5. **Continuous 3D Synergy**: The Three.js WebGL `ComplianceField` on the landing page is revered as the core computational environment; interior pages extend its atmospheric depth via hardware-accelerated ambient optical wells and precision micro-grids.

---

### 2. Design Tokens & Color Palette

#### 2.1 Surface & Background Tokens
| Token Name | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--stitch-bg-void` | `#03070C` | Deep obsidian canvas, global root background |
| `--stitch-surface-deck` | `#080D14` | Tactical container background, command deck |
| `--stitch-surface-card` | `rgba(14, 21, 32, 0.75)` | Frosted glass cards, telemetry panels |
| `--stitch-surface-elevated` | `rgba(20, 30, 44, 0.85)` | Active modals, dropdowns, hovered elements |
| `--stitch-surface-input` | `rgba(10, 16, 26, 0.90)` | Form fields, search bars, terminal inputs |

#### 2.2 Border & Divider Tokens
| Token Name | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--stitch-border-subtle` | `rgba(255, 255, 255, 0.08)` | Default card and panel perimeter |
| `--stitch-border-medium` | `rgba(255, 255, 255, 0.14)` | Hover boundaries, active tab separators |
| `--stitch-border-cyan` | `rgba(0, 240, 255, 0.35)` | Interactive focus states, primary selection |
| `--stitch-border-emerald` | `rgba(16, 185, 129, 0.35)` | Compliant/verified state indicators |
| `--stitch-border-rose` | `rgba(244, 63, 94, 0.35)` | Statutory violation alerts, critical gaps |

#### 2.3 Functional Accent Telemetry
| Token Name | Hex | Functional Context |
| :--- | :--- | :--- |
| `--stitch-cyan` | `#00F0FF` | Primary active signal, AST compilation cursor, laser guides |
| `--stitch-emerald` | `#10B981` | Fully verified, 100% compliant, active surveillance heartbeat |
| `--stitch-amber` | `#F59E0B` | Advisory caution, pending regulatory amendment, warning |
| `--stitch-rose` | `#F43F5E` | Non-compliance breach, unmitigated regulatory gap |
| `--stitch-indigo` | `#6366F1` | Neural parsing, semantic graph vector links |

---

### 3. Typography Scale & Hierarchies

- **Headings & Wordmarks**: `Geist Sans` / `Inter`, heavy tracking (-0.03em), high contrast white (`#FFFFFF` to `#E2E8F0`).
- **Body & Editorial**: `Geist Sans`, balanced optical line heights (1.5 - 1.6), muted silver (`#94A3B8`).
- **Telemetry & Metadata**: `Geist Mono`, all-caps, tracking-widest (+0.12em), scale `9px` to `11px` (`#64748B` to `#94A3B8`).

```css
/* Stitch Micro-Metadata Badge */
.stitch-telemetry-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
}
```

---

### 4. Elevation, Depth & Glassmorphism

Every container follows the 4-layer optical depth hierarchy:
1. **Level 0 (Void)**: `#03070C` with subtle radial optical wells (Cyan 4%, Indigo 3%, 140px blur) and 40px micro-mesh tactical grid.
2. **Level 1 (Deck)**: `backdrop-blur-2xl bg-[#080D14]/80 border border-white/[0.08]` with soft shadow `shadow-[0_8px_32px_rgba(0,0,0,0.6)]`.
3. **Level 2 (Interactive Card)**: `hover:border-[#00F0FF]/30 hover:shadow-[0_0_24px_rgba(0,240,255,0.12)] hover:-translate-y-0.5 transition-all duration-300`.
4. **Level 3 (Overlay / Modal)**: `bg-[#0C131D]/95 backdrop-blur-3xl border border-white/[0.14] shadow-[0_24px_64px_rgba(0,0,0,0.85)]`.

---

### 5. Component Anatomy & Stitch Standards

#### 5.1 Command TopNav
- Frosted floating command deck.
- Real-time statutory surveillance status pill with animated green radar beacon.
- Monospaced jurisdiction counter (`10 AUTHORITIES MONITORED`).
- High-contrast tactile CTA button with cyan glow box-shadow.

#### 5.2 Tactical Statutory Card
- Corner HUD crosshair brackets (`+ [REG: EU-AI-ACT] +`).
- Jurisdiction badge with chromatic tag (EU blue, US green, UK cyan, SG amber).
- Enforceable requirements counter with glowing micro-badge.
- Action button with smooth arrow transition and laser sweep hover effect.

#### 5.3 KPI & Telemetry Meters
- Monospaced metric titles with micro-indicators.
- Giant numerical value in ultra-crisp white.
- Radial or horizontal progress track with dual-stop chromatic gradient.
- Live pulse marker indicating continuous real-time synchronization.

#### 5.4 Architectural Statutory Footer
- Live system status beacon ("ALL SYSTEMS NOMINAL | LATENCY: 12ms").
- Monitored authority chips (`EU AI ACT`, `SEC`, `DORA`, `MAS`, `FCA`, `HIPAA`, `GDPR`).
- Cryptographic SHA-256 statutory compilation seal.

---

### 6. Motion, Transitions & Micro-Interactions

- **Hover Transitions**: Standard `cubic-bezier(0.16, 1, 0.3, 1)` (snappy 200ms ease-out).
- **Radar Pulse**: Smooth continuous scale & fade keyframe (`@keyframes stitch-radar-ping`).
- **Glow Pulse**: Breathing ambient border luminescence (`@keyframes stitch-glow-pulse`).
- **Laser Edge Flow**: Running animated dashed stroke on active nodes.
- **Accessibility**: All animations automatically disabled under `@media (prefers-reduced-motion: reduce)`.
