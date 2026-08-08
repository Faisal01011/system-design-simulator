import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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
      <color attach="background" args={['#dbe6f0']} />
      <fog attach="fog" args={['#dbe6f0', 28, 70]} />

      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#ffffff', '#9fb0c3', 1.25]} />
      <directionalLight
        position={[9, 13, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight position={[-8, 7, -6]} intensity={0.65} color="#bfe8ff" />

      <GridPlane />

      {connections.map((c) => (
        <ConnectionLine key={c.id} connection={c} components={components} />
      ))}

      {components.map((c) => (
        <ComponentMesh key={c.id} component={c} />
      ))}

      <RequestParticles />
      <QueueStacks />
      <SimulationLoop />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.07, 0]}
        onClick={() => selectComponent(null)}
      >
        <planeGeometry args={[180, 180]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
}

export function Canvas3D() {
  return (
    <div className="absolute inset-0 bg-[#dbe6f0]">
      <Canvas
        shadows
        dpr={[1, 1.2]}
        camera={{ position: [0, 7.4, 11.5], fov: 40, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#dbe6f0');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
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
