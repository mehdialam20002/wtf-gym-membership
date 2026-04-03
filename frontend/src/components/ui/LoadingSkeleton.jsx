export function PlanCardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
      <div className="h-8 bg-white/10 rounded w-1/2 mb-2" />
      <div className="h-4 bg-white/10 rounded w-1/4 mb-6" />
      <div className="space-y-2 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/10 rounded-full flex-shrink-0" />
            <div className="h-3 bg-white/10 rounded flex-1" />
          </div>
        ))}
      </div>
      <div className="h-12 bg-white/10 rounded-xl" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-white/10 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}
