import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="dark min-h-screen bg-black text-white selection:bg-[#2BC8FF] selection:text-white pb-24">
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
            Política de <span className="text-gradient-ui" style={{ '--gradient-color-1': '#2BC8FF', '--gradient-color-2': '#7C3CFF' } as any}>Privacidad</span>
          </h1>
          <p className="text-zinc-400 font-mono text-sm">Última actualización: Mayo 2026</p>
        </div>

        <div className="space-y-12 text-zinc-300 font-sans leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-heading text-white mb-4">1. Información que Recopilamos</h2>
            <p className="mb-4">
              En LumiAds, valoramos su privacidad. Recopilamos los siguientes tipos de información:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Información de la cuenta:</strong> Nombre, correo electrónico, nombre de la empresa y credenciales de inicio de sesión.</li>
              <li><strong>Información de pago:</strong> Datos procesados de forma segura a través de nuestro proveedor de pagos (Stripe). No almacenamos información completa de tarjetas de crédito en nuestros servidores.</li>
              <li><strong>Datos de uso:</strong> Información sobre cómo interactúa con nuestra plataforma, incluyendo registros de acceso, configuraciones de red y análisis de rendimiento de campañas.</li>
              <li><strong>Datos de dispositivos (Screens):</strong> Información de telemetría de las pantallas conectadas a nuestra red para garantizar su correcto funcionamiento y medición de impactos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">2. Uso de la Información</h2>
            <p className="mb-4">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Proporcionar, mantener y mejorar nuestros servicios de Digital Signage.</li>
              <li>Procesar transacciones y enviar avisos relacionados con pagos.</li>
              <li>Enviar soporte técnico, actualizaciones de seguridad y mensajes administrativos.</li>
              <li>Analizar tendencias y estadísticas para optimizar la entrega de contenido y los impactos publicitarios.</li>
              <li>Cumplir con nuestras obligaciones legales y prevenir fraudes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">3. Compartir Información</h2>
            <p className="mb-4">
              No vendemos ni alquilamos su información personal a terceros. Podemos compartir información en las siguientes circunstancias:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Proveedores de servicios:</strong> Compartimos datos con terceros de confianza que nos asisten en la operación de nuestra plataforma (por ejemplo, procesamiento de pagos con Stripe, servicios de alojamiento en la nube, envío de correos).</li>
              <li><strong>Cumplimiento legal:</strong> Podemos revelar información si es requerido por ley, o para proteger los derechos, la propiedad y la seguridad de LumiAds o de terceros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">4. Seguridad de los Datos</h2>
            <p className="mb-4">
              Implementamos medidas de seguridad técnicas y organizativas líderes en la industria para proteger sus datos personales contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye cifrado de datos en tránsito y en reposo, y controles de acceso estrictos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">5. Sus Derechos de Privacidad</h2>
            <p className="mb-4">
              Dependiendo de su jurisdicción, usted puede tener derecho a acceder, corregir, actualizar o solicitar la eliminación de su información personal. Para ejercer estos derechos, por favor contáctenos a través de los canales proporcionados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">6. Cookies y Tecnologías Similares</h2>
            <p className="mb-4">
              Utilizamos cookies y tecnologías de seguimiento para mejorar la experiencia del usuario, analizar el tráfico y personalizar el contenido. Puede gestionar sus preferencias de cookies a través de la configuración de su navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading text-white mb-4">7. Contacto</h2>
            <p className="mb-4">
              Para cualquier consulta relacionada con nuestra Política de Privacidad o el manejo de sus datos, puede escribirnos a <a href="mailto:privacy@lumiads.app" className="text-[#2BC8FF] hover:underline">privacy@lumiads.app</a>.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
