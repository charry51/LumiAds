'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

export function LoginErrorToast() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  useEffect(() => {
    if (message) {
      // Check if it's an error message or a success message
      // Simple heuristic: if it says "enviado" or similar, it might be success, but we mainly care about login errors here.
      if (message.toLowerCase().includes('enlace') || message.toLowerCase().includes('éxito')) {
        toast.success(message)
      } else {
        toast.error(message)
      }
    }
  }, [message])

  return null
}
