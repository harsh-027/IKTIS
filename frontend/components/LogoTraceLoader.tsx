import { useEffect, useRef, useState } from "react";
import logoSvg from "../src/assets/iktis-logo.svg?raw";
import "./LogoTraceLoader.css";

type LoaderPhase = "loop" | "closingOutline" | "fadingFill" | "done";

export type LogoTraceLoaderProps = {
  loading?: boolean;
  isComplete?: boolean;
  size?: number;
  strokeWidth?: number;
  loopDurationSeconds?: number;
  fillFadeSeconds?: number;
  className?: string;
  ariaLabel?: string;
  onDone?: () => void;
};

const LOGO_VIEW_BOX = "0 0 1254 1254";
const LOGO_PATHS = Array.from(
  logoSvg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g),
  (match) => match[1],
);
const TRACE_PATH = LOGO_PATHS[0] ?? "";
const FILL_PATHS = LOGO_PATHS;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function LogoTraceLoader({
  loading = true,
  isComplete = false,
  size = 48,
  strokeWidth = 7,
  loopDurationSeconds = 1.8,
  fillFadeSeconds = 0.35,
  className,
  ariaLabel = "Loading",
  onDone,
}: LogoTraceLoaderProps) {
  const [phase, setPhase] = useState<LoaderPhase>(
    loading && !isComplete ? "loop" : "closingOutline",
  );
  const hasDoneRef = useRef(false);
  const wasLoadingRef = useRef(loading);

  useEffect(() => {
    if (loading && !wasLoadingRef.current) {
      hasDoneRef.current = false;
      setPhase("loop");
    }
    wasLoadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    const finish = () => {
      if (hasDoneRef.current) return;
      hasDoneRef.current = true;
      setPhase("done");
      onDone?.();
    };

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    if (mediaQuery.matches) {
      finish();
      return;
    }

    if (loading && !isComplete) {
      return;
    }

    setPhase("closingOutline");
    const closeTimer = window.setTimeout(
      () => setPhase("fadingFill"),
      Math.max(100, loopDurationSeconds * 1000),
    );
    const finishTimer = window.setTimeout(
      finish,
      Math.max(150, loopDurationSeconds * 1000 + fillFadeSeconds * 1000),
    );

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [fillFadeSeconds, isComplete, loading, loopDurationSeconds, onDone]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleMotionChange = () => {
      if (mediaQuery.matches && !hasDoneRef.current) {
        hasDoneRef.current = true;
        setPhase("done");
        onDone?.();
      }
    };

    mediaQuery.addEventListener?.("change", handleMotionChange);
    return () => mediaQuery.removeEventListener?.("change", handleMotionChange);
  }, [onDone]);

  const outlineStrokeWidth = Math.max(1, strokeWidth / 2);
  const isFilled = phase === "fadingFill" || phase === "done";

  return (
    <svg
      role="status"
      aria-label={ariaLabel}
      aria-busy={phase !== "done"}
      viewBox={LOGO_VIEW_BOX}
      width={size}
      height={size}
      className={className}
    >
      <g opacity="0.18">
        <path
          d={TRACE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={outlineStrokeWidth}
          strokeLinejoin="round"
        />
      </g>

      {phase === "loop" ? (
        <path
          d={TRACE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="0.16 0.84"
          style={{
            animation: `logo-trace-loader-loop ${loopDurationSeconds}s linear infinite`,
          }}
        />
      ) : null}

      {phase === "closingOutline" ? (
        <path
          d={TRACE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          className="logo-trace-loader-closing"
          style={{ animationDuration: `${loopDurationSeconds}s` }}
        />
      ) : null}

      {isFilled
        ? FILL_PATHS.map((path, index) => (
            <path
              key={`${index}-${path}`}
              d={path}
              fill="currentColor"
              className="logo-trace-loader-fill"
              style={{ animationDuration: `${fillFadeSeconds}s` }}
            />
          ))
        : null}
    </svg>
  );
}

export default LogoTraceLoader;
