import { useStore } from '../store/useStore';
import { ComponentType } from '../types';

export interface Template {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  load: () => void;
}

function place(
  type: ComponentType,
  x: number,
  z: number,
  name?: string
) {
  const store = useStore.getState();
  store.addComponent(type, [x, 0, z]);
  if (name) {
    // Find the just-added component and rename
    const comps = useStore.getState().components;
    const last = comps[comps.length - 1];
    if (last) {
      useStore.setState({
        components: comps.map((c) =>
          c.id === last.id ? { ...c, name } : c
        ),
      });
    }
  }
  return useStore.getState().components[useStore.getState().components.length - 1].id;
}

function connect(fromId: string, toId: string) {
  useStore.getState().addConnection(fromId, toId);
}

export const TEMPLATES: Template[] = [
  {
    id: 'monolith',
    name: 'Simple Monolith',
    description: 'Client → Server → Database. Classic starting point. Watch it break under load.',
    difficulty: 'beginner',
    load: () => {
      useStore.getState().clearScene();
      const client = place('client', -6, 0, 'Users');
      const server = place('server', 0, 0, 'Monolith App');
      const db = place('database', 6, 0, 'Primary DB');
      connect(client, server);
      connect(server, db);
      useStore.getState().setGlobalRps(30);
    },
  },
  {
    id: 'classic-3tier',
    name: 'Classic 3-Tier + Cache',
    description: 'Client → LB → Servers ×2 → Cache → DB. The architecture every interview starts with.',
    difficulty: 'beginner',
    load: () => {
      useStore.getState().clearScene();
      const client = place('client', -8, 0, 'Traffic');
      const lb = place('loadBalancer', -3, 0, 'NGINX / ALB');
      const s1 = place('server', 2, -2.5, 'App Server 1');
      const s2 = place('server', 2, 2.5, 'App Server 2');
      const cache = place('cache', 6, 0, 'Redis');
      const db = place('database', 10, 0, 'Postgres');

      connect(client, lb);
      connect(lb, s1);
      connect(lb, s2);
      connect(s1, cache);
      connect(s2, cache);
      connect(cache, db);
      // Also direct path for cache miss illustration
      connect(s1, db);
      connect(s2, db);

      useStore.getState().setGlobalRps(80);
    },
  },
  {
    id: 'high-traffic',
    name: 'High-Traffic API',
    description: 'CDN + API Gateway + multiple servers + cache + DB. Designed for 1k+ RPS experiments.',
    difficulty: 'intermediate',
    load: () => {
      useStore.getState().clearScene();
      const client = place('client', -10, 0, 'Global Users');
      const cdn = place('cdn', -5, 0, 'CloudFront / Fastly');
      const gw = place('apiGateway', 0, 0, 'API Gateway');
      const lb = place('loadBalancer', 4, 0, 'LB');
      const s1 = place('server', 8, -3, 'API Pod 1');
      const s2 = place('server', 8, 0, 'API Pod 2');
      const s3 = place('server', 8, 3, 'API Pod 3');
      const cache = place('cache', 12, -1.5, 'Redis Cluster');
      const db = place('database', 12, 2, 'Primary + Replica');

      connect(client, cdn);
      connect(cdn, gw);
      connect(gw, lb);
      connect(lb, s1);
      connect(lb, s2);
      connect(lb, s3);
      connect(s1, cache);
      connect(s2, cache);
      connect(s3, cache);
      connect(cache, db);
      connect(s1, db);
      connect(s2, db);
      connect(s3, db);

      useStore.getState().setGlobalRps(200);
    },
  },
  {
    id: 'empty',
    name: 'Blank Canvas',
    description: 'Start from scratch. Best way to internalize the concepts.',
    difficulty: 'beginner',
    load: () => {
      useStore.getState().clearScene();
      useStore.getState().setGlobalRps(40);
    },
  },
];
