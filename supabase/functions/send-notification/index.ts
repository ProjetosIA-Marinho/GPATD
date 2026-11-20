import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

// Escapa HTML para impedir injeção nos e-mails (phishing/marcação arbitrária).
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Só aceita URLs http/https (bloqueia javascript:, data:, etc.).
function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  try {
    // 1. Autenticação: só usuários logados podem disparar e-mails.
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: "Serviço indisponível." }, 500);
    }
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return json({ error: "Não autorizado." }, 401);
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "Não autorizado." }, 401);
    }

    // 2. Entrada
    const {
      to, name, patdNumber, documentUrl, documentName,
      senderPhone, senderExtension, senderEmail, subject, body,
    } = await req.json();

    if (!isValidEmail(to)) {
      return json({ error: "Destinatário inválido." }, 400);
    }
    if (!patdNumber && !subject) {
      return json({ error: "Informe patdNumber ou subject." }, 400);
    }
    if (!RESEND_API_KEY) {
      return json({ error: "Serviço de e-mail não configurado." }, 500);
    }

    const emailSubject = String(subject || `Novo Processo PATD Atribuído - Nº ${patdNumber ?? ""}`)
      .replace(/[\r\n]+/g, " ")
      .slice(0, 200);

    let emailHtml = "";

    if (body) {
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #334155; line-height: 1.6;">
          <div style="white-space: pre-wrap;">${esc(body)}</div>

          <p style="margin: 25px 0 10px 0;"><a href="https://www.gpatdafa.com" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 600;">www.gpatdafa.com</a></p>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">GPATD - Sistema de Apuração de Transgressão Disciplinar</p>
        </div>
      `;
    } else {
      const safeDocUrl = safeHttpUrl(documentUrl);
      const docSection = safeDocUrl
        ? `
          <div style="margin: 25px 0; text-align: center;">
            <a href="${esc(safeDocUrl)}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
              Visualizar Documento Anexo (${esc(documentName || "PDF")})
            </a>
          </div>
        `
        : "";

      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #334155; line-height: 1.6;">
          <p>Olá, <strong>${esc(name || "Apurador")}</strong>,</p>
          <p>Informamos que um novo Processo de Apuração de Transgressão Disciplinar (PATD), foi aberto e atribuído a você para apuração.</p>
          <p><strong>Número do PATD:</strong> ${esc(patdNumber)}</p>

          ${docSection}

          <p>Por favor, acesse o sistema GPATD para visualizar os detalhes completos e dar andamento ao processo.</p>

          <p style="margin: 15px 0 10px 0;"><a href="https://www.gpatdafa.com" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 600;">www.gpatdafa.com</a></p>

          <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
            <strong>Telefone:</strong> ${esc(senderPhone || "—")}<br/>
            <strong>Ramal:</strong> ${esc(senderExtension || "—")}<br/>
            <strong>E-mail:</strong> ${esc(senderEmail || "—")}
          </p>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">GPATD - Sistema de Apuração de Transgressão Disciplinar</p>
        </div>
      `;
    }

    // 3. Envio via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GPATD <nao-responder@gpatdafa.com>",
        to: [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      console.error("Resend error:", await response.text());
      return json({ error: "Falha ao enviar o e-mail." }, 502);
    }

    const result = await response.json();
    return json({ success: true, id: result?.id ?? null }, 200);
  } catch (error) {
    console.error("send-notification error:", error);
    return json({ error: "Falha ao processar a solicitação." }, 500);
  }
});
