import { motion } from 'motion/react';
import useReducedMotion from '../../hooks/useReducedMotion.js';

export default function AnimatedText({ children, className = '', delay = 0 }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ delay: prefersReducedMotion ? 0 : delay, duration: prefersReducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.span>
  );
}
