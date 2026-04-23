export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative h-12 w-12 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary" style={{ borderImage: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(262 83% 58%)) 1' }} />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Loading...</p>
      </div>
    </div>
  );
}
