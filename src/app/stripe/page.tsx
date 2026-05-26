import { redirect } from 'next/navigation'

export default async function StripePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const resolvedSearchParams = await searchParams

  if (!resolvedSearchParams?.plan) {
    redirect('/planes/seleccionar?role=host')
  }

  redirect('/planes/seleccionar?role=host')
}
