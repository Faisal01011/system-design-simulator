import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { ComponentMesh } from './ComponentMesh';
import { ConnectionLine, RequestParticles, QueueStacks } from './ConnectionLine';
import { GridPlane } from './GridPlane';
import { runSimulationStep } from '../../simulation/engine';

function SimulationLoop() {
  const last = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const dt = Math.min((now - last.current) / 1000, 0.05);
    last.current = now;
    runSimulationStep(dt);
  });

  return null;
}

function SceneContent() {
  const components = useStore((s) => s.components);
  const connections = useStore((s) => s.connections);
  const selectComponent = useStore((s) => s.selectComponent);

  return (
    <>
      <color attach="background" args={['#07111d']} />
      <fog attach="fog" args={['#07111d', 26, 66]} />

      <ambientLight intensity={0.68} />
      <hemisphereLight args={['#c8eeff', '#0b1220', 1.15]} />
      <directionalLight
        position={[10, 14, 10]}
        intensity={2.45}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={55}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <directionalLight position={[-10, 8, -8]} intensity={1.05} color="#7dd3fc" />
      <pointLight position={[-7, 7, -5]} intensity={12} distance={26} color="#22d3ee" />
      <pointLight position={[8, 5, 6]} intensity={8} distance={22} color="#a78bfa" />

      <GridPlane />

      {connections.map((c) => (
        <ConnectionLine key={c.id} connection={c} components={components} />
      ))}

      {components.map((c) => (
        <ComponentMesh key={c.id} component={c} />
      ))}

      <RequestParticles />
      <QueueStacks />

      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.42}
        scale={32}
        blur={2.5}
        far={8}
      />

      <SimulationLoop />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.07, 0]}
        onClick={() => selectComponent(null)}
      >
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
}

export function Canvas3D() {
  return (
    <div className="absolute inset-0 bg-[#07111d]">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 7.4, 11.5], fov: 40, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#07111d');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.18;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <SceneContent />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={24}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0.6, 0]}
        />
      </Canvas>
    </div>
  );
}
