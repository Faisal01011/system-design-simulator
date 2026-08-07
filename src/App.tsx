import { useEffect } from 'react';
import { Canvas3D } from './components/Scene/Canvas3D';
import { Sidebar } from './components/UI/Sidebar';
import { Controls } from './components/UI/Controls';
import { useStore } from './store/useStore';
import { TEMPLATES } from './simulation/templates';
import { HelpCircle, X } from 'lucide-react';

function HelpOverlay() {
  const showHelp = useStore((s) => s.showHelp);
  const setShow = (v: boolean) => useStore.setState({ showHelp: v });

  if (!showHelp) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-800 border border-white/10 rounded-2xl max-w-lg w-full mx-4 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Welcome to the System Design Simulator</h2>
            <p className="text-sm text-slate-400 mt-1">A flight simulator for distributed architectures</p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-sky-300">1. Load a template</strong> or start from a blank canvas.
            Click components in the left palette to place them on the 3D grid.
          </p>
          <p>
            <strong className="text-sky-300">2. Wire them up</strong> — select a component, click
            "Connect", then click the target. Requests will flow as blue particles.
          </p>
          <p>
            <strong className="text-sky-300">3. Start the simulation</strong> and crank the RPS slider.
            Watch utilization bars, latency percentiles, and bottlenecks appear in real time.
          </p>
          <p>
            <strong className="text-sky-300">4. Scale & experiment</strong> — add more servers, raise
            cache hit rate, change load-balancing algorithm, inject failures. Observe the difference.
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              TEMPLATES.find((t) => t.id === 'classic-3tier')?.load();
              useStore.getState().loadTemplate('classic-3tier');
              setShow(false);
            }}
            className="flex-1 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition"
          >
            Load Classic 3-Tier
          </button>
          <button
            onClick={() => setShow(false)}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition"
          >
            Start Blank
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Load a sensible default on first visit
  useEffect(() => {
    // nothing auto-loaded; help overlay guides the user
  }, []);

  return (
    <div className="relative w-full h-full flex no-select">
      <Sidebar />

      <main className="relative flex-1 overflow-hidden">
        <Canvas3D />

        {/* Top-right controls */}
        <div className="absolute top-4 right-4 z-10">
          <Controls />
        </div>

        {/* Help button */}
        <button
          onClick={() => useStore.setState({ showHelp: true })}
          className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-surface-800/90 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-700 transition"
          title="Help"
        >
          <HelpCircle size={16} />
        </button>

        {/* Status badge */}
        <div className="absolute bottom-4 left-4 z-10 text-[10px] font-mono text-slate-600">
          System Design Simulator · Three.js + React
        </div>
      </main>

      <HelpOverlay />
    </div>
  );
}
