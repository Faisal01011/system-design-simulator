import { useMemo } from 'react';
import * as THREE from 'three';
import { Connection, SystemComponent, REQUEST_KIND_COLORS, RequestKind } from '../../types';
import { useStore } from '../../store/useStore';

interface Props {
  connection: Connection;
  components: SystemComponent[];
}

export function ConnectionLine({ connection, components }: Props) {
  const from = components.find((c) => c.id === connection.fromId);
  const to = components.find((c) => c.id === connection.toId);
  const traffic = connection.traffic ?? 0;

  const geometry = useMemo(() => {
    if (!from || !to) return null;
    const start = new THREE.Vector3(...from.position);
    const end = new THREE.Vector3(...to.position);
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 0.62;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
  }, [from?.position[0], from?.position[1], from?.position[2], to?.position[0], to?.position[1], to?.position[2]]);

  if (!from || !to || !geometry) return null;

  const intensity = Math.min(1, traffic / 10);
  const opacity = 0.55 + intensity * 0.35;
  const color = intensity > 0.12 ? '#0284c7' : '#64748b';

  return (
    <line renderOrder={1}>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </line>
  );
}

function particleColor(kind: RequestKind, isError: boolean): string {
  if (isError) return REQUEST_KIND_COLORS.error;
  return REQUEST_KIND_COLORS[kind] ?? REQUEST_KIND_COLORS.normal;
}

export function RequestParticles() {
  const particles = useStore((s) => s.particles);
  const components = useStore((s) => s.components);

  const posMap = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    components.forEach((c) => map.set(c.id, new THREE.Vector3(...c.position)));
    return map;
  }, [components]);

  const visibleParticles = useMemo(() => {
    const maxVisible = 90;
    if (particles.length <= maxVisible) return particles;
    const step = particles.length / maxVisible;
    return Array.from({ length: maxVisible }, (_, i) => particles[Math.floor(i * step)]);
  }, [particles]);

  return (
    <group>
      {visibleParticles.map((p) => {
        const start = posMap.get(p.fromId);
        const end = posMap.get(p.toId);
        if (!start || !end) return null;

        const mid = start.clone().lerp(end, 0.5);
        mid.y += 0.62;

        const t = p.progress;
        const pos = new THREE.Vector3()
          .addScaledVector(start, (1 - t) * (1 - t))
          .addScaledVector(mid, 2 * (1 - t) * t)
          .addScaledVector(end, t * t);

        const color = particleColor(p.kind, p.isError);
        const size = p.kind === 'error' ? 0.16 : p.kind === 'cacheMiss' ? 0.145 : 0.13;

        return (
          <mesh key={p.id} position={pos} renderOrder={3}>
            <sphereGeometry args={[size, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.96} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

export function QueueStacks() {
  const components = useStore((s) => s.components);

  return (
    <group>
      {components.map((c) => {
        if (c.queueLength < 1 && c.utilization < 0.7) return null;

        const count = Math.min(6, Math.ceil(c.queueLength + c.utilization * 3));
        const baseY = 1.05;

        return (
          <group key={`q-${c.id}`} position={c.position}>
            {Array.from({ length: count }).map((_, i) => (
              <mesh key={i} position={[1.05, baseY + i * 0.16, 0]}>
                <boxGeometry args={[0.14, 0.115, 0.14]} />
                <meshBasicMaterial
                  color={c.utilization > 0.85 ? '#dc2626' : '#d97706'}
                  transparent
                  opacity={0.85 - i * 0.08}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
