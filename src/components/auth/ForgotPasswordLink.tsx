'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export function ForgotPasswordLink() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    const emailInput = document.getElementById('email') as HTMLInputElement | null
    if (!emailInput) return

    const handleInput = (e: Event) => {
      setEmail((e.target as HTMLInputElement).value)
    }

    // Set initial value in case browser autofills it
    const timer = setTimeout(() => {
      if (emailInput.value) {
        setEmail(emailInput.value)
      }
    }, 500)

    emailInput.addEventListener('input', handleInput)
    emailInput.addEventListener('change', handleInput)

    return () => {
      clearTimeout(timer)
      emailInput.removeEventListener('input', handleInput)
      emailInput.removeEventListener('change', handleInput)
    }
  }, [])

  return (
    <Link 
      href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`} 
      className="text-[9px] uppercase tracking-widest text-zinc-600 hover:text-lumi-blue transition-colors"
    >
      ¿Olvidaste tu contraseña?
    </Link>
  )
}
