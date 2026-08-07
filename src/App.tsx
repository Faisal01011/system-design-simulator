import { useEffect } from 'react';
import { Canvas3D } from './components/Scene/Canvas3D';
import { Sidebar } from './components/UI/Sidebar';
import { Controls } from './components/UI/Controls';
import { ChallengePanel } from './components/UI/ChallengePanel';
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
            <h2 className="text-lg font-semibold text-white">Welcome to the System Design Learning Game</h2>
            <p className="text-sm text-slate-400 mt-1">Build, stress-test, break, diagnose, and improve distributed architectures.</p>
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
            <strong className="text-violet-300">1. Pick a challenge</strong> from the learning-game panel.
            Each challenge gives you traffic, latency, reliability, and budget targets.
          </p>
          <p>
            <strong className="text-sky-300">2. Build the architecture</strong> by placing and wiring components on the 3D grid.
          </p>
          <p>
            <strong className="text-amber-300">3. Stress-test it</strong> with the live simulation and watch utilization, latency, queues, errors, and bottlenecks.
          </p>
          <p>
            <strong className="text-emerald-300">4. Run the test</strong> to receive a score, cost estimate, coaching feedback, and XP for completed challenges.
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
            Try Sandbox
          </button>
          <button
            onClick={() => setShow(false)}
            className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm transition"
          >
            View Challenges
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Help overlay introduces both sandbox and challenge modes on first visit.
  }, []);

  return (
    <div className="relative w-full h-full flex no-select">
      <Sidebar />

      <main className="relative flex-1 overflow-hidden">
        <Canvas3D />

        <div className="absolute top-4 right-4 z-10">
          <Controls />
        </div>

        <div className="absolute top-24 right-4 z-10">
          <ChallengePanel />
        </div>

        <button
          onClick={() => useStore.setState({ showHelp: true })}
          className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-surface-800/90 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-700 transition"
          title="Help"
        >
          <HelpCircle size={16} />
        </button>

        <div className="absolute bottom-4 left-4 z-10 text-[10px] font-mono text-slate-600">
          System Design Learning Game · Three.js + React
        </div>
      </main>

      <HelpOverlay />
    </div>
  );
}
