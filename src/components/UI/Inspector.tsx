import { useStore } from '../../store/useStore';
import { COMPONENT_META, LoadBalancingAlgorithm } from '../../types';
import { Trash2, Link2, Unplug, AlertOctagon, Heart } from 'lucide-react';

export function Inspector() {
  const selectedId = useStore((s) => s.selectedId);
  const components = useStore((s) => s.components);
  const connections = useStore((s) => s.connections);
  const connectingFrom = useStore((s) => s.connectingFrom);
  const updateComponentConfig = useStore((s) => s.updateComponentConfig);
  const removeComponent = useStore((s) => s.removeComponent);
  const startConnecting = useStore((s) => s.startConnecting);
  const cancelConnecting = useStore((s) => s.cancelConnecting);
  const injectFailure = useStore((s) => s.injectFailure);
  const clearFailure = useStore((s) => s.clearFailure);
  const removeConnection = useStore((s) => s.removeConnection);

  const component = components.find((c) => c.id === selectedId);

  if (!component) {
    return (
      <div className="text-xs text-slate-500 px-1 py-4 text-center">
        Select a component to inspect and configure it.
        <br />
        <span className="text-slate-600 mt-2 block">
          Tip: Click a component, then click "Connect" and click another to wire them.
        </span>
      </div>
    );
  }

  const meta = COMPONENT_META[component.type];
  const outgoing = connections.filter((c) => c.fromId === component.id);
  const incoming = connections.filter((c) => c.toId === component.id);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div
            className="text-sm font-semibold"
            style={{ color: meta.color }}
          >
            {component.name}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{meta.label}</div>
        </div>
        <div className="flex gap-1">
          {component.isHealthy ? (
            <button
              onClick={() => injectFailure(component.id)}
              className="p-1.5 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
              title="Inject failure"
            >
              <AlertOctagon size={14} />
            </button>
          ) : (
            <button
              onClick={() => clearFailure(component.id)}
              className="p-1.5 rounded hover:bg-emerald-500/20 text-rose-400 hover:text-emerald-400 transition"
              title="Restore health"
            >
              <Heart size={14} />
            </button>
          )}
          <button
            onClick={() => removeComponent(component.id)}
            className="p-1.5 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
            title="Delete component"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">{meta.description}</p>

      {/* Runtime stats */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-surface-900/80 rounded px-2 py-1.5">
          <div className="text-slate-500">Utilization</div>
          <div className="font-mono text-white">
            {(component.utilization * 100).toFixed(0)}%
          </div>
        </div>
        <div className="bg-surface-900/80 rounded px-2 py-1.5">
          <div className="text-slate-500">Active</div>
          <div className="font-mono text-white">{component.activeRequests.toFixed(0)}</div>
        </div>
        <div className="bg-surface-900/80 rounded px-2 py-1.5">
          <div className="text-slate-500">Processed</div>
          <div className="font-mono text-white">{component.totalProcessed}</div>
        </div>
        <div className="bg-surface-900/80 rounded px-2 py-1.5">
          <div className="text-slate-500">Avg Latency</div>
          <div className="font-mono text-white">
            {component.avgLatencyMs.toFixed(0)} ms
          </div>
        </div>
      </div>

      {/* Config controls */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          Configuration
        </div>

        <label className="block">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">Capacity</span>
            <span className="font-mono text-slate-300">{component.config.capacity}</span>
          </div>
          <input
            type="range"
            min={10}
            max={5000}
            step={10}
            value={component.config.capacity}
            onChange={(e) =>
              updateComponentConfig(component.id, { capacity: Number(e.target.value) })
            }
            className="w-full h-1 accent-sky-400"
          />
        </label>

        <label className="block">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">Processing Latency</span>
            <span className="font-mono text-slate-300">
              {component.config.processingLatencyMs} ms
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={200}
            step={1}
            value={component.config.processingLatencyMs}
            onChange={(e) =>
              updateComponentConfig(component.id, {
                processingLatencyMs: Number(e.target.value),
              })
            }
            className="w-full h-1 accent-sky-400"
          />
        </label>

        {component.type === 'cache' && (
          <label className="block">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Hit Rate</span>
              <span className="font-mono text-slate-300">
                {((component.config.hitRate ?? 0.8) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={component.config.hitRate ?? 0.8}
              onChange={(e) =>
                updateComponentConfig(component.id, { hitRate: Number(e.target.value) })
              }
              className="w-full h-1 accent-amber-400"
            />
          </label>
        )}

        {component.type === 'loadBalancer' && (
          <label className="block">
            <div className="text-[11px] text-slate-400 mb-1">Algorithm</div>
            <select
              value={component.config.algorithm ?? 'roundRobin'}
              onChange={(e) =>
                updateComponentConfig(component.id, {
                  algorithm: e.target.value as LoadBalancingAlgorithm,
                })
              }
              className="w-full bg-surface-900 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
            >
              <option value="roundRobin">Round Robin</option>
              <option value="leastConnections">Least Connections</option>
              <option value="random">Random</option>
            </select>
          </label>
        )}

        {component.type === 'client' && (
          <label className="block">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Client RPS override</span>
              <span className="font-mono text-slate-300">
                {component.config.rps ?? '—'}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={500}
              step={1}
              value={component.config.rps ?? 50}
              onChange={(e) =>
                updateComponentConfig(component.id, { rps: Number(e.target.value) })
              }
              className="w-full h-1 accent-sky-400"
            />
          </label>
        )}
      </div>

      {/* Connections */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Connections
          </div>
          {connectingFrom === component.id ? (
            <button
              onClick={cancelConnecting}
              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <Unplug size={12} /> Cancel
            </button>
          ) : (
            <button
              onClick={() => startConnecting(component.id)}
              className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <Link2 size={12} /> Connect
            </button>
          )}
        </div>

        {outgoing.length === 0 && incoming.length === 0 && (
          <div className="text-[11px] text-slate-600">No connections yet</div>
        )}

        {outgoing.map((c) => {
          const target = components.find((x) => x.id === c.toId);
          return (
            <div
              key={c.id}
              className="flex items-center justify-between text-[11px] bg-surface-900/60 rounded px-2 py-1"
            >
              <span className="text-slate-400">
                → {target?.name ?? c.toId}
              </span>
              <button
                onClick={() => removeConnection(c.id)}
                className="text-slate-600 hover:text-rose-400"
              >
                ×
              </button>
            </div>
          );
        })}
        {incoming.map((c) => {
          const source = components.find((x) => x.id === c.fromId);
          return (
            <div
              key={c.id}
              className="flex items-center justify-between text-[11px] bg-surface-900/60 rounded px-2 py-1"
            >
              <span className="text-slate-400">
                ← {source?.name ?? c.fromId}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
