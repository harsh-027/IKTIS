import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/animations/gsap.js';

export default function useGsap(callback, dependencies = []) {
  const scopeRef = useRef(null);

  useLayoutEffect(() => {
    if (!scopeRef.current) return undefined;

    const context = gsap.context(() => callback(gsap), scopeRef);
    return () => context.revert();
  }, dependencies);

  return scopeRef;
}
