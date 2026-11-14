import { useEffect, useRef } from 'react';
import useReducedMotion from './useReducedMotion.js';

export default function useScrollAnimation(animation, dependencies = []) {
  const prefersReducedMotion = useReducedMotion();
  const scopeRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion || !scopeRef.current) return undefined;

    let active = true;
    let context;

    import('../lib/animations/gsap.js')
      .then(({ gsap }) => {
        if (!active || !scopeRef.current) return;
        context = gsap.context(() => animation(gsap), scopeRef);
      })
      .catch((error) => {
        if (active) {
          console.error('Failed to load scroll animation utilities.', error);
        }
      });

    return () => {
      active = false;
      context?.revert();
    };
  }, [prefersReducedMotion, ...dependencies]);

  return scopeRef;
}
