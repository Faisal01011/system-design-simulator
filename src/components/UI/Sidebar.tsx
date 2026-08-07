import { ComponentPalette } from './ComponentPalette';
import { MetricsPanel } from './MetricsPanel';
import { Inspector } from './Inspector';
import { TEMPLATES } from '../../simulation/templates';
import { useStore } from '../../store/useStore';
import { BookOpen, Download, Trash2 } from 'lucide-react';

export function Sidebar() {
  const loadTemplate = useStore((s) => s.loadTemplate);
  const clearScene = useStore((s) => s.clearScene);
  const exportArchitecture = useStore((s) => s.exportArchitecture);
  const activeTemplate = useStore((s) => s.activeTemplate);

  const handleExport = () => {
    const json = exportArchitecture();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architecture.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-72 flex flex-col h-full bg-surface-800/95 backdrop-blur-xl border-r border-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">
              System Design
            </div>
            <div className="text-[10px] text-slate-500">3D Simulator</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-5">
        {/* Templates */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-1 mb-2">
            Starter Templates
          </div>
          <div className="space-y-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  t.load();
                  loadTemplate(t.id);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition border ${
                  activeTemplate === t.id
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-200'
                    : 'border-transparent hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="font-medium">{t.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                  {t.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/5" />

        <ComponentPalette />

        <div className="h-px bg-white/5" />

        <MetricsPanel />

        <div className="h-px bg-white/5" />

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-1 mb-2">
            Inspector
          </div>
          <Inspector />
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-3 py-2.5 border-t border-white/5 flex gap-2 shrink-0">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
        >
          <Download size={12} /> Export JSON
        </button>
        <button
          onClick={clearScene}
          className="flex items-center justify-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
          title="Clear scene"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </aside>
  );
}
