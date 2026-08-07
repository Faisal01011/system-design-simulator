import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { ComponentMesh } from './ComponentMesh';
import { ConnectionLine, RequestParticles } from './ConnectionLine';
import { GridPlane } from './GridPlane';
import { runSimulationStep, resetEngine } from '../../simulation/engine';

function SimulationLoop() {
  const last = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const dt = Math.min((now - last.current) / 1000, 0.05); // clamp
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
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-6, 6, -4]} intensity={0.4} color="#38bdf8" />

      <GridPlane />

      {connections.map((c) => (
        <ConnectionLine key={c.id} connection={c} components={components} />
      ))}

      {components.map((c) => (
        <ComponentMesh key={c.id} component={c} />
      ))}

      <RequestParticles />

      <ContactShadows
        position={[0, -0.03, 0]}
        opacity={0.45}
        scale={40}
        blur={2.2}
        far={8}
      />

      <SimulationLoop />

      {/* Click empty space to deselect */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        onClick={() => selectComponent(null)}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
}

export function Canvas3D() {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [0, 12, 16], fov: 45, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0e17');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={4}
            maxDistance={45}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
