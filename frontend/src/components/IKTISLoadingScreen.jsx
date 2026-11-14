export default function IKTISLoadingScreen({ complete = false }) {
  return (
    <div
      className="min-h-screen bg-surface-soft flex items-center justify-center"
      role="status"
      aria-label="Loading IKTIS"
      aria-busy={!complete}
    >
      <span
        aria-hidden="true"
        className={`block h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary ${
          complete ? '' : 'animate-spin'
        }`}
      />
    </div>
  );
}
