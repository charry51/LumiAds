import InfoContactPage from '@/components/landing/InfoContactPage'

export default function InformacionGestorPantallasPage() {
  return (
    <InfoContactPage
      accent="violet"
      eyebrow="Para gestores de pantallas"
      title="Convierte tus pantallas en una fuente de ingresos"
      description="Si gestionas pantallas en locales, escaparates, gimnasios, clinicas o espacios con transito, LumiAds te ayuda a conectarlas y monetizar el tiempo disponible con campanas publicitarias sin cambiar tu operativa diaria."
      ctaHref="/register?type=host&returnTo=%2Fplanes%2Fseleccionar%3Frole%3Dhost"
      ctaLabel="Crear cuenta"
      points={[
        'Registra tus pantallas y mantenlas organizadas.',
        'Recibe campanas compatibles con tu red y tus espacios.',
        'Controla actividad, disponibilidad e ingresos desde un unico panel.',
      ]}
      details={[
        'Pensado para propietarios de pantallas, gestores de locales, redes DOOH pequenas y negocios con soportes digitales infrautilizados.',
        'Puedes conectar pantallas, revisar su estado, organizar ubicaciones y preparar tu inventario para recibir campanas.',
        'La plataforma busca que cada pantalla tenga una funcion comercial clara: mostrar contenido, recibir anuncios y generar ingresos medibles.',
        'Si quieres validar si tus pantallas encajan, usa el formulario de contacto para contarnos cuantas tienes, donde estan y que tipo de contenido muestran.',
      ]}
    />
  )
}
