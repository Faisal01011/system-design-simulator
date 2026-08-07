import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Gauge,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { resetEngine } from '../../simulation/engine';

export function Controls() {
  const simulation = useStore((s) => s.simulation);
  const setRunning = useStore((s) => s.setRunning);
  const setPaused = useStore((s) => s.setPaused);
  const setGlobalRps = useStore((s) => s.setGlobalRps);
  const setSpeed = useStore((s) => s.setSpeed);
  const resetSimulation = useStore((s) => s.resetSimulation);

  const togglePlay = () => {
    if (!simulation.isRunning) {
      setRunning(true);
    } else {
      setPaused(!simulation.isPaused);
    }
  };

  const handleReset = () => {
    resetSimulation();
    resetEngine();
  };

  return (
    <div className="flex items-center gap-3 bg-surface-800/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 shadow-xl">
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
          simulation.isRunning && !simulation.isPaused
            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
        }`}
        title={simulation.isRunning && !simulation.isPaused ? 'Pause' : 'Start simulation'}
      >
        {simulation.isRunning && !simulation.isPaused ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" />
        )}
      </button>

      <button
        onClick={handleReset}
        className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
        title="Reset simulation"
      >
        <RotateCcw size={15} />
      </button>

      <div className="w-px h-6 bg-white/10" />

      {/* RPS slider */}
      <div className="flex items-center gap-2 min-w-[180px]">
        <Zap size={14} className="text-amber-400 shrink-0" />
        <input
          type="range"
          min={1}
          max={2000}
          step={1}
          value={simulation.globalRps}
          onChange={(e) => setGlobalRps(Number(e.target.value))}
          className="w-full h-1.5 accent-amber-400 cursor-pointer"
        />
        <span className="text-xs font-mono text-amber-300 w-12 text-right tabular-nums">
          {simulation.globalRps}
        </span>
        <span className="text-[10px] text-slate-500">RPS</span>
      </div>

      <div className="w-px h-6 bg-white/10" />

      {/* Speed */}
      <div className="flex items-center gap-1.5">
        <Gauge size={13} className="text-slate-500" />
        {[0.5, 1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
              simulation.speed === s
                ? 'bg-white/15 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
