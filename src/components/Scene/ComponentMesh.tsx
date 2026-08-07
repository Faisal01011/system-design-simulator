import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { SystemComponent, COMPONENT_META } from '../../types';
import { useStore } from '../../store/useStore';

interface Props {
  component: SystemComponent;
}

export function ComponentMesh({ component }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const {
    selectedId,
    hoverId,
    connectingFrom,
    selectComponent,
    setHover,
    startConnecting,
    addConnection,
    cancelConnecting,
  } = useStore();

  const isSelected = selectedId === component.id;
  const isHovered = hoverId === component.id;
  const isConnecting = connectingFrom === component.id;
  const meta = COMPONENT_META[component.type];

  // Visual intensity based on utilization
  const util = component.utilization;
  const healthColor = component.isHealthy
    ? meta.color
    : '#ef4444';

  const emissiveIntensity = 0.15 + util * 0.55 + (isSelected ? 0.25 : 0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Subtle breathing / load animation
    const t = performance.now() * 0.001;
    const scalePulse = 1 + Math.sin(t * 2 + component.id.length) * 0.015 * (0.3 + util);
    groupRef.current.scale.setScalar(scalePulse);

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = emissiveIntensity + Math.sin(t * 4) * 0.05 * util;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const state = useStore.getState();

    if (state.connectingFrom) {
      if (state.connectingFrom !== component.id) {
        state.addConnection(state.connectingFrom, component.id);
      } else {
        state.cancelConnecting();
      }
    } else {
      selectComponent(component.id);
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHover(component.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHover(null);
    document.body.style.cursor = 'default';
  };

  // Different geometries per type for visual distinction
  const geometry = useMemo(() => {
    switch (component.type) {
      case 'database':
        return <cylinderGeometry args={[0.55, 0.55, 1.1, 24]} />;
      case 'cache':
        return <boxGeometry args={[1.0, 0.7, 1.0]} />;
      case 'loadBalancer':
        return <boxGeometry args={[1.3, 0.45, 0.9]} />;
      case 'client':
        return <sphereGeometry args={[0.55, 24, 16]} />;
      case 'cdn':
        return <octahedronGeometry args={[0.7, 0]} />;
      case 'messageQueue':
        return <boxGeometry args={[1.4, 0.5, 0.7]} />;
      default:
        // server / apiGateway — rack-like
        return <boxGeometry args={[0.9, 1.3, 0.7]} />;
    }
  }, [component.type]);

  return (
    <group
      ref={groupRef}
      position={component.position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Main body */}
      <mesh ref={glowRef} castShadow receiveShadow>
        {geometry}
        <meshStandardMaterial
          color={healthColor}
          emissive={healthColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.35}
          roughness={0.4}
          transparent
          opacity={component.isHealthy ? 0.95 : 0.55}
        />
      </mesh>

      {/* Selection ring */}
      {(isSelected || isHovered || isConnecting) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
          <ringGeometry args={[0.95, 1.15, 32]} />
          <meshBasicMaterial
            color={isConnecting ? '#fbbf24' : isSelected ? '#38bdf8' : '#94a3b8'}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Utilization bar (vertical) */}
      <mesh position={[0.7, -0.6 + util * 0.6, 0]}>
        <boxGeometry args={[0.08, util * 1.2, 0.08]} />
        <meshBasicMaterial
          color={util > 0.85 ? '#ef4444' : util > 0.6 ? '#fbbf24' : '#22c55e'}
        />
      </mesh>

      {/* Label */}
      <Html
        position={[0, 1.15, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap backdrop-blur-sm border ${
              isSelected
                ? 'bg-sky-500/30 border-sky-400 text-sky-100'
                : 'bg-black/60 border-white/10 text-white/90'
            }`}
          >
            {component.name}
          </div>
          {component.utilization > 0.05 && (
            <div className="mt-0.5 text-[9px] font-mono text-white/60">
              {(component.utilization * 100).toFixed(0)}% util
            </div>
          )}
        </div>
      </Html>

      {/* Connection ports (visual only) */}
      <mesh position={[0, 0, 0.55]} visible={false}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
    </group>
  );
}
