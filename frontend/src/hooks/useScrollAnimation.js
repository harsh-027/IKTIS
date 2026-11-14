import useGsap from './useGsap.js';
import useReducedMotion from './useReducedMotion.js';

export default function useScrollAnimation(animation, dependencies = []) {
  const prefersReducedMotion = useReducedMotion();

  return useGsap(
    (gsap) => {
      if (prefersReducedMotion) return;
      return animation(gsap);
    },
    [prefersReducedMotion, ...dependencies],
  );
}
