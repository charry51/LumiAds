import InfoContactPage from '@/components/landing/InfoContactPage'

export default function InformacionAnunciantePage() {
  return (
    <InfoContactPage
      accent="blue"
      titleSize="large"
      eyebrow="Para anunciantes"
      title="Anuncia tu marca en pantallas digitales reales"
      description="LumiAds te permite lanzar campanas visuales en espacios fisicos, elegir pantallas relevantes y controlar presupuesto, duracion y resultados desde un mismo panel. La idea es que puedas pasar de una creatividad a una campana activa sin perder tiempo en negociaciones manuales."
      ctaHref="/register?type=advertiser"
      ctaLabel="Crear cuenta"
      points={[
        'Crea campanas sin negociar pantalla por pantalla.',
        'Elige ubicaciones y formatos segun el objetivo de tu marca.',
        'Consulta actividad, impactos y rendimiento desde el panel.',
      ]}
      details={[
        'Pensado para negocios locales, marcas, agencias y anunciantes que quieren presencia en espacios fisicos sin montar una red propia de pantallas.',
        'Puedes preparar la campana, definir presupuesto, seleccionar pantallas y revisar el estado de entrega desde el mismo flujo.',
        'El panel te ayuda a ordenar tus creatividades, fechas, duracion e inversion para que cada campana salga con menos friccion.',
        'Si no tienes claro por donde empezar, el formulario de contacto sirve para pedir orientacion, demo o ayuda con tu primera campana.',
      ]}
    />
  )
}
