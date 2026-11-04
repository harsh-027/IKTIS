import React from 'react';
import LogoTraceLoader from '../../components/LogoTraceLoader.tsx';

export default function IKTISLoadingScreen({ complete = false }) {
  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center">
      <LogoTraceLoader
        loading={!complete}
        isComplete={complete}
        size={88}
        strokeWidth={8}
        ariaLabel="Loading IKTIS"
      />
    </div>
  );
}
