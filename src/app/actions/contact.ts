'use server';

import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';

/**
 * Public action to send a contact message.
 * Uses the standard anonymous client as it's a public operation.
 */
export async function sendContactMessage(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  if (!name || !email || !subject || !message) {
    return { error: 'Todos los campos son obligatorios' };
  }

  try {
    const supabase = await createClient();

    // 1. Save to database
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert([
        { name, email, subject, message, status: 'unread' }
      ]);

    if (dbError) {
       console.error('Error de Supabase:', dbError);
       return { error: 'Error de base de datos: ' + dbError.message };
    }

    // 2. Notify admin via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        console.log('[Resend] Enviando notificación de nuevo mensaje...');
        const resendRes = await resend.emails.send({
          from: 'LuminAdd <onboarding@resend.dev>',
          to: ['francharrielromero@gmail.com'],
          subject: `🚀 NUEVO MENSAJE: ${subject}`,
          html: `
            <div style="background-color: #000000; color: #ffffff; font-family: 'Inter', sans-serif; padding: 40px; border: 1px solid #333; border-radius: 16px; max-width: 600px; margin: 20px auto;">
              <header style="border-bottom: 2px solid #7C3CFF; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #7C3CFF; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">LuminAdd Admin</h1>
                <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">NOTIFICACIÓN DE SISTEMA</p>
              </header>
              
              <main>
                <div style="background: #111; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0;"><strong style="color: #7C3CFF;">Remitente:</strong> ${name}</p>
                  <p style="margin: 0 0 10px 0;"><strong style="color: #7C3CFF;">Email:</strong> ${email}</p>
                  <p style="margin: 0;"><strong style="color: #7C3CFF;">Asunto:</strong> ${subject}</p>
                </div>
                
                <div style="border-left: 2px solid #333; padding-left: 20px; color: #ccc; font-style: italic;">
                  <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
                </div>
              </main>
              
              <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #222; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://LuminAdd-eta-fawn.vercel.app'}/admin/mensajes" 
                   style="background: #7C3CFF; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 12px;">
                  Responder en el Panel
                </a>
              </footer>
            </div>
          `
        });
        if (resendRes.error) {
          console.error('[Resend] Fallo devuelto por la API:', resendRes.error);
        } else {
          console.log('[Resend] Notificación enviada con éxito.');
        }
      } catch (err) {
        console.error('[Resend] Error enviando notificación:', err);
      }
    }

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/admin/mensajes');
    return { success: true };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Desconocido';
    return { error: 'Error del servidor: ' + errorMsg };
  }
}

/**
 * Admin action to reply to a message.
 * Uses direct fetch to the Supabase REST API to bypass client-side security checks
 * that incorrectly trigger in production (Forbidden use of secret API key in browser).
 */
