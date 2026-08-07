import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  SystemComponent,
  Connection,
  RequestParticle,
  GlobalMetrics,
  SimulationState,
  ComponentType,
  ComponentConfig,
  DEFAULT_CONFIGS,
  LoadBalancingAlgorithm,
} from '../types';

interface AppState {
  // Scene
  components: SystemComponent[];
  connections: Connection[];
  selectedId: string | null;
  hoverId: string | null;

  // Simulation
  particles: RequestParticle[];
  metrics: GlobalMetrics;
  simulation: SimulationState;
  latencySamples: number[];

  // UI
  connectingFrom: string | null;
  showHelp: boolean;
  activeTemplate: string | null;

  // Actions
  addComponent: (type: ComponentType, position: [number, number, number]) => void;
  removeComponent: (id: string) => void;
  updateComponentPosition: (id: string, position: [number, number, number]) => void;
  updateComponentConfig: (id: string, config: Partial<ComponentConfig>) => void;
  selectComponent: (id: string | null) => void;
  setHover: (id: string | null) => void;

  addConnection: (fromId: string, toId: string) => void;
  removeConnection: (id: string) => void;
  startConnecting: (fromId: string) => void;
  cancelConnecting: () => void;

  // Simulation controls
  setRunning: (running: boolean) => void;
  setPaused: (paused: boolean) => void;
  setGlobalRps: (rps: number) => void;
  setSpeed: (speed: number) => void;
  resetSimulation: () => void;
  injectFailure: (id: string) => void;
  clearFailure: (id: string) => void;

  // Internal sim updates
  tickSimulation: (dt: number) => void;
  addParticle: (particle: RequestParticle) => void;
  removeParticle: (id: string) => void;
  updateMetrics: (partial: Partial<GlobalMetrics>) => void;

  // Templates & helpers
  loadTemplate: (name: string) => void;
  clearScene: () => void;
  exportArchitecture: () => string;
}

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}_${++idCounter}`;

const initialMetrics: GlobalMetrics = {
  currentRps: 0,
  throughput: 0,
  p50Latency: 0,
  p95Latency: 0,
  p99Latency: 0,
  errorRate: 0,
  totalRequests: 0,
  totalErrors: 0,
  cacheHitRate: 0,
};

const initialSim: SimulationState = {
  isRunning: false,
  isPaused: false,
  speed: 1,
  globalRps: 50,
  tick: 0,
  startTime: 0,
};

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    components: [],
    connections: [],
    selectedId: null,
    hoverId: null,
    particles: [],
    metrics: { ...initialMetrics },
    simulation: { ...initialSim },
    latencySamples: [],
    connectingFrom: null,
    showHelp: true,
    activeTemplate: null,

    addComponent: (type, position) => {
      const config = { ...DEFAULT_CONFIGS[type] };
      const meta = type;
      const count = get().components.filter((c) => c.type === type).length + 1;
      const component: SystemComponent = {
        id: nextId(type),
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`,
        position,
        config,
        queueLength: 0,
        activeRequests: 0,
        utilization: 0,
        totalProcessed: 0,
        totalErrors: 0,
        avgLatencyMs: 0,
        isHealthy: true,
        lastLatencySamples: [],
      };
      set((s) => ({ components: [...s.components, component] }));
    },

    removeComponent: (id) => {
      set((s) => ({
        components: s.components.filter((c) => c.id !== id),
        connections: s.connections.filter((c) => c.fromId !== id && c.toId !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
        particles: s.particles.filter((p) => p.fromId !== id && p.toId !== id),
      }));
    },

    updateComponentPosition: (id, position) => {
      set((s) => ({
        components: s.components.map((c) =>
          c.id === id ? { ...c, position } : c
        ),
      }));
    },

    updateComponentConfig: (id, config) => {
      set((s) => ({
        components: s.components.map((c) =>
          c.id === id ? { ...c, config: { ...c.config, ...config } } : c
        ),
      }));
    },

    selectComponent: (id) => set({ selectedId: id }),
    setHover: (id) => set({ hoverId: id }),

    addConnection: (fromId, toId) => {
      if (fromId === toId) return;
      const exists = get().connections.some(
        (c) => c.fromId === fromId && c.toId === toId
      );
      if (exists) return;
      const conn: Connection = {
        id: nextId('conn'),
        fromId,
        toId,
      };
      set((s) => ({ connections: [...s.connections, conn], connectingFrom: null }));
    },

    removeConnection: (id) => {
      set((s) => ({
        connections: s.connections.filter((c) => c.id !== id),
      }));
    },

    startConnecting: (fromId) => set({ connectingFrom: fromId }),
    cancelConnecting: () => set({ connectingFrom: null }),

    setRunning: (running) =>
      set((s) => ({
        simulation: {
          ...s.simulation,
          isRunning: running,
          isPaused: false,
          startTime: running ? performance.now() : s.simulation.startTime,
        },
      })),

    setPaused: (paused) =>
      set((s) => ({
        simulation: { ...s.simulation, isPaused: paused },
      })),

    setGlobalRps: (rps) =>
      set((s) => ({
        simulation: { ...s.simulation, globalRps: rps },
      })),

    setSpeed: (speed) =>
      set((s) => ({
        simulation: { ...s.simulation, speed },
      })),

    resetSimulation: () => {
      set((s) => ({
        particles: [],
        metrics: { ...initialMetrics },
        latencySamples: [],
        simulation: {
          ...s.simulation,
          isRunning: false,
          isPaused: false,
          tick: 0,
          startTime: 0,
        },
        components: s.components.map((c) => ({
          ...c,
          queueLength: 0,
          activeRequests: 0,
          utilization: 0,
          totalProcessed: 0,
          totalErrors: 0,
          avgLatencyMs: 0,
          isHealthy: true,
          lastLatencySamples: [],
        })),
      }));
    },

    injectFailure: (id) => {
      set((s) => ({
        components: s.components.map((c) =>
          c.id === id ? { ...c, isHealthy: false } : c
        ),
      }));
    },

    clearFailure: (id) => {
      set((s) => ({
        components: s.components.map((c) =>
          c.id === id ? { ...c, isHealthy: true } : c
        ),
      }));
    },

    tickSimulation: (dt) => {
      // Implemented in simulation engine — store just holds the data
      // The real logic lives in simulation/engine.ts and is called from the React loop
    },

    addParticle: (particle) =>
      set((s) => ({ particles: [...s.particles, particle] })),

    removeParticle: (id) =>
      set((s) => ({ particles: s.particles.filter((p) => p.id !== id) })),

    updateMetrics: (partial) =>
      set((s) => ({ metrics: { ...s.metrics, ...partial } })),

    loadTemplate: (name) => {
      // Templates defined in templates.ts and applied here
      const { clearScene } = get();
      clearScene();
      // actual loading is done by the caller after clear
      set({ activeTemplate: name });
    },

    clearScene: () => {
      set({
        components: [],
        connections: [],
        particles: [],
        selectedId: null,
        metrics: { ...initialMetrics },
        latencySamples: [],
        simulation: { ...initialSim },
        activeTemplate: null,
      });
      idCounter = 0;
    },

    exportArchitecture: () => {
      const { components, connections } = get();
      return JSON.stringify(
        {
          version: 1,
          components: components.map((c) => ({
            type: c.type,
            name: c.name,
            position: c.position,
            config: c.config,
          })),
          connections: connections.map((c) => ({
            from: c.fromId,
            to: c.toId,
          })),
        },
        null,
        2
      );
    },
  }))
);
