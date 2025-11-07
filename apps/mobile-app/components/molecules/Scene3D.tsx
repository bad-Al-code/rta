import { Torus } from '@react-three/drei/native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import React, { useRef } from 'react';
import { Mesh } from 'three';

function RotatingTorus() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Torus ref={meshRef} args={[0.8, 0.3, 32, 100]}>
      <meshStandardMaterial color="#8B5CF6" />
    </Torus>
  );
}

export function Scene3D() {
  return (
    <Canvas style={{ flex: 1 }}>
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={50} />

      <RotatingTorus />
    </Canvas>
  );
}
