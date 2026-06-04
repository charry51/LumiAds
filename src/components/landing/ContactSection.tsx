'use client';

import { useState } from 'react';
import { sendContactMessage } from '@/app/actions/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Send, Mail, User, MessageSquare } from 'lucide-react';

export default function ContactSection() {
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await sendContactMessage(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('¡Mensaje enviado correctamente! Te contactaremos pronto.');
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section id="contacto" className="py-24 relative overflow-hidden bg-[#0a0a0f] text-zinc-100 dark" style={{ backgroundColor: '#0a0a0f', color: '#f8f9fa' }}>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2BC8FF]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#7C3CFF]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-16">
          
          {/* Info Side */}
          <div className="lg:w-2/5">
            <h2 className="text-4xl md:text-5xl font-heading text-white tracking-tighter mb-6" style={{ color: '#ffffff' }}>
              Hablemos de <br />
              <span className="text-gradient-ui">tu proyecto</span>
            </h2>
            <p className="text-zinc-400 font-sans leading-relaxed mb-10 max-w-sm" style={{ color: '#a0a0b8' }}>
              Cuéntanos qué necesitas y te responderemos con el siguiente paso: demo, soporte o ayuda para configurar pantallas.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5" style={{ color: '#71717a' }}>Escríbenos</p>
                  <p className="text-white font-mono text-sm" style={{ color: '#ffffff' }}>hola@lumiads.app</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#2BC8FF]/50 transition-colors">
                  <MessageSquare className="w-5 h-5 text-[#2BC8FF]" />
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5" style={{ color: '#71717a' }}>Soporte 24/7</p>
                   <p className="text-white font-mono text-sm" style={{ color: '#ffffff' }}>Chat en vivo disponible</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:w-3/5">
            <div className="landing-glass-ui p-8 md:p-12 relative" style={{ backgroundColor: 'rgba(18, 18, 26, 0.8)', borderColor: 'rgba(43, 200, 255, 0.2)' }}>
              <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold" style={{ color: '#a1a1aa' }}>Nombre</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input 
                        id="name" 
                        name="name" 
                        autoComplete="name"
                        placeholder="Tu nombre"
                        className="bg-black/40 border-white/10 pl-11 py-6 focus:border-primary transition-all rounded-xl text-white placeholder:text-zinc-600"
                        style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
                        disabled={isPending}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold" style={{ color: '#a1a1aa' }}>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        autoComplete="email"
                        inputMode="email"
                        placeholder="tu@email.com"
                        className="bg-black/40 border-white/10 pl-11 py-6 focus:border-primary transition-all rounded-xl text-white placeholder:text-zinc-600"
                        style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
                        disabled={isPending}
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold" style={{ color: '#a1a1aa' }}>Asunto</Label>
                  <Input 
                    id="subject" 
                    name="subject" 
                    placeholder="Quiero anunciar / Tengo pantallas / Necesito soporte"
                    className="bg-black/40 border-white/10 py-6 focus:border-primary transition-all rounded-xl text-white placeholder:text-zinc-600"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
                    disabled={isPending}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold" style={{ color: '#a1a1aa' }}>Mensaje</Label>
                  <Textarea 
                    id="message" 
                    name="message" 
                    placeholder="Cuéntanos qué quieres conseguir y en qué ciudad trabajas..."
                    className="bg-black/40 border-white/10 min-h-[150px] focus:border-primary transition-all rounded-xl resize-none text-white placeholder:text-zinc-600"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
                    disabled={isPending}
                    required 
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full cyber-button-ui py-8 text-xs font-black tracking-[4px]"
                >
                  {isPending ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
                  {isPending ? <Loader2 className="ml-2 w-4 h-4 animate-spin" /> : <Send className="ml-2 w-4 h-4" />}
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}



