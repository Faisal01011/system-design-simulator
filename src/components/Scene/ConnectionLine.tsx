import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Connection, SystemComponent } from '../../types';
import { useStore } from '../../store/useStore';

interface Props {
  connection: Connection;
  components: SystemComponent[];
}

export function ConnectionLine({ connection, components }: Props) {
  const from = components.find((c) => c.id === connection.fromId);
  const to = components.find((c) => c.id === connection.toId);

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

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color="#475569" transparent opacity={0.65} />
    </line>
  );
}

/**
 * Simple particle rendering for in-flight requests.
 * Capped in the engine for performance.
 */
export function RequestParticles() {
  const particles = useStore((s) => s.particles);
  const components = useStore((s) => s.components);

  // Pre-build a lookup for speed
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

        return (
          <mesh key={p.id} position={pos}>
            <sphereGeometry args={[0.085, 6, 6]} />
            <meshBasicMaterial
              color={p.isError ? '#f87171' : '#38bdf8'}
              transparent
              opacity={0.92}
            />
          </mesh>
        );
      })}
    </group>
  );
}
