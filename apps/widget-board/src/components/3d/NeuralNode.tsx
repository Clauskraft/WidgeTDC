import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

interface NeuralNodeProps {
  position: [number, number, number];
  color?: string;
  label?: string;
  size?: number;
  onClick?: () => void;
}

export const NeuralNode: React.FC<NeuralNodeProps> = ({ 
  position, 
  color = '#00B5CB', 
  label, 
  size = 0.5,
  onClick 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.2;
      // Pulse effect
      const scale = active ? 1.2 : hovered ? 1.1 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={(e) => {
          e.stopPropagation();
          setActive(!active);
          onClick?.();
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <meshStandardMaterial
          color={active ? '#ff00ff' : color}
          emissive={active ? '#ff00ff' : color}
          emissiveIntensity={hovered ? 2 : 1}
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
      {/* Glow Halo */}
      <Sphere args={[size * 1.2, 16, 16]}>
         <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.BackSide} />
      </Sphere>
      
      {/* Label */}
      {(hovered || active || label) && (
        <Html distanceFactor={10}>
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded border border-white/20 backdrop-blur-md whitespace-nowrap select-none pointer-events-none">
            {label || 'Neural Node'}
          </div>
        </Html>
      )}
    </group>
  );
};
