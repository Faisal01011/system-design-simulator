/**
 * Discrete-event + continuous hybrid simulation engine.
 * Runs on every animation frame when simulation is active.
 *
 * Design goals:
 * - Educational clarity over perfect accuracy
 * - Visible request particles that make latency and bottlenecks obvious
 * - Realistic enough queueing, capacity limits, and cascading effects
 */

import { useStore } from '../store/useStore';
import {
  SystemComponent,
  Connection,
  RequestParticle,
  ComponentType,
  LoadBalancingAlgorithm,
} from '../types';

let lastTick = 0;
let requestIdCounter = 0;
let rrIndex: Record<string, number> = {};

const nextRequestId = () => `req_${++requestIdCounter}`;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function pickTarget(
  lb: SystemComponent,
  candidates: SystemComponent[],
  algorithm: LoadBalancingAlgorithm
): SystemComponent | null {
  const healthy = candidates.filter((c) => c.isHealthy);
  if (healthy.length === 0) return null;

  switch (algorithm) {
    case 'roundRobin': {
      const idx = rrIndex[lb.id] ?? 0;
      const chosen = healthy[idx % healthy.length];
      rrIndex[lb.id] = idx + 1;
      return chosen;
    }
    case 'leastConnections': {
      return healthy.reduce((best, cur) =>
        cur.activeRequests + cur.queueLength < best.activeRequests + best.queueLength
          ? cur
          : best
      );
    }
    case 'random':
    default:
      return healthy[Math.floor(Math.random() * healthy.length)];
  }
}

function getOutgoing(compId: string, connections: Connection[]): Connection[] {
  return connections.filter((c) => c.fromId === compId);
}

function getComponent(id: string, components: SystemComponent[]): SystemComponent | undefined {
  return components.find((c) => c.id === id);
}

/**
 * Main simulation step. Called every frame with delta time in seconds.
 */
