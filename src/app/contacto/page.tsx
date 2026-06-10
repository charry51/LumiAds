import Link from 'next/link'
import ContactSection from '@/components/landing/ContactSection'

export default function ContactoPage() {
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
      <ContactSection />
    </main>
  )
}
