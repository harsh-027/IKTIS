import { ScrollTrigger } from './gsap.js';

export function createScrollReveal(element, options = {}) {
  if (!element) return null;

  return ScrollTrigger.create({
    trigger: element,
    start: 'top 85%',
    once: true,
    ...options,
  });
}
