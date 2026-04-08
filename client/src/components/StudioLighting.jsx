import { Environment } from '@react-three/drei';

export default function StudioLighting() {
  return (
    <>
      {/* Key light — main from upper right */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Fill light — softer from left */}
      <directionalLight
        position={[-5, 4, -3]}
        intensity={0.6}
        color="#b0c4de"
      />
      {/* Rim light — behind for edge highlight */}
      <directionalLight
        position={[0, 3, -8]}
        intensity={0.8}
        color="#ffeedd"
      />
      {/* Ambient base */}
      <ambientLight intensity={0.15} />
      {/* Dark reflective ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#080808" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Studio environment for realistic reflections */}
      <Environment preset="studio" background={false} />
    </>
  );
}
