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
  LoadBalancingAlgorithm,
  RequestKind,
} from '../types';

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

function bezierPoint(
  start: [number, number, number],
  end: [number, number, number],
  t: number
): [number, number, number] {
  const mid: [number, number, number] = [
    (start[0] + end[0]) / 2,
    0.45,
    (start[2] + end[2]) / 2,
  ];
  const omt = 1 - t;
  return [
    omt * omt * start[0] + 2 * omt * t * mid[0] + t * t * end[0],
    omt * omt * start[1] + 2 * omt * t * mid[1] + t * t * end[1],
    omt * omt * start[2] + 2 * omt * t * mid[2] + t * t * end[2],
  ];
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
  const rpsPerClient = clients.length > 0 ? targetRps / clients.length : 0;

  for (const client of clients) {
    const clientRps = client.config.rps ?? rpsPerClient;
    const expected = clientRps * effectiveDt;
    const count = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);

    for (let i = 0; i < count; i++) {
      const outs = getOutgoing(client.id, connections);
      if (outs.length === 0) continue;

      const edge = outs[Math.floor(Math.random() * outs.length)];
      const target = getComponent(edge.toId, components);
      if (!target || !target.isHealthy) continue;

      const particle: RequestParticle = {
        id: nextRequestId(),
        fromId: client.id,
        toId: target.id,
        progress: 0,
        startTime: now,
        latencyMs: 0,
        isError: false,
        kind: 'normal',
        path: [client.id, target.id],
        currentHop: 0,
        trail: [],
      };
      store.addParticle(particle);
    }
  }

  // ───────────────────────────────────────────────
  // 2. Advance particles & process arrivals
  // ───────────────────────────────────────────────
  const TRAVEL_SPEED = 8;
  const newParticles: RequestParticle[] = [];
  const finishedLatencies: number[] = [];
  let completed = 0;
  let errors = 0;
  let cacheHits = 0;
  let cacheAttempts = 0;

  // Live traffic count per connection (for edge thickness)
  const trafficCount: Record<string, number> = {};

  const runtime = new Map<string, SystemComponent>();
  components.forEach((c) => runtime.set(c.id, { ...c, queueLength: 0 }));

  for (const p of particles) {
    const from = runtime.get(p.fromId);
    const to = runtime.get(p.toId);
    if (!from || !to) continue;

    // Track traffic on this edge
    const edgeKey = `${p.fromId}->${p.toId}`;
    trafficCount[edgeKey] = (trafficCount[edgeKey] ?? 0) + 1;

    const dx = to.position[0] - from.position[0];
    const dz = to.position[2] - from.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    const progressDelta = (TRAVEL_SPEED * effectiveDt) / dist;
    const nextProgress = Math.min(1, p.progress + progressDelta);

    // Update trail (keep last 6 positions)
    const worldPos = bezierPoint(from.position, to.position, nextProgress);
    const trail = [...(p.trail ?? []), worldPos].slice(-6);

    if (nextProgress < 1) {
      newParticles.push({ ...p, progress: nextProgress, trail });
      continue;
    }

    // ── Arrived at target ──
    const arrived = { ...p, progress: 1, trail };

    const capacity = to.config.capacity;
    const canAccept = to.activeRequests + to.queueLength < capacity * 1.5;

    if (!to.isHealthy || !canAccept) {
      errors++;
      to.totalErrors += 1;
      // Spawn a short-lived error particle visual is handled by kind
      continue;
    }

    let processMs = to.config.processingLatencyMs;
    let kind: RequestKind = arrived.kind;

    if (to.type === 'cache') {
      cacheAttempts++;
      const hit = Math.random() < (to.config.hitRate ?? 0.8);
      if (hit) {
        cacheHits++;
        processMs = to.config.processingLatencyMs;
        kind = 'cacheHit';
      } else {
        processMs = to.config.processingLatencyMs + 5;
        kind = 'cacheMiss';
      }
    } else if (to.type === 'database') {
      processMs =
        Math.random() < 0.7
          ? (to.config.readLatencyMs ?? 15)
          : (to.config.writeLatencyMs ?? 40);
    } else if (to.type === 'loadBalancer') {
      processMs = to.config.processingLatencyMs;
    }

    processMs *= 0.85 + Math.random() * 0.3;

    if (Math.random() < to.config.failureRate) {
      errors++;
      to.totalErrors += 1;
      kind = 'error';
      continue;
    }

    to.activeRequests += 1;
    to.totalProcessed += 1;
    to.lastLatencySamples = [...to.lastLatencySamples.slice(-49), processMs];
    to.avgLatencyMs =
      to.lastLatencySamples.reduce((a, b) => a + b, 0) / to.lastLatencySamples.length;

    // Approximate queue length from active load
    to.queueLength = Math.max(0, to.activeRequests - to.config.capacity * 0.6);

    const totalLatencySoFar = now - arrived.startTime + processMs;

    let nextTarget: SystemComponent | null = null;

    if (to.type === 'loadBalancer') {
      const outs = getOutgoing(to.id, connections);
      const backends = outs
        .map((e) => runtime.get(e.toId))
        .filter((c): c is SystemComponent => !!c && (c.type === 'server' || c.type === 'cache' || c.type === 'apiGateway'));

      nextTarget = pickTarget(to, backends, to.config.algorithm ?? 'roundRobin');
    } else if (to.type === 'cache') {
      if (kind === 'cacheMiss') {
        const outs = getOutgoing(to.id, connections);
        if (outs.length > 0) {
          nextTarget = runtime.get(outs[0].toId) ?? null;
        }
      }
    } else if (to.type === 'server' || to.type === 'apiGateway') {
      const outs = getOutgoing(to.id, connections);
      if (outs.length > 0) {
        const cacheEdge = outs.find((e) => {
          const t = runtime.get(e.toId);
          return t?.type === 'cache';
        });
        const edge = cacheEdge ?? outs[Math.floor(Math.random() * outs.length)];
        nextTarget = runtime.get(edge.toId) ?? null;
      }
    } else if (to.type === 'cdn') {
      const hit = Math.random() < (to.config.hitRate ?? 0.9);
      if (!hit) {
        const outs = getOutgoing(to.id, connections);
        if (outs.length > 0) nextTarget = runtime.get(outs[0].toId) ?? null;
      } else {
        kind = 'cacheHit';
      }
    }

    if (nextTarget && nextTarget.isHealthy) {
      newParticles.push({
        id: nextRequestId(),
        fromId: to.id,
        toId: nextTarget.id,
        progress: 0,
        startTime: arrived.startTime,
        latencyMs: totalLatencySoFar,
        isError: false,
        kind,
        path: [...arrived.path, nextTarget.id],
        currentHop: arrived.currentHop + 1,
        trail: [to.position],
      });
    } else {
      completed++;
      finishedLatencies.push(totalLatencySoFar);
    }

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

  // Decay activeRequests + update utilization + queue
  runtime.forEach((c) => {
    if (c.activeRequests > 0) {
      c.activeRequests = Math.max(0, c.activeRequests - effectiveDt * 2);
    }
    c.utilization = Math.min(
      1,
      (c.activeRequests + c.queueLength * 0.4) / Math.max(1, c.config.capacity)
    );
  });

  const updatedComponents = components.map((c) => {
    const r = runtime.get(c.id);
    return r ?? c;
  });

  // Attach live traffic counts to connections
  const updatedConnections = connections.map((conn) => {
    const key = `${conn.fromId}->${conn.toId}`;
    return { ...conn, traffic: trafficCount[key] ?? 0 };
  });

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
        ? metrics.cacheHitRate * 0.8 + (cacheHits / cacheAttempts) * 0.2
        : metrics.cacheHitRate,
  };

  useStore.setState({
    particles: newParticles.slice(-320),
    components: updatedComponents,
    connections: updatedConnections,
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
  requestIdCounter = 0;
  rrIndex = {};
}
