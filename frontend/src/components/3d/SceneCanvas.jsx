import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

export default function SceneCanvas({
  children,
  camera = { position: [0, 0, 5], fov: 40 },
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      <Canvas
        camera={camera}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        {...props}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
