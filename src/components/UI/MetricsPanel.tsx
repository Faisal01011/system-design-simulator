import { useStore } from '../../store/useStore';
import { Activity, Clock, AlertTriangle, Zap } from 'lucide-react';

function MetricCard({
  label,
  value,
  unit,
  icon,
  accent = 'sky',
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  accent?: 'sky' | 'emerald' | 'amber' | 'rose' | 'violet';
}) {
  const colors = {
    sky: 'text-sky-400 bg-sky-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
  };

  return (
    <div className="bg-surface-700/60 border border-white/5 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-6 h-6 rounded flex items-center justify-center ${colors[accent]}`}>
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold font-mono text-white tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

export function MetricsPanel() {
  const metrics = useStore((s) => s.metrics);
  const simulation = useStore((s) => s.simulation);

  const fmt = (n: number, digits = 0) =>
    n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toFixed(digits);

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-1">
        Live Metrics
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="Target RPS"
          value={fmt(simulation.globalRps)}
          icon={<Activity size={12} />}
          accent="sky"
        />
        <MetricCard
          label="Throughput"
          value={fmt(metrics.throughput, 1)}
          unit="rps"
          icon={<Zap size={12} />}
          accent="emerald"
        />
        <MetricCard
          label="p50 Latency"
          value={fmt(metrics.p50Latency, 0)}
          unit="ms"
          icon={<Clock size={12} />}
          accent="violet"
        />
        <MetricCard
          label="p95 Latency"
          value={fmt(metrics.p95Latency, 0)}
          unit="ms"
          icon={<Clock size={12} />}
          accent="amber"
        />
        <MetricCard
          label="p99 Latency"
          value={fmt(metrics.p99Latency, 0)}
          unit="ms"
          icon={<Clock size={12} />}
          accent="rose"
        />
        <MetricCard
          label="Error Rate"
          value={(metrics.errorRate * 100).toFixed(2)}
          unit="%"
          icon={<AlertTriangle size={12} />}
          accent={metrics.errorRate > 0.05 ? 'rose' : 'emerald'}
        />
      </div>

      <div className="bg-surface-700/60 border border-white/5 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Cache Hit Rate</span>
          <span className="font-mono text-amber-300">
            {(metrics.cacheHitRate * 100).toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-surface-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, metrics.cacheHitRate * 100)}%` }}
          />
        </div>
      </div>

      <div className="text-[10px] text-slate-600 font-mono px-1">
        Total reqs: {metrics.totalRequests.toLocaleString()} · Errors:{' '}
        {metrics.totalErrors.toLocaleString()}
      </div>
    </div>
  );
}
