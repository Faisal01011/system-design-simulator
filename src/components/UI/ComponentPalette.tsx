import {
  Users,
  GitBranch,
  Server,
  Zap,
  Database,
  MessagesSquare,
  Globe,
  Shield,
  Plus,
} from 'lucide-react';
import { ComponentType, COMPONENT_META } from '../../types';
import { useStore } from '../../store/useStore';

const ICONS: Record<ComponentType, React.ReactNode> = {
  client: <Users size={16} />,
  loadBalancer: <GitBranch size={16} />,
  server: <Server size={16} />,
  cache: <Zap size={16} />,
  database: <Database size={16} />,
  messageQueue: <MessagesSquare size={16} />,
  cdn: <Globe size={16} />,
  apiGateway: <Shield size={16} />,
};

const ORDER: ComponentType[] = [
  'client',
  'apiGateway',
  'loadBalancer',
  'server',
  'cache',
  'database',
  'messageQueue',
  'cdn',
];

export function ComponentPalette() {
  const addComponent = useStore((s) => s.addComponent);
  const components = useStore((s) => s.components);

  const handleAdd = (type: ComponentType) => {
    // Place near origin with slight offset based on existing count
    const offset = components.length * 0.4;
    const x = (Math.random() - 0.5) * 4 + offset * 0.3;
    const z = (Math.random() - 0.5) * 4;
    addComponent(type, [x, 0, z]);
  };

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-1 mb-2">
        Components
      </div>
      {ORDER.map((type) => {
        const meta = COMPONENT_META[type];
        return (
          <button
            key={type}
            onClick={() => handleAdd(type)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all hover:bg-white/5 group border border-transparent hover:border-white/10"
            title={meta.description}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: meta.color + '22', color: meta.color }}
            >
              {ICONS[type]}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                {meta.label}
              </div>
            </div>
            <Plus size={14} className="ml-auto text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition" />
          </button>
        );
      })}
    </div>
  );
}
