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
  const lineRef = useRef<THREE.Line>(null);
  const from = components.find((c) => c.id === connection.fromId);
  const to = components.find((c) => c.id === connection.toId);

  const points = useMemo(() => {
    if (!from || !to) return [];
    const start = new THREE.Vector3(...from.position);
    const end = new THREE.Vector3(...to.position);
    // Slight arc for visual polish
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 0.4;
    return [start, mid, end];
  }, [from?.position, to?.position]);

  const curve = useMemo(() => {
    if (points.length < 3) return null;
    return new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
  }, [points]);

  useFrame(() => {
    // Optional subtle pulse on the line material
  });

  if (!from || !to || !curve) return null;

  const curvePoints = curve.getPoints(24);
  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

  return (
    <line ref={lineRef as any}>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial
        color="#475569"
        transparent
        opacity={0.7}
        linewidth={2}
      />
    </line>
  );
}

/**
 * Instanced / simple particle rendering for in-flight requests.
 */
export function RequestParticles() {
  const particles = useStore((s) => s.particles);
  const components = useStore((s) => s.components);

  return (
    <group>
      {particles.map((p) => {
        const from = components.find((c) => c.id === p.fromId);
        const to = components.find((c) => c.id === p.toId);
        if (!from || !to) return null;

        const start = new THREE.Vector3(...from.position);
        const end = new THREE.Vector3(...to.position);
        const mid = start.clone().lerp(end, 0.5);
        mid.y += 0.4;

        // Quadratic bezier interpolation
        const t = p.progress;
        const pos = new THREE.Vector3()
          .addScaledVector(start, (1 - t) * (1 - t))
          .addScaledVector(mid, 2 * (1 - t) * t)
          .addScaledVector(end, t * t);

        return (
          <mesh key={p.id} position={pos}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshBasicMaterial
              color={p.isError ? '#ef4444' : '#38bdf8'}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}
