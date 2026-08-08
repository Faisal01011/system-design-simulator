import { Grid } from '@react-three/drei';

export function GridPlane() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.065, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial
          color="#07101c"
          roughness={0.88}
          metalness={0.05}
        />
      </mesh>

      <Grid
        args={[72, 72]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#183149"
        sectionSize={5}
        sectionThickness={0.9}
        sectionColor="#294d68"
        fadeDistance={44}
        fadeStrength={1.8}
        followCamera={false}
        infiniteGrid={false}
        position={[0, -0.018, 0]}
      />
    </>
  );
}
