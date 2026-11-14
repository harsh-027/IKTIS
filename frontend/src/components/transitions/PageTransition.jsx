import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import useReducedMotion from '../../hooks/useReducedMotion.js';

export default function PageTransition({ children, routeKey }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={!prefersReducedMotion}>
        <motion.div
          key={routeKey}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
