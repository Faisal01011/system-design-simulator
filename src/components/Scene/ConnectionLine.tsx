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

  const curve = useMemo(() => {
    if (!from || !to) return null;
    const start = new THREE.Vector3(...from.position);
    const end = new THREE.Vector3(...to.position);
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 0.62;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from?.position[0], from?.position[1], from?.position[2], to?.position[0], to?.position[1], to?.position[2]]);

  const geometry = useMemo(() => {
    if (!curve) return null;
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
  }, [curve]);

  if (!from || !to || !geometry) return null;

  const intensity = Math.min(1, traffic / 10);
  const opacity = 0.52 + intensity * 0.43;
  const color = intensity > 0.12 ? '#38bdf8' : '#64748b';

  return (
    <group>
      <line renderOrder={1}>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </line>
      <line renderOrder={0}>
        <primitive object={geometry.clone()} attach="geometry" />
        <lineBasicMaterial color="#0ea5e9" transparent opacity={0.14 + intensity * 0.22} depthWrite={false} />
      </line>
    </group>
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

  return (
    <group>
      {particles.map((p) => {
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
        const size = p.kind === 'error' ? 0.17 : p.kind === 'cacheMiss' ? 0.15 : 0.135;

        return (
          <group key={p.id}>
            <pointLight position={pos} color={color} intensity={0.7} distance={1.8} />
            <mesh position={pos} renderOrder={3}>
              <sphereGeometry args={[size, 10, 10]} />
              <meshBasicMaterial color={color} transparent opacity={1} depthWrite={false} />
            </mesh>
            <mesh position={pos} scale={1.75} renderOrder={2}>
              <sphereGeometry args={[size, 8, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.14} depthWrite={false} />
            </mesh>

            {(p.trail ?? []).map((pt, i, arr) => {
              const age = (i + 1) / (arr.length + 1);
              return (
                <mesh key={i} position={pt} renderOrder={2}>
                  <sphereGeometry args={[size * 0.62 * age, 6, 6]} />
                  <meshBasicMaterial color={color} transparent opacity={0.34 * age} depthWrite={false} />
                </mesh>
              );
            })}
          </group>
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

        const count = Math.min(8, Math.ceil(c.queueLength + c.utilization * 3));
        const baseY = 1.05;

        return (
          <group key={`q-${c.id}`} position={c.position}>
            {Array.from({ length: count }).map((_, i) => (
              <mesh key={i} position={[1.05, baseY + i * 0.16, 0]}>
                <boxGeometry args={[0.14, 0.115, 0.14]} />
                <meshBasicMaterial
                  color={c.utilization > 0.85 ? '#f87171' : '#fbbf24'}
                  transparent
                  opacity={0.82 - i * 0.065}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
