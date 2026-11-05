interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Carregando dados do tempo...",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-white/85 shadow-glass backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-white/25 border-t-accent-400"
      />
      <span>{message}</span>
    </div>
  );
}