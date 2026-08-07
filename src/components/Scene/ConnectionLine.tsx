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
    mid.y += 0.45;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from?.position[0], from?.position[2], to?.position[0], to?.position[2]]);

  const geometry = useMemo(() => {
    if (!curve) return null;
    const pts = curve.getPoints(32);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [curve]);

  if (!from || !to || !geometry) return null;

  // Traffic-weighted appearance
  // 0 traffic → thin gray; high traffic → thicker + brighter cyan
  const intensity = Math.min(1, traffic / 12);
  const opacity = 0.35 + intensity * 0.55;
  const color = intensity > 0.15 ? '#38bdf8' : '#475569';

  // Approximate thickness via a second slightly offset line is hard with <line>.
  // We use color + opacity as the main signal and a subtle second pass for busy edges.
  return (
    <group>
      <line>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </line>
      {intensity > 0.25 && (
        <line>
          <primitive object={geometry.clone()} attach="geometry" />
          <lineBasicMaterial
            color="#7dd3fc"
            transparent
            opacity={intensity * 0.35}
          />
        </line>
      )}
    </group>
  );
}

function particleColor(kind: RequestKind, isError: boolean): string {
  if (isError) return REQUEST_KIND_COLORS.error;
  return REQUEST_KIND_COLORS[kind] ?? REQUEST_KIND_COLORS.normal;
}

/**
 * Request particles with kind-based coloring + short latency trails.
 */
export function RequestParticles() {
  const particles = useStore((s) => s.particles);
  const components = useStore((s) => s.components);

  const posMap = useMemo(() => {
    const m = new Map<string, THREE.Vector3>();
    components.forEach((c) => m.set(c.id, new THREE.Vector3(...c.position)));
    return m;
  }, [components]);

  return (
    <group>
      {particles.map((p) => {
        const start = posMap.get(p.fromId);
        const end = posMap.get(p.toId);
        if (!start || !end) return null;

        const mid = start.clone().lerp(end, 0.5);
        mid.y += 0.45;

        const t = p.progress;
        const pos = new THREE.Vector3()
          .addScaledVector(start, (1 - t) * (1 - t))
          .addScaledVector(mid, 2 * (1 - t) * t)
          .addScaledVector(end, t * t);

        const color = particleColor(p.kind, p.isError);
        const size = p.kind === 'error' ? 0.11 : p.kind === 'cacheMiss' ? 0.095 : 0.08;

        return (
          <group key={p.id}>
            {/* Main particle */}
            <mesh position={pos}>
              <sphereGeometry args={[size, 6, 6]} />
              <meshBasicMaterial color={color} transparent opacity={0.95} />
            </mesh>

            {/* Latency trail – fading spheres along recent path */}
            {(p.trail ?? []).map((pt, i, arr) => {
              const age = (i + 1) / (arr.length + 1);
              return (
                <mesh key={i} position={pt}>
                  <sphereGeometry args={[size * 0.55 * age, 4, 4]} />
                  <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.25 * age}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

/**
 * Visual queue stacks that appear next to overloaded components.
 */
export function QueueStacks() {
  const components = useStore((s) => s.components);

  return (
    <group>
      {components.map((c) => {
        if (c.queueLength < 1 && c.utilization < 0.7) return null;

        const count = Math.min(8, Math.ceil(c.queueLength + c.utilization * 3));
        const baseY = 0.9;

        return (
          <group key={`q-${c.id}`} position={c.position}>
            {Array.from({ length: count }).map((_, i) => (
              <mesh
                key={i}
                position={[0.85, baseY + i * 0.14, 0]}
              >
                <boxGeometry args={[0.12, 0.1, 0.12]} />
                <meshBasicMaterial
                  color={c.utilization > 0.85 ? '#f87171' : '#fbbf24'}
                  transparent
                  opacity={0.75 - i * 0.06}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
