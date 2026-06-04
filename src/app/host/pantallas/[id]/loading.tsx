export default function ScreenDetailLoading() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-16 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-96 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
          <div className="h-96 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
