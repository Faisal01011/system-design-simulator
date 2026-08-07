import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
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
      <fog attach="fog" args={['#07101c', 24, 62]} />

      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#9fdcff', '#111827', 0.55]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={55}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <pointLight position={[-8, 8, -6]} intensity={20} distance={30} color="#38bdf8" />
      <pointLight position={[9, 5, 5]} intensity={10} distance={24} color="#a78bfa" />

      <Environment preset="city" background={false} environmentIntensity={0.65} />

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
        position={[0, -0.035, 0]}
        opacity={0.62}
        scale={46}
        blur={2.8}
        far={10}
      />

      <SimulationLoop />

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
        dpr={[1, 1.75]}
        camera={{ position: [0, 12, 16], fov: 45, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#07101c');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
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
            maxPolarAngle={Math.PI / 2.08}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
