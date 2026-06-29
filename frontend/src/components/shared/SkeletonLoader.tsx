export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const widths = ['75%', '50%', '65%', '40%', '80%'];
  return (
    <div className="animate-pulse p-4 rounded-xl bg-white/5 border border-white/[0.08]">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-white/10 rounded mb-2 last:mb-0"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={i === 0 ? 3 : 2} />
      ))}
    </div>
  );
}

export function SkeletonKanban() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {[3, 2, 1].map((count, col) => (
        <div key={col} className="space-y-3">
          <div className="animate-pulse h-8 bg-white/5 rounded-lg" />
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ))}
    </div>
  );
}
