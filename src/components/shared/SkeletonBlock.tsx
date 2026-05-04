type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[12px] bg-[linear-gradient(90deg,var(--skeleton-base),var(--skeleton-highlight),var(--skeleton-base))] ${className}`}
    />
  );
}
