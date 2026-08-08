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
      <color attach="background" args={['#07101c']} />
      <fog attach="fog" args={['#07101c', 28, 72]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#b8e8ff', '#101827', 0.85]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={2.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={55}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <directionalLight position={[-8, 10, -10]} intensity={0.9} color="#7dd3fc" />
      <pointLight position={[-8, 8, -6]} intensity={16} distance={30} color="#38bdf8" />
      <pointLight position={[9, 5, 5]} intensity={8} distance={24} color="#a78bfa" />

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
        position={[0, -0.045, 0]}
        opacity={0.52}
        scale={48}
        blur={2.8}
        far={10}
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
    <div className="absolute inset-0 bg-[#07101c]">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 12, 16], fov: 45, near: 0.1, far: 140 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#07101c');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <SceneContent />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={45}
          maxPolarAngle={Math.PI / 2.12}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
