'use client'

import Link from 'next/link'
import { Monitor, MoveRight, Play, Server, Zap } from 'lucide-react'

interface HeroStats {
  totalImpacts: number;
  totalYield: number;
  totalNodes: number;
  liveFeed: {
    time: string;
    node: string;
    action: string;
    res: string;
  }[];
}

export default function HeroSection({ stats }: { stats?: HeroStats }) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const displayStats = stats || {
    totalImpacts: 8420000,
    totalYield: 12408,
    totalNodes: 1240,
    liveFeed: [
        { time: '14:22:10', node: 'MAD-SOL04', action: 'Verified PoP', res: '+0.12€' },
        { time: '14:22:08', node: 'BCN-RA21', action: 'Ads Switched', res: 'Elastic' },
        { time: '14:22:04', node: 'LON-SQ12', action: 'Verified PoP', res: '+0.85€' },
        { time: '14:21:59', node: 'PAR-CH01', action: 'Yield High', res: 'Gold' },
        { time: '14:21:55', node: 'NYC-TS09', action: 'Verified PoP', res: '+1.42€' },
    ]
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-20 overflow-visible px-4">
      {/* Elementos Decorativos de Fondo */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-[#2BC8FF]/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute top-1/2 right-1/4 -translate-x-1/2 w-[400px] h-[400px] bg-[#7C3CFF]/5 rounded-full blur-[120px] pointer-events-none opacity-30" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#2BC8FF]/30 to-transparent" />
      
      <div className="container mx-auto max-w-6xl relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2BC8FF]/30 bg-[#2BC8FF]/5 text-[#2BC8FF] text-[10px] uppercase tracking-[0.2em] font-bold mb-8 shadow-[0_0_15px_rgba(43,200,255,0.1)]">
          <Zap className="w-3 h-3 fill-current" />
          Nueva Era: Programmatic OOH
        </div>
        
        <h1 className="text-5xl md:text-8xl font-heading font-light tracking-tighter text-white mb-6 leading-[0.9]">
          Domina la <br />
          <span className="text-gradient-ui font-medium">Atención</span> <span className="text-gradient-ui font-medium">Digital.</span>
        </h1>
        
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed mb-10">
          LumiAds transforma tus pantallas en activos inteligentes. 
          Publicidad programática basada en <span className="text-white font-medium">rendimiento real</span>, no en suposiciones.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="cyber-button-ui group w-full sm:w-auto">
            Empezar Ahora
            <MoveRight className="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="px-8 py-3 rounded-full border border-[#7C3CFF]/30 text-[#7C3CFF] hover:bg-[#7C3CFF]/5 transition-all text-[10px] uppercase tracking-widest font-bold w-full sm:w-auto">
            Acceso Clientes
          </Link>
        </div>
      </div>
      
      {/* Floating UI Elements Mockup: The Intelligence Engine */}
      <div className="mt-16 relative w-full max-w-6xl mx-auto animate-float px-4 sm:px-10 flex flex-col items-center justify-center">
          <div className="landing-glass-ui p-1 rounded-[2.2rem] shadow-[0_0_80px_rgba(124,60,255,0.15)] relative z-20 w-full">
             <div className="bg-black/95 rounded-[2rem] overflow-hidden border border-white/10 min-h-[600px] relative flex flex-col">
                {/* Simulated Dashboard UI */}
                 <div className="relative bg-gradient-to-br from-[#7C3CFF]/10 via-black to-black p-8 md:p-14 flex flex-col flex-grow">
                    
                    {/* Top Bar: System Status */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#2BC8FF] animate-pulse shadow-[0_0_10px_#2BC8FF]" />
                                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-[3px]">Bucle Elástico v2.0</span>
                            </div>
                            <div className="h-4 w-px bg-zinc-800" />
                            <div className="flex items-center gap-2">
                                <Server className="w-3 h-3 text-zinc-600" />
                                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Red Global de Nodos</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                             <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/5 rounded-md">
                                <span className="text-[9px] font-mono text-zinc-500 uppercase">Latencia:</span>
                                <span className="text-[9px] font-mono text-[#7C3CFF] font-bold">14ms</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-8 flex-grow">
                        {/* Stats Panel */}
                        <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
                            <div className="grid grid-cols-3 gap-6">
                                {/* Impacts Card */}
                                <div className="landing-glass-ui border-white/5 p-5 flex flex-col justify-between group cursor-default">
                                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1 group-hover:text-[#7C3CFF] transition-colors">Impactos</p>
                                    <p className="text-3xl md:text-4xl font-heading text-white tracking-tighter">{formatNumber(displayStats.totalImpacts)}</p>
                                    <div className="mt-4 h-8 w-full">
                                        <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                                            <path d="M0,25 Q10,15 20,20 T40,10 T60,22 T80,5 T100,18" fill="none" stroke="#7C3CFF" strokeWidth="2" className="opacity-70" />
                                            <path d="M0,25 Q10,15 20,20 T40,10 T60,22 T80,5 T100,18 V30 H0 Z" fill="url(#gradCyan)" className="opacity-10" />
                                            <defs>
                                                <linearGradient id="gradCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" style={{stopColor:'#7C3CFF', stopOpacity:0.5}} />
                                                    <stop offset="100%" style={{stopColor:'#7C3CFF', stopOpacity:0}} />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                                
                                {/* Yield Card */}
                                <div className="landing-glass-ui border-white/5 p-5 flex flex-col justify-between group cursor-default">
                                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1 group-hover:text-[#7C3CFF] transition-colors">Rendimiento (24h)</p>
                                    <p className="text-3xl md:text-4xl font-heading text-white tracking-tighter text-gradient-ui">{displayStats.totalYield.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
                                    <div className="mt-4 h-8 w-full">
                                        <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                                            <path d="M0,20 Q15,25 30,15 T60,5 T100,12" fill="none" stroke="#7C3CFF" strokeWidth="2" className="opacity-70" />
                                            <path d="M0,20 Q15,25 30,15 T60,5 T100,12 V30 H0 Z" fill="url(#gradLumi)" className="opacity-10" />
                                            <defs>
                                                <linearGradient id="gradLumi" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" style={{stopColor:'#7C3CFF', stopOpacity:0.5}} />
                                                    <stop offset="100%" style={{stopColor:'#7C3CFF', stopOpacity:0}} />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>

                                {/* Active Nodes Card */}
                                <div className="landing-glass-ui border-white/5 p-5 flex flex-col justify-between group cursor-default">
                                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1 group-hover:text-[#2BC8FF] transition-colors">Nodos Activos</p>
                                    <p className="text-3xl md:text-4xl font-heading text-white tracking-tighter">{displayStats.totalNodes.toLocaleString()}</p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex gap-0.5">
                                            {[...Array(8)].map((_, i) => (
                                                <div key={i} className="w-2 h-6 bg-[#2BC8FF]/20 rounded-full overflow-hidden">
                                                    <div className="w-full bg-[#2BC8FF] animate-pulse" style={{height: `${((i * 13) % 80) + 20}%`, animationDelay: `${i * 0.15}s`}} />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[9px] font-mono text-zinc-600">ONLINE</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Execution Insight / Map */}
                            <div className="flex-grow rounded-xl bg-white/[0.02] border border-white/5 p-6 relative overflow-hidden group">
                                <div className="flex flex-col gap-4 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Mapa de Verificación (Cluster Madrid)</h4>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#2BC8FF]" />
                                                <span className="text-[8px] text-zinc-600 uppercase">Standard</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#7C3CFF]" />
                                                <span className="text-[8px] text-zinc-600 uppercase">VIP Zone</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow flex items-center justify-center p-4">
                                        <div className="w-full h-80 relative">
                                            {/* Abstract City Grid Simulation */}
                                            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10">
                                                {[...Array(144)].map((_, i) => (
                                                    <div key={i} className="border-[0.5px] border-white/20" />
                                                ))}
                                            </div>
                                            {/* Nodes dots */}
                                            {[...Array(12)].map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`absolute w-1.5 h-1.5 rounded-full ${(i % 3 === 0) ? 'bg-[#7C3CFF]' : 'bg-[#2BC8FF]'} animate-pulse opacity-40`}
                                                    style={{
                                                        top: `${((i * 17) % 80) + 10}%`,
                                                        left: `${((i * 23) % 90) + 5}%`,
                                                        animationDelay: `${(i * 0.3) % 2}s`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                    <Monitor className="w-32 h-32" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Live Feed Panel */}
                        <div className="hidden md:flex col-span-4 flex-col gap-4">
                            <h4 className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-2">
                                <Play className="w-3 h-3 text-[#7C3CFF]" /> Feed de Actividad en Vivo
                            </h4>
                            <div className="flex-grow flex flex-col gap-4 overflow-hidden relative">
                                <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black to-transparent z-10" />
                                {displayStats.liveFeed.map((item, i) => (
                                    <div key={i} className="p-3 bg-white/[0.03] border border-white/5 rounded-lg flex flex-col gap-1 hover:border-white/20 transition-colors">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-mono text-zinc-600">{item.time}</span>
                                            <span className={`text-[8px] font-mono font-bold ${item.res.includes('+') ? 'text-[#7C3CFF]' : 'text-[#2BC8FF]'}`}>{item.res}</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-300 font-bold tracking-tight uppercase">{item.node}: {item.action}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Overlay Glow */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.9)]" />
             </div>
          </div>
          
          {/* External Floating Chips */}
          <div className="absolute -top-10 -right-10 landing-glass-ui px-6 py-3 text-[12px] text-[#7C3CFF] font-black tracking-[0.3em] hidden lg:block border-[#7C3CFF]/40 shadow-[0_0_40px_rgba(124,60,255,0.2)] animate-float z-30">
            +{formatNumber(displayStats.totalImpacts)} IMPACTOS
          </div>
          <div className="absolute -bottom-10 -left-10 landing-glass-ui px-6 py-3 text-[12px] text-[#2BC8FF] font-black tracking-[0.3em] hidden lg:block border-[#2BC8FF]/40 shadow-[0_0_40px_rgba(43,200,255,0.2)] animate-float z-30 transform -translate-y-4">
            ALCANCE: {displayStats.totalNodes > 0 ? '94%' : '0%'} OPTIMIZADO
          </div>
      </div>
    </section>
  )
}
