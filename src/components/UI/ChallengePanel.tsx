import { useMemo, useState } from 'react';
import { Award, CheckCircle2, CircleDollarSign, PlayCircle, ShieldCheck, Trophy, XCircle } from 'lucide-react';
import { CHALLENGES, ChallengeResult, evaluateChallenge } from '../../game/challenges';
import { TEMPLATES } from '../../simulation/templates';
import { useStore } from '../../store/useStore';

const STORAGE_KEY = 'system-design-simulator-progress-v1';

type Progress = {
  xp: number;
  bestScores: Record<string, number>;
  completed: string[];
};

function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    // Ignore malformed local data and start fresh.
  }
  return { xp: 0, bestScores: {}, completed: [] };
}

export function ChallengePanel() {
  const components = useStore((s) => s.components);
  const metrics = useStore((s) => s.metrics);
  const setGlobalRps = useStore((s) => s.setGlobalRps);
  const loadTemplate = useStore((s) => s.loadTemplate);
  const setRunning = useStore((s) => s.setRunning);
  const [challengeId, setChallengeId] = useState(CHALLENGES[0].id);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [progress, setProgress] = useState<Progress>(() => readProgress());

  const challenge = useMemo(
    () => CHALLENGES.find((item) => item.id === challengeId) ?? CHALLENGES[0],
    [challengeId]
  );

  const startChallenge = () => {
    const template = TEMPLATES.find((item) => item.id === challenge.starterTemplate);
    template?.load();
    loadTemplate(challenge.starterTemplate);
    setGlobalRps(challenge.targetRps);
    setRunning(false);
    setResult(null);
  };

  const runTest = () => {
    if (metrics.totalRequests === 0) {
      setResult({
        score: 0,
        cost: 0,
        passed: false,
        checks: [],
        feedback: ['Start the simulation and let traffic run before evaluating the design.'],
      });
      return;
    }

    const next = evaluateChallenge(challenge, components, metrics);
    setResult(next);

    const previousBest = progress.bestScores[challenge.id] ?? 0;
    const firstPass = next.passed && !progress.completed.includes(challenge.id);
    const updated: Progress = {
      xp: progress.xp + (firstPass ? challenge.xp : 0),
      bestScores: {
        ...progress.bestScores,
        [challenge.id]: Math.max(previousBest, next.score),
      },
      completed: firstPass ? [...progress.completed, challenge.id] : progress.completed,
    };
    setProgress(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 bg-surface-800/95 backdrop-blur-xl shadow-xl">
      <div className="p-4 border-b border-white/5 sticky top-0 z-10 bg-surface-800/95 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-violet-300 font-semibold">Learning Game</div>
            <div className="text-base font-semibold text-white mt-1">Architecture Challenges</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-amber-300 shrink-0">
            <Trophy size={14} />
            <span className="text-xs font-mono">{progress.xp} XP</span>
          </div>
        </div>

        <select
          value={challengeId}
          onChange={(event) => {
            setChallengeId(event.target.value);
            setResult(null);
          }}
          className="mt-4 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-xs text-white outline-none"
        >
          {CHALLENGES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.difficulty} · {item.title}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">{challenge.title}</h3>
            <span className="text-[10px] rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-violet-300 shrink-0">
              +{challenge.xp} XP
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{challenge.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg bg-surface-900/80 p-2.5">
            <div className="text-slate-500">Traffic</div>
            <div className="font-mono text-sky-300 mt-1">{challenge.targetRps} RPS</div>
          </div>
          <div className="rounded-lg bg-surface-900/80 p-2.5">
            <div className="text-slate-500">p95 target</div>
            <div className="font-mono text-amber-300 mt-1">≤ {challenge.maxP95Ms} ms</div>
          </div>
          <div className="rounded-lg bg-surface-900/80 p-2.5">
            <div className="text-slate-500">Max errors</div>
            <div className="font-mono text-rose-300 mt-1">≤ {(challenge.maxErrorRate * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded-lg bg-surface-900/80 p-2.5">
            <div className="text-slate-500">Budget</div>
            <div className="font-mono text-emerald-300 mt-1">${challenge.budget.toLocaleString()}/mo</div>
          </div>
        </div>

        <div className="rounded-xl border border-sky-400/15 bg-sky-500/5 p-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-sky-300 font-semibold">
            <ShieldCheck size={13} /> Concept
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{challenge.lesson}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={startChallenge}
            className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400"
          >
            Load Challenge
          </button>
          <button
            onClick={runTest}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
          >
            <PlayCircle size={14} /> Run Test
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-white/10 bg-surface-900/80 p-3 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Architecture score</div>
                <div className={`text-3xl font-bold font-mono ${result.passed ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {result.score}
                  <span className="text-sm text-slate-600">/100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500">Best</div>
                <div className="text-sm font-mono text-white">{progress.bestScores[challenge.id] ?? result.score}</div>
              </div>
            </div>

            {result.checks.length > 0 && (
              <div className="space-y-1.5">
                {result.checks.map((check) => (
                  <div key={check.label} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      {check.passed ? <CheckCircle2 size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-rose-400" />}
                      {check.label}
                    </span>
                    <span className="font-mono text-slate-500 text-right">{check.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-[11px] text-slate-300">
              <CircleDollarSign size={14} className="text-emerald-400 shrink-0" />
              Estimated architecture cost: <span className="font-mono text-white">${result.cost.toLocaleString()}/mo</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                <Award size={13} /> Coach feedback
              </div>
              <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-slate-400">
                {result.feedback.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
