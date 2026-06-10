import InfoContactPage from '@/components/landing/InfoContactPage'

export default function InformacionAnunciantePage() {
  return (
    <InfoContactPage
      accent="blue"
      eyebrow="Para anunciantes"
      title="Anuncia tu marca en pantallas digitales reales"
      description="LumiAds te permite lanzar campanas visuales en espacios fisicos, elegir pantallas relevantes y controlar presupuesto, duracion y resultados desde un mismo panel."
      points={[
        'Crea campanas sin negociar pantalla por pantalla.',
        'Elige ubicaciones y formatos segun el objetivo de tu marca.',
        'Consulta actividad, impactos y rendimiento desde el panel.',
      ]}
    />
  )
}