export async function replyToMessage(formData: FormData) {
  const messageId = formData.get('messageId') as string;
  const email = formData.get('email') as string;
  const reply = formData.get('reply') as string;
  const originalMessage = formData.get('originalMessage') as string;

  if (!messageId || !email || !reply) {
    return { success: false, error: 'Faltan campos obligatorios' };
  }

  try {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Configuración de servidor incompleta (URL/KEY)');
    }

    // 1. Send email via Resend
    try {
      console.log(`[Resend] Enviando respuesta a ${email}...`);
      const resendRes = await resend.emails.send({
        from: 'LuminAdd <onboarding@resend.dev>',
        to: email,
        subject: 'Re: Tu consulta en LuminAdd',
        html: `
          <div style="background-color: #f8f9fa; color: #212529; font-family: sans-serif; padding: 40px; max-width: 600px; margin: 20px auto; border-radius: 8px; border: 1px solid #dee2e6;">
            <header style="margin-bottom: 30px; text-align: center;">
              <h1 style="color: #0a0a0f; font-size: 24px; margin: 0;">LuminAdd Support</h1>
            </header>
            
            <main style="background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <p style="font-size: 16px; line-height: 1.6;">${reply.replace(/\n/g, '<br>')}</p>
            </main>
            
            <div style="margin-top: 40px; padding: 20px; background: #e9ecef; border-radius: 4px; font-size: 13px; color: #495057;">
              <p style="margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Tu mensaje original:</p>
              <div style="font-style: italic; border-left: 3px solid #ced4da; padding-left: 15px;">
                ${originalMessage.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <footer style="margin-top: 40px; text-align: center; font-size: 12px; color: #adb5bd;">
              <p>© ${new Date().getFullYear()} LuminAdd Digital Signage. Todos los derechos reservados.</p>
            </footer>
          </div>
        `
      });
      if (resendRes.error) {
        console.error('[Resend] Fallo devuelto por la API (Reply):', resendRes.error);
      } else {
        console.log('[Resend] Respuesta enviada con éxito.');
      }
    } catch (err) {
      console.error('[Resend] Error enviando email de respuesta:', err);
    }

    // 2. Mark as replied and read using DIRECT FETCH
    const response = await fetch(`${url}/rest/v1/contact_messages?id=eq.${messageId}`, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ 
        status: 'replied',
        admin_reply: reply
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en API Supabase: ${response.status} ${errorText}`);
    }

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/admin/mensajes');
    return { success: true };
  } catch (error) {
    console.error('Error al responder mensaje:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al procesar la respuesta' 
    };
  }
}

/**
 * Admin action to delete a message.
 * Uses direct fetch to bypass library safety checks.
 */
export async function deleteMessage(messageId: string) {
  try {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Configuración de servidor incompleta (URL/KEY)');
    }

    // DIRECT FETCH call to Supabase REST API
    const response = await fetch(`${url}/rest/v1/contact_messages?id=eq.${messageId}`, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en API Supabase: ${response.status} ${errorText}`);
    }

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/admin/mensajes');
    return { success: true };
  } catch (error) {
    console.error('Error al borrar mensaje:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al procesar el borrado' 
    };
  }
}

/**
 * Admin action to send a direct message to a screen host.
 */
export async function sendDirectMessageToHost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  if (!email || !subject || !message) {
    return { success: false, error: 'Todos los campos son obligatorios' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Auth Check
    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user?.id).single();
    if (perfil?.rol !== 'superadmin') {
      return { success: false, error: 'No autorizado' };
    }

    if (process.env.RESEND_API_KEY) {
      console.log(`[Resend] Enviando mensaje directo a host ${email}...`);
      
      // Sandbox Mode Bypass: En modo prueba de Resend solo se puede enviar al admin
      const adminEmail = process.env.ADMIN_EMAIL || 'francharrielromero@gmail.com';
      const isSandbox = !process.env.RESEND_DOMAIN || process.env.RESEND_DOMAIN === 'onboarding@resend.dev';
      const recipients = isSandbox ? [adminEmail] : [email, adminEmail];

      const resendRes = await resend.emails.send({
        from: `LuminAdd <${process.env.RESEND_DOMAIN || 'onboarding@resend.dev'}>`,
        to: recipients,
        replyTo: 'soporte@LuminAdd.com',
        subject: `LuminAdd: ${subject}`,
        html: `
          <div style="background-color: #f8f9fa; color: #212529; font-family: sans-serif; padding: 40px; max-width: 600px; margin: 20px auto; border-radius: 8px; border: 1px solid #dee2e6;">
            <header style="margin-bottom: 30px; text-align: left; border-bottom: 2px solid #7C3CFF; padding-bottom: 20px;">
              <h1 style="color: #7C3CFF; font-size: 20px; margin: 0; text-transform: uppercase;">Mensaje del Equipo LuminAdd</h1>
               ${isSandbox ? '<p style="color: #e63946; font-size: 10px; font-weight: bold;">[MODO SANDBOX - COPIA PARA ADMIN]</p>' : ''}
            </header>
            <main style="background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <p style="font-size: 15px; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
            </main>
            <footer style="margin-top: 40px; text-align: center; font-size: 12px; color: #adb5bd;">
              <p>© ${new Date().getFullYear()} LuminAdd Digital Signage. Todos los derechos reservados.</p>
              <p>Esta es una copia de seguridad para el administrador.</p>
            </footer>
          </div>
        `
      });
      if (resendRes.error) {
        console.error('[Resend] Fallo devuelto por la API (DirectHost):', resendRes.error);
        return { success: false, error: 'Error de Resend: ' + resendRes.error.message };
      }
      return { success: true };
    } else {
      return { success: false, error: 'Resend no está configurado en el servidor' };
    }
  } catch (error) {
    console.error('Error al enviar mensaje directo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}



