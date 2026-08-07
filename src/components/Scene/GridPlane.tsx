import { Grid } from '@react-three/drei';

export function GridPlane() {
  return (
    <>
      <Grid
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#1e293b"
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor="#334155"
        fadeDistance={35}
        fadeStrength={1.2}
        followCamera={false}
        infiniteGrid
        position={[0, -0.01, 0]}
      />
      {/* Subtle ground plane for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.25} />
      </mesh>
    </>
  );
}
