'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

type RegisterBackButtonProps = {
  fallbackHref?: string
}

export function RegisterBackButton({ fallbackHref = '/' }: RegisterBackButtonProps) {
  const router = useRouter()

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }, [router, fallbackHref])

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-400 hover:text-white transition-colors mb-4"
    >
      <span className="text-xl leading-none">←</span>
      Volver
    </button>
  )
}
