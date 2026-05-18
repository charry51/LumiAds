import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="dark min-h-screen bg-black text-white selection:bg-lumi-violet selection:text-white pb-24">
      {/* Navigation */}
      <header className="border-b border-white/[0.05] bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center">
          <Link href="/" className="flex items-center gap-2 group text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest font-bold">Volver al Inicio</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 max-w-4xl pt-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-heading tracking-tighter mb-4 text-white">
            Términos y <span className="text-gradient-ui">Condiciones</span>
          </h1>
          <p className="text-zinc-400 font-mono text-sm">Última actualización: Mayo 2026</p>
        </div>

        <div className="space-y-12 text-zinc-300 font-sans leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-heading text-white mb-4">1. Aceptación de los Términos</h2>
            <p className="mb-4">
              Al acceder y utilizar la plataforma LumiAds (en adelante, "la Plataforma"), usted acepta estar sujeto a estos Términos y Condiciones de Uso, así como a nuestra Política de Privacidad. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">2. Descripción del Servicio</h2>
            <p className="mb-4">
              LumiAds proporciona una plataforma de Digital Signage SaaS que permite la gestión programática de anuncios en pantallas digitales Out-Of-Home (OOH). Los servicios incluyen la gestión de contenido, programación de campañas, análisis de impactos y facturación automatizada.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">3. Cuentas de Usuario y Seguridad</h2>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Usted es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>Debe notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta.</li>
              <li>Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">4. Propiedad Intelectual y Contenido</h2>
            <p className="mb-4">
              El usuario retiene todos los derechos sobre el contenido que sube a la plataforma. Sin embargo, al subir contenido, otorga a LumiAds una licencia mundial, no exclusiva y libre de regalías para utilizar, reproducir y distribuir dicho contenido únicamente con el propósito de prestar el servicio contratado.
            </p>
            <p className="mb-4">
              El diseño, código fuente, logotipos y funcionalidades de la plataforma son propiedad exclusiva de LumiAds y están protegidos por las leyes de propiedad intelectual internacionales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">5. Pagos y Facturación</h2>
            <p className="mb-4">
              Los servicios se facturan según el plan seleccionado a través de nuestro proveedor de pagos autorizado (Stripe). Las tarifas no son reembolsables, excepto cuando lo exija la ley aplicable. Nos reservamos el derecho de modificar nuestras tarifas con un aviso previo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">6. Limitación de Responsabilidad</h2>
            <p className="mb-4">
              LumiAds no será responsable por daños indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar el servicio. Nuestra responsabilidad máxima en cualquier reclamación relacionada con el servicio se limitará al monto pagado por usted en los últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">7. Modificaciones de los Términos</h2>
            <p className="mb-4">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la plataforma. Su uso continuado del servicio después de la publicación constituye su aceptación de los términos modificados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">8. Contacto</h2>
            <p className="mb-4">
              Si tiene alguna pregunta sobre estos Términos, póngase en contacto con nosotros a través de <a href="mailto:legal@lumiads.app" className="text-lumi-violet hover:underline">legal@lumiads.app</a> o utilizando el formulario de contacto en nuestra página principal.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
