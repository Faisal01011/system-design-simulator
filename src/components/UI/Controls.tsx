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

  const isPlaying = simulation.isRunning && !simulation.isPaused;

  return (
    <div className="flex max-w-full flex-col items-end gap-2">
      <div className="flex max-w-full flex-wrap items-center justify-end gap-2 rounded-xl border border-white/10 bg-surface-800/92 px-3 py-2 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
            }`}
            title={isPlaying ? 'Pause' : 'Start simulation'}
          >
            {isPlaying ? (
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
        </div>

        <div className="hidden sm:block w-px h-6 bg-white/10" />

        <div className="flex min-w-[190px] flex-1 items-center gap-2 sm:flex-none sm:w-[230px]">
          <Zap size={14} className="text-amber-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={2000}
            step={1}
            value={simulation.globalRps}
            onChange={(e) => setGlobalRps(Number(e.target.value))}
            className="min-w-0 flex-1 h-1.5 accent-amber-400 cursor-pointer"
          />
          <span className="text-xs font-mono text-amber-300 w-12 text-right tabular-nums">
            {simulation.globalRps}
          </span>
          <span className="text-[10px] text-slate-500">RPS</span>
        </div>

        <div className="hidden md:block w-px h-6 bg-white/10" />

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

      <div className="hidden sm:flex items-center gap-3 bg-surface-800/80 backdrop-blur-md border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400" /> Normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" /> Cache hit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" /> Cache miss
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" /> Error
        </span>
      </div>
    </div>
  );
}
