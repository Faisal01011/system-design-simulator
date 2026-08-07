import { Grid } from '@react-three/drei';

export function GridPlane() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshPhysicalMaterial
          color="#0a1320"
          roughness={0.58}
          metalness={0.18}
          clearcoat={0.25}
          clearcoatRoughness={0.65}
        />
      </mesh>

      <Grid
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.55}
        cellColor="#1e3a52"
        sectionSize={5}
        sectionThickness={1.05}
        sectionColor="#31546f"
        fadeDistance={38}
        fadeStrength={1.35}
        followCamera={false}
        infiniteGrid
        position={[0, -0.018, 0]}
      />
    </>
  );
}
