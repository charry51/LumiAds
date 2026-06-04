'use client'

import { BarChart3, Layers, Monitor, Target, Wallet, Zap } from 'lucide-react'

const features = [
  {
    title: 'Campañas sin lío',
    description: 'Crea una campaña, sube tu creatividad, elige pantallas y controla presupuesto desde un mismo panel.',
    icon: Zap,
  },
  {
    title: 'Presupuesto claro',
    description: 'Tú marcas cuánto quieres invertir y ves una estimación de impactos antes de publicar.',
    icon: Wallet,
  },
  {
    title: 'Pantallas por ubicación',
    description: 'Encuentra pantallas por ciudad, zona y tipo de local para anunciar donde realmente te interesa.',
    icon: Monitor,
  },
  {
    title: 'Métricas visibles',
    description: 'Consulta estados, presupuesto e impactos sin tener que rebuscar entre pantallas.',
    icon: BarChart3,
  },
  {
    title: 'Dos roles claros',
    description: 'Puedes entrar como anunciante para crear campañas o como gestor para monetizar pantallas.',
    icon: Target,
  },
  {
    title: 'Ingresos para gestores',
    description: 'Conecta pantallas, elige plan y revisa tus ingresos desde el portal de gestor.',
    icon: Layers,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-black relative">
       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#7C3CFF]/10 to-transparent" />
       
       <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-20 text-center md:text-left">
             <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <span className="w-10 h-[1px] bg-[#7C3CFF]" />
                <h2 className="text-[#7C3CFF] text-[10px] uppercase tracking-[0.3em] font-black">Qué puedes hacer</h2>
             </div>
             <h3 className="text-3xl md:text-5xl font-heading text-white font-light tracking-tighter leading-tight">
                Una plataforma para anunciar y monetizar pantallas{' '}
                <span className="text-gradient-ui">sin perderte.</span>
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
