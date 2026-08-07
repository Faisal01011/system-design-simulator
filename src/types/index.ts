export type ComponentType =
  | 'client'
  | 'loadBalancer'
  | 'server'
  | 'cache'
  | 'database'
  | 'messageQueue'
  | 'cdn'
  | 'apiGateway';

export type LoadBalancingAlgorithm = 'roundRobin' | 'leastConnections' | 'random';

export type RequestKind = 'normal' | 'cacheHit' | 'cacheMiss' | 'error';

export interface ComponentConfig {
  // Common
  capacity: number;          // concurrent requests it can handle
  processingLatencyMs: number; // base processing time
  failureRate: number;       // 0-1 probability of failure

  // Load Balancer specific
  algorithm?: LoadBalancingAlgorithm;

  // Cache specific
  hitRate?: number;          // 0-1
  ttlMs?: number;

  // Database specific
  readLatencyMs?: number;
  writeLatencyMs?: number;
  connectionLimit?: number;

  // Client specific
  rps?: number;              // optional per-client override; otherwise global RPS is used
}

export interface SystemComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: [number, number, number];
  config: ComponentConfig;
  // Runtime state
  queueLength: number;
  activeRequests: number;
  utilization: number;       // 0-1
  totalProcessed: number;
  totalErrors: number;
  avgLatencyMs: number;
  isHealthy: boolean;
  lastLatencySamples: number[];
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  fromPort?: string;
  toPort?: string;
  /** Live traffic estimate (particles currently on this edge) */
  traffic?: number;
}

export interface RequestParticle {
  id: string;
  fromId: string;
  toId: string;
  progress: number;          // 0 → 1 along the edge
  startTime: number;
  latencyMs: number;
  isError: boolean;
  kind: RequestKind;
  path: string[];            // component ids in path (for multi-hop)
  currentHop: number;
  /** Recent world positions for latency trail rendering */
  trail: [number, number, number][];
}

export interface GlobalMetrics {
  currentRps: number;
  throughput: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  totalRequests: number;
  totalErrors: number;
  cacheHitRate: number;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  speed: number;             // simulation speed multiplier
  globalRps: number;         // target RPS from traffic generators
  tick: number;
  startTime: number;
}

export const DEFAULT_CONFIGS: Record<ComponentType, ComponentConfig> = {
  client: {
    capacity: 1000,
    processingLatencyMs: 0,
    failureRate: 0,
  },
  loadBalancer: {
    capacity: 5000,
    processingLatencyMs: 2,
    failureRate: 0.001,
    algorithm: 'roundRobin',
  },
  server: {
    capacity: 100,
    processingLatencyMs: 45,
    failureRate: 0.01,
  },
  cache: {
    capacity: 2000,
    processingLatencyMs: 3,
    failureRate: 0.001,
    hitRate: 0.85,
    ttlMs: 60000,
  },
  database: {
    capacity: 80,
    processingLatencyMs: 25,
    failureRate: 0.005,
    readLatencyMs: 15,
    writeLatencyMs: 40,
    connectionLimit: 100,
  },
  messageQueue: {
    capacity: 10000,
    processingLatencyMs: 5,
    failureRate: 0.002,
  },
  cdn: {
    capacity: 10000,
    processingLatencyMs: 8,
    failureRate: 0.001,
    hitRate: 0.92,
  },
  apiGateway: {
    capacity: 3000,
    processingLatencyMs: 5,
    failureRate: 0.002,
  },
};

export const COMPONENT_META: Record<
  ComponentType,
  { label: string; description: string; color: string; icon: string }
> = {
  client: {
    label: 'Client / Traffic',
    description: 'Generates API traffic at a configurable RPS. Simulates users or upstream services.',
    color: '#38bdf8',
    icon: 'Users',
  },
  loadBalancer: {
    label: 'Load Balancer',
    description: 'Distributes incoming requests across backend servers. Supports Round-Robin, Least-Connections, and Random.',
    color: '#a78bfa',
    icon: 'GitBranch',
  },
  server: {
    label: 'App Server',
    description: 'Processes business logic. Limited concurrent capacity and base latency. Horizontal scale by adding more.',
    color: '#34d399',
    icon: 'Server',
  },
  cache: {
    label: 'Cache',
    description: 'In-memory or distributed cache. High hit rate = dramatic latency reduction. Models cache-aside pattern.',
    color: '#fbbf24',
    icon: 'Zap',
  },
  database: {
    label: 'Database',
    description: 'Persistent storage. Higher latency and stricter connection limits. Bottleneck under heavy write load.',
    color: '#f87171',
    icon: 'Database',
  },
  messageQueue: {
    label: 'Message Queue',
    description: 'Decouples producers and consumers. Absorbs traffic spikes and enables async processing.',
    color: '#fb923c',
    icon: 'MessagesSquare',
  },
  cdn: {
    label: 'CDN',
    description: 'Edge cache for static or cacheable content. Extremely high capacity and low latency.',
    color: '#22d3ee',
    icon: 'Globe',
  },
  apiGateway: {
    label: 'API Gateway',
    description: 'Entry point for clients. Handles auth, rate limiting, routing, and protocol translation.',
    color: '#e879f9',
    icon: 'Shield',
  },
};

/** Colors used for different request kinds in the 3D view */
export const REQUEST_KIND_COLORS: Record<RequestKind, string> = {
  normal: '#38bdf8',
  cacheHit: '#22d3ee',
  cacheMiss: '#fb923c',
  error: '#f87171',
};
