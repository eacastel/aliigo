"use client";

type LoadingStateProps = {
  label: string;
  className?: string;
};

export default function LoadingState({
  label,
  className = "p-4",
}: LoadingStateProps) {
  return (
    <div className={`flex items-center text-zinc-300 ${className}`}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300/40 border-t-brand-500/70" />
      <span className="ml-3 text-sm text-zinc-400">{label}</span>
    </div>
  );
}

