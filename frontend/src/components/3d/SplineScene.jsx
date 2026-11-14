import { lazy, Suspense } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

export default function SplineScene({ scene, className = '', ...props }) {
  if (!scene) {
    throw new Error('SplineScene requires a scene URL supplied by the product team.');
  }

  return (
    <div className={className}>
      <Suspense fallback={null}>
        <Spline scene={scene} {...props} />
      </Suspense>
    </div>
  );
}
