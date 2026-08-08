import { Grid } from '@react-three/drei';

export function GridPlane() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.065, 0]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial
          color="#cbd8e6"
          roughness={0.94}
          metalness={0.02}
        />
      </mesh>

      <Grid
        args={[50, 50]}
        cellSize={1.5}
        cellThickness={0.22}
        cellColor="#9bb0c4"
        sectionSize={6}
        sectionThickness={0.5}
        sectionColor="#7894ad"
        fadeDistance={20}
        fadeStrength={2.4}
        followCamera={false}
        infiniteGrid={false}
        position={[0, -0.018, 0]}
      />
    </>
  );
}
