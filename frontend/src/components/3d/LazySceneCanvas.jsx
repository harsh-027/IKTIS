import { lazy, Suspense } from 'react';

const SceneCanvas = lazy(() => import('./SceneCanvas.jsx'));

export default function LazySceneCanvas(props) {
  return (
    <Suspense fallback={null}>
      <SceneCanvas {...props} />
    </Suspense>
  );
}
