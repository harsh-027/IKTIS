import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PALETTE = {
  concrete: '#d9d3c7',
  concreteLight: '#eee9df',
  concreteDark: '#a99f91',
  glass: '#5e7f82',
  glassLight: '#b7d0c8',
  green: '#466c56',
  greenDark: '#31513f',
  soil: '#766d5f',
};

function WindowGrid({ floors = 5, columns = 4, x = 0, z = 0, width = 0.48, height = 0.72, gapX = 0.18, gapY = 0.2, offsetY = 0.5 }) {
  const windows = useMemo(() => Array.from({ length: floors * columns }, (_, index) => ({
    row: Math.floor(index / columns),
    column: index % columns,
  })), [columns, floors]);

  return (
    <group position={[x, 0, z]}>
      {windows.map(({ row, column }) => (
        <mesh key={`${row}-${column}`} position={[(column - (columns - 1) / 2) * (width + gapX), offsetY + row * (height + gapY), 0]} castShadow>
          <boxGeometry args={[width, height, 0.035]} />
          <meshStandardMaterial color={row === 1 && column === 2 ? PALETTE.glassLight : PALETTE.glass} metalness={0.18} roughness={0.24} />
        </mesh>
      ))}
    </group>
  );
}

function BalconyStack({ floors = 5, side = 1 }) {
  return (
    <group position={[side * 2.05, 0, 0.16]}>
      {Array.from({ length: floors - 1 }, (_, index) => {
        const y = 1.16 + index * 1.07;
        return (
          <group key={index} position={[0, y, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.05, 0.08, 1.15]} />
              <meshStandardMaterial color={PALETTE.concreteLight} roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.34, 0.38]}>
              <boxGeometry args={[0.93, 0.64, 0.035]} />
              <meshStandardMaterial color={PALETTE.greenDark} roughness={0.42} metalness={0.12} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CourtyardTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 1, 8]} />
        <meshStandardMaterial color={PALETTE.soil} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.14, 0]} castShadow>
        <icosahedronGeometry args={[0.52, 1]} />
        <meshStandardMaterial color={PALETTE.green} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function BuildingModel({ interactive }) {
  const group = useRef(null);
  const { invalidate } = useThree();
  const target = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    if (!group.current || !interactive) return;
    const { x, y } = target.current;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.07, 0.08);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.025, 0.08);
    if (Math.abs(group.current.rotation.y - x * 0.07) > 0.001 || Math.abs(group.current.rotation.x + y * 0.025) > 0.001) invalidate();
  });

  const handlePointerMove = (event) => {
    target.current.set(event.pointer.x, event.pointer.y);
    invalidate();
  };

  return (
    <group ref={group} onPointerMove={interactive ? handlePointerMove : undefined} position={[0, -3.15, 0]}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[4.4, 6.1, 2.2]} />
        <meshStandardMaterial color={PALETTE.concrete} roughness={0.86} />
      </mesh>
      <mesh position={[0, 3.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.65, 0.18, 2.45]} />
        <meshStandardMaterial color={PALETTE.concreteLight} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.15, 1.13]}>
        <boxGeometry args={[4.5, 0.16, 0.08]} />
        <meshStandardMaterial color={PALETTE.concreteDark} roughness={0.75} />
      </mesh>
      <WindowGrid floors={5} columns={4} x={0} z={1.12} />
      <WindowGrid floors={5} columns={2} x={-2.22} z={0} width={0.45} height={0.72} gapX={0.18} />
      <BalconyStack side={1} />
      <BalconyStack side={-1} />
      <mesh position={[0, -3.04, 0.14]} castShadow>
        <boxGeometry args={[1.18, 1.85, 0.1]} />
        <meshStandardMaterial color={PALETTE.greenDark} roughness={0.42} metalness={0.12} />
      </mesh>
      <mesh position={[0, -2.62, 0.22]}>
        <boxGeometry args={[0.46, 0.94, 0.025]} />
        <meshStandardMaterial color={PALETTE.glassLight} roughness={0.18} metalness={0.25} />
      </mesh>
      <mesh position={[0, -3.24, 0]} receiveShadow>
        <boxGeometry args={[6.2, 0.24, 4.4]} />
        <meshStandardMaterial color={PALETTE.concreteLight} roughness={0.95} />
      </mesh>
      <CourtyardTree position={[-2.5, -3, 1]} scale={0.9} />
      <CourtyardTree position={[2.55, -3, 0.9]} scale={0.72} />
    </group>
  );
}

export function ApartmentBuildingFallback() {
  return (
    <div className="apartment-scene-fallback" aria-hidden="true">
      <div className="apartment-fallback-building">
        <div className="apartment-fallback-roof" />
        <div className="apartment-fallback-windows" />
        <div className="apartment-fallback-door" />
      </div>
    </div>
  );
}

export default function ApartmentBuildingHero() {
  const [failed, setFailed] = React.useState(false);
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (failed) return <ApartmentBuildingFallback />;

  return (
    <div className="apartment-scene" aria-label="Interactive architectural preview of a managed apartment building" role="img">
      <Canvas
        shadows={{ type: 'basic' }}
        dpr={[1, 1.35]}
        camera={{ position: [8.1, 3.2, 9.4], fov: 28 }}
        frameloop="demand"
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: true }}
        onCreated={({ gl }) => {
          if (!gl || gl.getContext().isContextLost()) setFailed(true);
        }}
        onError={() => setFailed(true)}
      >
        <color attach="background" args={['#f7f4ee']} />
        <ambientLight intensity={1.8} color="#fffaf1" />
        <directionalLight position={[5, 8, 5]} intensity={3.2} color="#fff2dd" castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0004} />
        <directionalLight position={[-5, 4, 2]} intensity={1.1} color="#b5d3cf" />
        <BuildingModel interactive={!prefersReducedMotion} />
      </Canvas>
      <span className="sr-only">Drag-free preview. Move your pointer across the building to shift the view.</span>
    </div>
  );
}