export function runSimulationStep(dt: number) {
  const store = useStore.getState();
  const { components, connections, particles, simulation, metrics, latencySamples } = store;

  if (!simulation.isRunning || simulation.isPaused) return;

  const now = performance.now();
  const speed = simulation.speed;
  const effectiveDt = dt * speed;

  // ───────────────────────────────────────────────
  // 1. Generate new requests from Clients
  // ───────────────────────────────────────────────
  const clients = components.filter((c) => c.type === 'client' && c.isHealthy);
  const targetRps = simulation.globalRps;
  // Distribute global RPS across clients (or use their own config.rps)
  const rpsPerClient = clients.length > 0 ? targetRps / clients.length : 0;

  for (const client of clients) {
    const clientRps = client.config.rps ?? rpsPerClient;
    // Poisson-ish arrival: probability of generating a request this frame
    const expected = clientRps * effectiveDt;
    const count = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);

    for (let i = 0; i < count; i++) {
      const outs = getOutgoing(client.id, connections);
      if (outs.length === 0) continue;

      // Client usually has one primary path (to LB or Gateway)
      const edge = outs[Math.floor(Math.random() * outs.length)];
      const target = getComponent(edge.toId, components);
      if (!target || !target.isHealthy) continue;

      // Create a particle that will travel to the next hop
      const particle: RequestParticle = {
        id: nextRequestId(),
        fromId: client.id,
        toId: target.id,
        progress: 0,
        startTime: now,
        latencyMs: 0,
        isError: false,
        path: [client.id, target.id],
        currentHop: 0,
      };
      store.addParticle(particle);
    }
  }

  // ───────────────────────────────────────────────
  // 2. Advance particles & process arrivals
  // ───────────────────────────────────────────────
  const TRAVEL_SPEED = 8; // units per second on the grid
  const newParticles: RequestParticle[] = [];
  const finishedLatencies: number[] = [];
  let completed = 0;
  let errors = 0;
  let cacheHits = 0;
  let cacheAttempts = 0;

  // Working copies of component runtime state
  const runtime = new Map<string, SystemComponent>();
  components.forEach((c) => runtime.set(c.id, { ...c }));

  for (const p of particles) {
    const from = runtime.get(p.fromId);
    const to = runtime.get(p.toId);
    if (!from || !to) continue;

    // Distance-based progress
    const dx = to.position[0] - from.position[0];
    const dz = to.position[2] - from.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    const progressDelta = (TRAVEL_SPEED * effectiveDt) / dist;
    const nextProgress = p.progress + progressDelta;

    if (nextProgress < 1) {
      // Still traveling
      newParticles.push({ ...p, progress: nextProgress });
      continue;
    }

    // ── Arrived at target ──
    const arrived = { ...p, progress: 1 };

    // Check capacity / queue
    const capacity = to.config.capacity;
    const canAccept = to.activeRequests + to.queueLength < capacity * 1.5; // soft limit

    if (!to.isHealthy || !canAccept) {
      // Drop / error
      errors++;
      to.totalErrors += 1;
      // particle dies
      continue;
    }

    // Simulate processing time based on component type
    let processMs = to.config.processingLatencyMs;

    // Type-specific behavior
    if (to.type === 'cache') {
      cacheAttempts++;
      const hit = Math.random() < (to.config.hitRate ?? 0.8);
      if (hit) {
        cacheHits++;
        processMs = to.config.processingLatencyMs; // fast path
        // Cache hit → request is satisfied, no further hop needed for this simple model
        // (In a more advanced model we would still go to origin on miss)
      } else {
        // Miss → forward to next hop if any (usually DB or server)
        processMs = to.config.processingLatencyMs + 5;
      }
    } else if (to.type === 'database') {
      processMs =
        Math.random() < 0.7
          ? (to.config.readLatencyMs ?? 15)
          : (to.config.writeLatencyMs ?? 40);
    } else if (to.type === 'loadBalancer') {
      processMs = to.config.processingLatencyMs;
    }

    // Add some jitter
    processMs *= 0.85 + Math.random() * 0.3;

    // Failure injection
    if (Math.random() < to.config.failureRate) {
      errors++;
      to.totalErrors += 1;
      continue;
    }

    // Occupy the component for a short visual time
    to.activeRequests += 1;
    to.totalProcessed += 1;
    to.lastLatencySamples = [...to.lastLatencySamples.slice(-49), processMs];
    to.avgLatencyMs =
      to.lastLatencySamples.reduce((a, b) => a + b, 0) / to.lastLatencySamples.length;

    // Schedule release of the active slot (simplified: release next frames)
    // For educational purposes we just decrement after a few frames via a decay

    const totalLatencySoFar = now - arrived.startTime + processMs;

    // Decide next hop
    let nextTarget: SystemComponent | null = null;

    if (to.type === 'loadBalancer') {
      const outs = getOutgoing(to.id, connections);
      const backends = outs
        .map((e) => runtime.get(e.toId))
        .filter((c): c is SystemComponent => !!c && (c.type === 'server' || c.type === 'cache' || c.type === 'apiGateway'));

      nextTarget = pickTarget(
        to,
        backends,
        to.config.algorithm ?? 'roundRobin'
      );
    } else if (to.type === 'cache') {
      // On miss we may forward; on hit we stop (satisfied)
      const hit = Math.random() < (to.config.hitRate ?? 0.8);
      if (!hit) {
        const outs = getOutgoing(to.id, connections);
        if (outs.length > 0) {
          const edge = outs[0]; // usually to DB or origin
          nextTarget = runtime.get(edge.toId) ?? null;
        }
      }
    } else if (to.type === 'server' || to.type === 'apiGateway') {
      // Servers may talk to cache or DB
      const outs = getOutgoing(to.id, connections);
      if (outs.length > 0) {
        // Prefer cache if present, else first connection
        const cacheEdge = outs.find((e) => {
          const t = runtime.get(e.toId);
          return t?.type === 'cache';
        });
        const edge = cacheEdge ?? outs[Math.floor(Math.random() * outs.length)];
        nextTarget = runtime.get(edge.toId) ?? null;
      }
    } else if (to.type === 'cdn') {
      // CDN usually terminates or goes to origin on miss
      const hit = Math.random() < (to.config.hitRate ?? 0.9);
      if (!hit) {
        const outs = getOutgoing(to.id, connections);
        if (outs.length > 0) nextTarget = runtime.get(outs[0].toId) ?? null;
      }
    }

    // If there is a next hop, spawn a new particle
    if (nextTarget && nextTarget.isHealthy) {
      newParticles.push({
        id: nextRequestId(),
        fromId: to.id,
        toId: nextTarget.id,
        progress: 0,
        startTime: arrived.startTime, // keep original start for end-to-end latency
        latencyMs: totalLatencySoFar,
        isError: false,
        path: [...arrived.path, nextTarget.id],
        currentHop: arrived.currentHop + 1,
      });
    } else {
      // Request completed (or terminated)
      completed++;
      finishedLatencies.push(totalLatencySoFar);
    }

    // Soft release of active slot (visual only)
    setTimeout(() => {
      const st = useStore.getState();
      const comp = st.components.find((c) => c.id === to.id);
      if (comp && comp.activeRequests > 0) {
        useStore.setState({
          components: st.components.map((c) =>
            c.id === to.id
              ? { ...c, activeRequests: Math.max(0, c.activeRequests - 1) }
              : c
          ),
        });
      }
    }, Math.min(processMs * 2, 400));
  }

  // Decay activeRequests gently if they got stuck
  runtime.forEach((c) => {
    if (c.activeRequests > 0) {
      c.activeRequests = Math.max(0, c.activeRequests - effectiveDt * 2);
    }
    c.utilization = Math.min(1, (c.activeRequests + c.queueLength * 0.3) / Math.max(1, c.config.capacity));
  });

  // ───────────────────────────────────────────────
  // 3. Commit runtime state back to store
  // ───────────────────────────────────────────────
  const updatedComponents = components.map((c) => {
    const r = runtime.get(c.id);
    return r ?? c;
  });

  // Metrics
  const allSamples = [...latencySamples, ...finishedLatencies].slice(-500);
  const sorted = [...allSamples].sort((a, b) => a - b);

  const newMetrics = {
    currentRps: targetRps,
    throughput: metrics.throughput * 0.9 + completed / Math.max(effectiveDt, 0.016) * 0.1,
    p50Latency: percentile(sorted, 50),
    p95Latency: percentile(sorted, 95),
    p99Latency: percentile(sorted, 99),
    errorRate:
      metrics.totalRequests + completed + errors > 0
        ? (metrics.totalErrors + errors) / (metrics.totalRequests + completed + errors)
        : 0,
    totalRequests: metrics.totalRequests + completed + errors,
    totalErrors: metrics.totalErrors + errors,
    cacheHitRate:
      cacheAttempts > 0
        ? (metrics.cacheHitRate * 0.8 + (cacheHits / cacheAttempts) * 0.2)
        : metrics.cacheHitRate,
  };

  useStore.setState({
    particles: newParticles.slice(-300), // hard cap for performance
    components: updatedComponents,
    metrics: newMetrics,
    latencySamples: allSamples,
    simulation: {
      ...simulation,
      tick: simulation.tick + 1,
    },
  });
}

/** Reset internal engine state */
export function resetEngine() {
  lastTick = 0;
  requestIdCounter = 0;
  rrIndex = {};
}
