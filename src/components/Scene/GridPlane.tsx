import { Grid } from '@react-three/drei';

export function GridPlane() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.065, 0]} receiveShadow>
        <planeGeometry args={[260, 260]} />
        <meshPhysicalMaterial
          color="#07111d"
          roughness={0.96}
          metalness={0.04}
          clearcoat={0.05}
          clearcoatRoughness={0.95}
        />
      </mesh>

      <Grid
        args={[56, 56]}
        cellSize={1.4}
        cellThickness={0.28}
        cellColor="#12324a"
        sectionSize={5.6}
        sectionThickness={0.65}
        sectionColor="#1d4f72"
        fadeDistance={22}
        fadeStrength={2.2}
        followCamera={false}
        infiniteGrid={false}
        position={[0, -0.018, 0]}
      />
    </>
  );
}
