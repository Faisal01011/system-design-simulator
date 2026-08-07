# System Design Simulator

> An immersive **3D flight simulator for distributed systems**.
>
> Build realistic architectures, wire components, inject traffic, and watch latency, queues, cache hits, and cascading failures unfold in real time.

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Three.js](https://img.shields.io/badge/Three.js-0.170-black)

## Why this exists

Most system-design learning is static diagrams + verbal explanations. This tool turns those diagrams into a living system you can stress, break, and improve. The goal is durable intuition about:

- Load balancing strategies
- Caching (hit rate vs origin load)
- Horizontal scaling
- Queueing and capacity limits
- Cascading failures
- Latency percentiles under load

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Deploy to Vercel

1. Push this repo to GitHub (already done if you are reading this).
2. Import the repository in the [Vercel dashboard](https://vercel.com/new).
3. Framework preset: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy.

That is the entire deployment path.

## Features (MVP)

| Area | What you get |
|------|--------------|
| **3D Canvas** | Orbit controls, infinite grid, distinct component geometries, utilization glow |
| **Components** | Client, Load Balancer, App Server, Cache, Database, Message Queue, CDN, API Gateway |
| **Wiring** | Click → Connect → click target. Animated request particles along edges |
| **Simulation** | Real-time RPS generation, capacity limits, processing latency, failures, cache hit/miss |
| **Metrics** | Live throughput, p50/p95/p99 latency, error rate, cache hit ratio, per-component utilization |
| **Controls** | Play/Pause, Reset, RPS slider (1–2000), simulation speed (0.5×–4×) |
| **Templates** | Simple Monolith, Classic 3-Tier + Cache, High-Traffic API, Blank Canvas |
| **Inspector** | Edit capacity, latency, hit rate, LB algorithm; inject failures; manage connections |
| **Export** | Architecture as JSON |

## Learning Path (suggested)

1. Load **Classic 3-Tier + Cache**.
2. Start simulation at ~80 RPS. Observe healthy metrics.
3. Raise RPS to 400–600. Watch servers saturate and p99 climb.
4. Add two more App Servers and re-wire under the load balancer.
5. Raise cache hit rate to 95 %. Notice origin (DB) load collapse.
6. Inject a failure on one server. Observe traffic shift (especially with Least-Connections).
7. Start from blank and rebuild the same architecture yourself.

## Tech Stack

- **React 18** + **TypeScript**
- **Three.js** via `@react-three/fiber` + `@react-three/drei`
- **Zustand** for reactive state
- **Tailwind CSS** (dark engineering aesthetic)
- **Vite** for fast builds

## Project Structure

```
src/
├── components/
│   ├── Scene/          # 3D meshes, particles, grid, canvas
│   └── UI/             # Sidebar, metrics, controls, inspector
├── simulation/
│   ├── engine.ts       # Core discrete + continuous simulation loop
│   └── templates.ts    # Starter architectures
├── store/
│   └── useStore.ts     # Zustand store
├── types/
│   └── index.ts        # Shared types & defaults
├── App.tsx
└── main.tsx
```

## Extending

New component types can be added by:

1. Extending `ComponentType` and `DEFAULT_CONFIGS` / `COMPONENT_META` in `types/index.ts`
2. Adding geometry in `ComponentMesh.tsx`
3. Adding behavior rules in `simulation/engine.ts`

The simulation engine is intentionally kept readable so students can inspect and modify the model.

## Roadmap ideas

- Message-queue async fan-out
- Proper multi-region / latency injection
- Cost model + “reasonable cost” challenges
- Scenario mode with pass/fail criteria
- Shareable architecture URLs (serialize to query / short link)
- Replay & comparison of two runs

## License

MIT
