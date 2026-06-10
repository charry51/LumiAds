import InfoContactPage from '@/components/landing/InfoContactPage'

export default function InformacionGestorPantallasPage() {
  return (
    <InfoContactPage
      accent="violet"
      eyebrow="Para gestores de pantallas"
      title="Convierte tus pantallas en una fuente de ingresos"
      description="Si gestionas pantallas en locales, escaparates, gimnasios, clinicas o espacios con transito, LumiAds te ayuda a conectarlas y monetizar el tiempo disponible con campanas publicitarias."
      points={[
        'Registra tus pantallas y mantenlas organizadas.',
        'Recibe campanas compatibles con tu red y tus espacios.',
        'Controla actividad, disponibilidad e ingresos desde un unico panel.',
      ]}
    />
  )
}
