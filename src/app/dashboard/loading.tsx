export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 text-foreground">
      <div className="mb-8 h-20 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
        ))}
      </div>
      <div className="h-[420px] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
    </div>
  )
}
