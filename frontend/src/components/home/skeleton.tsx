export function BusinessCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden animate-pulse">
      <div className="h-44 bg-muted/60" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="h-3 w-1/3 bg-muted rounded" />
        <div className="h-3 w-full bg-muted/80 rounded" />
        <div className="h-3 w-4/5 bg-muted/80 rounded" />
      </div>
    </div>
  );
}
