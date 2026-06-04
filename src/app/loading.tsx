export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-2 border-white/10 border-t-[#2BC8FF] animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400 font-bold">
          Cargando LumiAds
        </p>
      </div>
    </div>
  )
}
