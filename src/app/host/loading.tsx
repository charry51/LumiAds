export default function HostLoading() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 text-foreground">
      <div className="space-y-6">
        <div className="h-20 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
        <div className="h-32 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-96 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
          <div className="h-96 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
