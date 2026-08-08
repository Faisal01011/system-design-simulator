import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SystemComponent, COMPONENT_META } from '../../types';
import { useStore } from '../../store/useStore';

interface Props {
  component: SystemComponent;
}

function PhysicalBody({ component, color }: { component: SystemComponent; color: string }) {
  const failed = !component.isHealthy;
  const bodyColor = failed ? '#4a141b' : '#223247';
  const trimColor = failed ? '#ef4444' : color;
  const darkMetal = '#101923';

  const metal = (
    <meshPhysicalMaterial
      color={bodyColor}
      metalness={0.55}
      roughness={0.32}
      clearcoat={0.28}
      clearcoatRoughness={0.3}
    />
  );

  const trim = (
    <meshPhysicalMaterial
      color={trimColor}
      emissive={trimColor}
      emissiveIntensity={failed ? 1.2 : 0.72}
      metalness={0.28}
      roughness={0.22}
      clearcoat={0.7}
      clearcoatRoughness={0.16}
    />
  );

  switch (component.type) {
    case 'database':
      return (
        <group position={[0, 0.05, 0]}>
          <mesh castShadow receiveShadow><cylinderGeometry args={[0.62, 0.62, 1.05, 36]} />{metal}</mesh>
          <mesh position={[0, 0.53, 0]} castShadow><cylinderGeometry args={[0.62, 0.62, 0.09, 36]} />{trim}</mesh>
          <mesh position={[0, 0.15, 0]}><torusGeometry args={[0.49, 0.035, 10, 36]} />{trim}</mesh>
          <mesh position={[0, -0.2, 0]}><torusGeometry args={[0.49, 0.035, 10, 36]} />{trim}</mesh>
        </group>
      );
    case 'cache':
      return (
        <group position={[0, 0.05, 0]}>
          <mesh castShadow receiveShadow><boxGeometry args={[1.15, 0.72, 1.05]} />{metal}</mesh>
          <mesh position={[0, 0.37, 0]}><boxGeometry args={[0.8, 0.05, 0.74]} />{trim}</mesh>
          <mesh position={[0, 0.02, 0.54]}><boxGeometry args={[0.72, 0.12, 0.035]} />{trim}</mesh>
          {[-0.34, 0, 0.34].map((x) => (
            <mesh key={x} position={[x, -0.17, 0.54]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshBasicMaterial color={x === 0 ? '#fbbf24' : '#22c55e'} />
            </mesh>
          ))}
        </group>
      );
    case 'loadBalancer':
      return (
        <group position={[0, 0.02, 0]}>
          <mesh castShadow receiveShadow><boxGeometry args={[1.55, 0.52, 1.02]} />{metal}</mesh>
          <mesh position={[0, 0.02, 0.525]}><boxGeometry args={[1.2, 0.18, 0.035]} /><meshPhysicalMaterial color={darkMetal} metalness={0.72} roughness={0.28} /></mesh>
          {[-0.42, -0.14, 0.14, 0.42].map((x) => (
            <mesh key={x} position={[x, 0.02, 0.55]}><boxGeometry args={[0.12, 0.07, 0.025]} />{trim}</mesh>
          ))}
        </group>
      );
    case 'client':
      return (
        <group position={[0, 0.05, 0]}>
          <mesh castShadow><boxGeometry args={[1.08, 0.68, 0.12]} />{metal}</mesh>
          <mesh position={[0, 0, 0.071]}><boxGeometry args={[0.86, 0.48, 0.022]} />{trim}</mesh>
          <mesh position={[0, -0.47, 0]} castShadow><cylinderGeometry args={[0.08, 0.12, 0.35, 16]} /><meshStandardMaterial color={darkMetal} metalness={0.72} roughness={0.34} /></mesh>
          <mesh position={[0, -0.67, 0]} castShadow><boxGeometry args={[0.6, 0.08, 0.34]} /><meshStandardMaterial color={darkMetal} metalness={0.72} roughness={0.34} /></mesh>
        </group>
      );
    case 'cdn':
      return (
        <group position={[0, 0.12, 0]}>
          <mesh castShadow><icosahedronGeometry args={[0.7, 2]} />{metal}</mesh>
          <mesh><icosahedronGeometry args={[0.73, 1]} /><meshBasicMaterial color={trimColor} wireframe transparent opacity={0.9} /></mesh>
          <mesh><sphereGeometry args={[0.16, 18, 18]} />{trim}</mesh>
        </group>
      );
    case 'messageQueue':
      return (
        <group position={[0, 0.05, 0]}>
          <mesh castShadow receiveShadow><boxGeometry args={[1.5, 0.68, 0.82]} />{metal}</mesh>
          {[-0.36, 0, 0.36].map((x, i) => (
            <mesh key={x} position={[x, 0, 0.44]}>
              <boxGeometry args={[0.24, 0.24, 0.035]} />
              <meshPhysicalMaterial color={i === 1 ? trimColor : '#3f5268'} emissive={i === 1 ? trimColor : '#000000'} emissiveIntensity={i === 1 ? 0.6 : 0} metalness={0.4} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'apiGateway':
      return (
        <group position={[0, 0.08, 0]}>
          <mesh castShadow receiveShadow><boxGeometry args={[0.92, 1.36, 0.72]} />{metal}</mesh>
          <mesh position={[0, 0.1, 0.38]}><boxGeometry args={[0.56, 0.76, 0.035]} />{trim}</mesh>
          <mesh position={[0, -0.5, 0]}><boxGeometry args={[1.08, 0.1, 0.88]} /><meshStandardMaterial color={darkMetal} metalness={0.72} roughness={0.3} /></mesh>
        </group>
      );
    default:
      return (
        <group position={[0, 0.06, 0]}>
          <mesh castShadow receiveShadow><boxGeometry args={[1.02, 1.38, 0.82]} />{metal}</mesh>
          <mesh position={[0, 0.15, 0.43]}><boxGeometry args={[0.68, 0.46, 0.035]} /><meshPhysicalMaterial color={darkMetal} metalness={0.75} roughness={0.24} /></mesh>
          {[0.36, 0.12, -0.12].map((y, i) => (
            <mesh key={y} position={[0.29, y, 0.46]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color={i === 0 ? '#22c55e' : i === 1 ? '#38bdf8' : trimColor} />
            </mesh>
          ))}
          <mesh position={[0, -0.52, 0]}><boxGeometry args={[1.12, 0.09, 0.9]} /><meshStandardMaterial color={darkMetal} metalness={0.72} roughness={0.3} /></mesh>
        </group>
      );
  }
}

export function ComponentMesh({ component }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersection = useRef(new THREE.Vector3());

  const {
    selectedId,
    hoverId,
    connectingFrom,
    selectComponent,
    setHover,
    updateComponentPosition,
    components,
  } = useStore();

  const isSelected = selectedId === component.id;
  const isHovered = hoverId === component.id;
  const isConnecting = connectingFrom === component.id;
  const meta = COMPONENT_META[component.type];
  const util = component.utilization;
  const maxUtil = Math.max(...components.map((c) => c.utilization), 0);
  const isBottleneck = util >= 0.72 && util >= maxUtil - 0.02 && components.length > 1;
  const accentColor = !component.isHealthy ? '#ef4444' : isBottleneck ? '#f97316' : meta.color;

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;
    const baseScale = component.type === 'client' ? 1.15 : component.type === 'cdn' ? 1.2 : component.type === 'database' ? 1.25 : 1.35;
    const pulse = 1 + Math.sin(t * 2 + component.id.length) * 0.006 * (0.3 + util) + (isBottleneck ? Math.sin(t * 6) * 0.012 : 0);
    if (!isDragging) groupRef.current.scale.setScalar(baseScale * pulse);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const state = useStore.getState();
    if (state.connectingFrom) {
      if (state.connectingFrom !== component.id) state.addConnection(state.connectingFrom, component.id);
      else state.cancelConnecting();
    } else selectComponent(component.id);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (connectingFrom) return;
    e.stopPropagation();
    (e.target as unknown as { setPointerCapture?: (id: number) => void }).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    selectComponent(component.id);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();
    e.ray.intersectPlane(dragPlane.current, intersection.current);
    updateComponentPosition(component.id, [intersection.current.x, 0, intersection.current.z]);
  };

  return (
    <group
      ref={groupRef}
      position={component.position}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(component.id);
        document.body.style.cursor = isDragging ? 'grabbing' : 'pointer';
      }}
      onPointerOut={() => {
        setHover(null);
        if (!isDragging) document.body.style.cursor = 'default';
      }}
    >
      <PhysicalBody component={component} color={accentColor} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <circleGeometry args={[1.05, 48]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.06 + util * 0.08} />
      </mesh>

      {(isSelected || isHovered || isConnecting || isBottleneck) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.78, 0]}>
          <ringGeometry args={[1.18, 1.32, 48]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
      )}

      <mesh position={[0.94, -0.58 + util * 0.66, 0]}>
        <boxGeometry args={[0.075, Math.max(0.06, util * 1.32), 0.075]} />
        <meshBasicMaterial color={util > 0.85 ? '#ef4444' : util > 0.6 ? '#fbbf24' : '#22c55e'} />
      </mesh>

      <Html position={[0, 1.6, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div className="flex flex-col items-center gap-1 drop-shadow-xl">
          {isBottleneck && (
            <div className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide bg-orange-500/95 text-white animate-pulse shadow-lg shadow-orange-500/20">
              BOTTLENECK
            </div>
          )}
          <div className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap backdrop-blur-md border shadow-lg ${isSelected ? 'bg-sky-500/35 border-sky-300/80 text-white' : isBottleneck ? 'bg-orange-500/25 border-orange-300/70 text-white' : 'bg-slate-950/80 border-white/15 text-white'}`}>
            {component.name}
          </div>
          {component.utilization > 0.05 && (
            <div className="px-1.5 py-0.5 rounded bg-black/45 text-[9px] font-mono text-white/75">
              {(component.utilization * 100).toFixed(0)}% util
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
