import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { ScrollTrigger } from '../lib/animations/gsap.js';
import useReducedMotion from './useReducedMotion.js';

const EMPTY_OPTIONS = {};

export default function useLenis({ enabled = false, syncWithGsap = false, options = EMPTY_OPTIONS } = {}) {
  const lenisRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || prefersReducedMotion) return undefined;

    const lenis = new Lenis(options);
    let frameId;
    const animate = (time) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(animate);
    };

    if (syncWithGsap) {
      lenis.on('scroll', ScrollTrigger.update);
    }

    lenisRef.current = lenis;
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      if (syncWithGsap) lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled, options, prefersReducedMotion, syncWithGsap]);

  return lenisRef;
}
