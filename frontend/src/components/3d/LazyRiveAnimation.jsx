import { lazy, Suspense } from 'react';

const RiveAnimation = lazy(() => import('./RiveAnimation.jsx'));

export default function LazyRiveAnimation(props) {
  return (
    <Suspense fallback={null}>
      <RiveAnimation {...props} />
    </Suspense>
  );
}
