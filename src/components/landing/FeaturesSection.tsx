'use client'

import { BarChart3, Layers, Monitor, Target, Wallet, Zap } from 'lucide-react'

const features = [
  {
    title: 'Bucle Elástico v2.0',
    description: 'Olvídate de listas de reproducción fijas. Nuestro motor de IA decide qué mostrar basándose en la puja y relevancia en tiempo real.',
    icon: Zap,
  },
  {
    title: 'Presupuesto Meta-Style',
    description: 'Gestiona tus campañas como en redes sociales. Tú pones el presupuesto, nosotros garantizamos los impactos en las mejores zonas.',
    icon: Wallet,
  },
  {
    title: 'Inventario Premium',
    description: 'Acceso exclusivo a pantallas situadas en puntos de alto tráfico filtradas por demografía y zona de impacto.',
    icon: Monitor,
  },
  {
    title: 'Métricas de Atención',
    description: 'Prueba de reproducción (PoP) criptográficamente verificada y analítica avanzada de audiencia.',
    icon: BarChart3,
  },
  {
    title: 'Segmentación por Zonas',
    description: 'Elige entre zonas VIP, Oro o Estándar para maximizar el retorno de inversión de cada euro gastado.',
    icon: Target,
  },
  {
    title: 'Integración Elastic-Node',
    description: 'Para dueños de pantallas: monetización automática sin cuotas fijas. Gana por cada segundo de atención capturado.',
    icon: Layers,
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-black relative">
       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#7C3CFF]/10 to-transparent" />
       
       <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-20 text-center md:text-left">
             <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <span className="w-10 h-[1px] bg-[#7C3CFF]" />
                <h2 className="text-[#7C3CFF] text-[10px] uppercase tracking-[0.3em] font-black">El Motor del Futuro</h2>
             </div>
             <h3 className="text-3xl md:text-5xl font-heading text-white font-light tracking-tighter leading-tight">
                Publicidad <span className="text-gradient-ui italic">Programática</span>{' '}
                <span className="text-gradient-ui">Bajo Demanda.</span>
             </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {features.map((feature, idx) => {
                const isEven = idx % 2 === 0
                return (
                    <div key={idx} className={`${isEven ? 'landing-glass-ui hover:border-[#7C3CFF]/50' : 'landing-glass-ui hover:border-[#2BC8FF]/50'} p-8 group transition-all duration-500`}>
                        <div className={`w-12 h-12 rounded-lg ${isEven ? 'bg-[#7C3CFF]/10 text-[#7C3CFF] shadow-[0_4px_10px_rgba(124,60,255,0.1)]' : 'bg-[#2BC8FF]/10 text-[#2BC8FF] shadow-[0_4px_10px_rgba(43,200,255,0.1)]'} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                            <feature.icon className="w-6 h-6" />
                        </div>
                        <h4 className="text-xl font-heading text-white mb-4 tracking-tight">{feature.title}</h4>
                        <p className="text-zinc-500 text-sm leading-relaxed font-light group-hover:text-zinc-400 transition-colors">
                            {feature.description}
                        </p>
                    </div>
                )
             })}
          </div>
       </div>
    </section>
  )
}
