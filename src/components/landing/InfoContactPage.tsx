import Link from 'next/link'
import ContactSection from '@/components/landing/ContactSection'

type InfoContactPageProps = {
  title: string
  eyebrow: string
  description: string
  points: string[]
  accent: 'blue' | 'violet'
}

export default function InfoContactPage({
  title,
  eyebrow,
  description,
  points,
  accent,
}: InfoContactPageProps) {
  const accentClass = accent === 'blue' ? 'text-[#2BC8FF]' : 'text-[#B99CFF]'
  const glowClass = accent === 'blue' ? 'bg-[#2BC8FF]/10' : 'bg-[#7C3CFF]/10'

  return (
    <main className="dark min-h-screen bg-black text-white">
      <div className="fixed left-4 top-4 z-50">
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-black/70 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md transition-colors hover:bg-white/10"
        >
          Volver
        </Link>
      </div>

      <section className="relative overflow-hidden bg-black px-6 pb-10 pt-28 md:pt-32">
        <div className={`absolute left-1/2 top-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full ${glowClass} blur-[100px]`} />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className={`mb-4 text-[10px] font-black uppercase tracking-[0.28em] ${accentClass}`}>
            {eyebrow}
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-heading font-light leading-tight tracking-tighter text-white md:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-zinc-400 md:text-lg">
            {description}
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {points.map((point) => (
              <div key={point} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left text-sm leading-relaxed text-zinc-300">
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
    </main>
  )
}
