# Critical Path Radar (Minithon 4.0)

> **Construction Project Delay Risk Monitor**  
> *A Gantt chart shows WHEN tasks happen. Critical Path Radar shows WHICH delays actually threaten the deadline and WHAT to do about it.*

[![Engine Tests](https://img.shields.io/badge/Vitest-5%20Passed-brightgreen)](https://github.com/nairkartik08/BuildWatch-cpm)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 The Problem

Traditional construction management relies on static Gantt charts. When a shipment slips by 5 days, managers don't know if that slip is safely absorbed by slack buffer or if it triggers a domino effect pushing the handover date and costing millions in liquidated damages.

**Critical Path Radar** models the construction site as an active topological network:
1. Calculates **Critical Path Method (CPM)** live in your browser on every schedule change.
2. Runs **Monte Carlo simulations (600+ runs)** using triangular distributions and contractor reliability ratings to determine real-world deadline confidence.
3. Visualizes the **Delay Blast Radius**, lighting up every downstream task affected by a slip.
4. Quantifies **Delay Attribution** across Delivery, Weather, and Crew causes.
5. Recommends a ranked **Recovery Plan** (Crash task, Expedite delivery) sorted by days saved per rupee spent (ROI).

---

## 🏗️ Interactive 3D Landing Page & App Views

- **`/` (3D Interactive Landing)**: Procedural WebGL/Three.js construction site with animated tower cranes, mixer trucks orbiting roads, rising concrete core floors, and an interactive critical path radar overlay.
- **`/app` (Main Radar Dashboard)**: Circular deadline confidence gauge, KPI metrics, Gantt radar with baseline ghost bars, 600-run Monte Carlo distribution, criticality index risk table, delay attribution stacked bar, and recovery optimizer.
- **`/app/schedule` (Full Gantt Timeline)**: Custom SVG Gantt chart with today line (Day 12), deadline marker (Day 65), free float slack indicators, zoom controls (16px to 48px), trade filtering, and curved dependency connector arrows.
- **`/app/graph` (Dependency Network)**: React Flow + Dagre hierarchical Directed Acyclic Graph (DAG) with animated critical-path edges and click-to-activate delay blast radius.
- **`/app/tasks` (Tasks & Delays Register)**: Full task CRUD with cycle-safe dependency multi-select, live preview delay injection modal, progress reporting slider, and contractor/manager field notes.
- **`/app/report` (Executive Audit & Shareable Link)**: Compressed self-contained audit snapshot with a 1-click `lz-string` URL hash exporter.

---

## ⚡ 60-Second Scripted Demo Walkthrough

Follow this scripted flow during the hackathon demonstration:

1. **Observe Pristine Baseline (`/app`)**:
   - Target Deadline: **Day 65**.
   - Projected Finish: **Day 65** (0d variance).
   - Deadline Confidence: **~88% - 92%** (Green circular gauge).
   - Critical Tasks: **9 tasks** in red.
2. **Inject the Delivery Slip**:
   - In the top toolbar, click **`🔥 Steel +6d`**.
   - **Confidence Collapses**: Confidence drops from ~90% down to **41%** (Gauge turns red).
   - **Schedule Moves**: Projected finish shifts to **Day 71 (+6d over deadline)**.
   - **Critical Path Switches**: Structural steel delivery becomes the primary bottleneck, and baseline ghost bars show the schedule drift.
3. **Trace the Blast Radius**:
   - Click on the delayed **Structural Steel** row: the banner reports that **5+ downstream tasks are hit** and downstream tasks illuminate with their slip amounts (`+5d`).
   - Switch to **`/app/graph`**: notice the red pulsing critical flow lines redirecting through the steel chain.
4. **Apply the Optimal Recovery Action**:
   - Return to **`/app`** and inspect the **Recovery Optimizer** at the bottom.
   - Notice **`⭐ Expedite Structural Steel`** is ranked #1 (recovers 4 days for ₹0.85L with high ROI).
   - Click **`Apply Action`**: the delivery delay is compressed, projected finish returns toward the deadline, and confidence recovers to **~80%**.
5. **Reset Demo**:
   - Click **`↺ Reset`** at any time to return to the clean seed baseline.

---

## 🛠️ Tech Stack & Architecture

- **Core**: React 18, Vite 6, TypeScript (Strict mode enabled, no `any` shortcuts).
- **Styling**: Tailwind CSS with custom radar palette (`#0b0f16` background, `#ff4d4d` critical red, `#ffb020` near-critical amber, `#35d07f` safe green, `#4da3ff` in-progress blue).
- **State**: Zustand with `localStorage` persistence.
- **Graph & Charts**: `@xyflow/react` + `dagre` hierarchical DAG layout engine.
- **Dates & Compression**: `date-fns`, `lz-string` URL hash compression.
- **Engine Tests**: Pure TypeScript test suite running on `vitest`.

---

## 🚀 Quickstart & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Engine Tests
```bash
npx vitest run
```
*Executes all 5 algorithmic scenarios: linear chain, diamond float, Kahn cycle detection, critical path flip on delay, and full hospital seed dataset.*

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 📊 CPM Engine Specification

- **Kahn's Topological Sort**: Detects cycles and throws a descriptive `ScheduleCycleError` with offending task IDs.
- **Effective Duration**:
  - Completed: `actualFinish - actualStart`
  - In Progress: `elapsed + durationLikely * (1 - percent/100)`
  - Not Started: `durationLikely + sum(delayEvents)`
- **Forward Pass**: `ES = max(EF of predecessors, constraintStart)`, `EF = ES + effectiveDuration`.
- **Backward Pass**: `baseline = max(projectFinish, targetFinish)`, `LF = min(LS of successors)`, `LS = LF - effectiveDuration`.
- **Float & Criticality**: `float = LS - ES`. Critical: `float <= 0`, Near-critical: `0 < float <= 2`.

---

*Built for Minithon 4.0 · TechNext 2026*
