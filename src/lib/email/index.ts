import { Resend } from "resend";
import { getPlatformSettings } from "@/lib/settings";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

async function sendViaResend(input: SendEmailInput, apiKey: string, fromName: string, fromAddress: string) {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${fromName} <${fromAddress}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

async function sendViaBrevo(input: SendEmailInput, apiKey: string, fromName: string, fromAddress: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: fromAddress, name: fromName },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo error (${res.status}): ${body}`);
  }
}

/**
 * Provider-agnostic transactional email sender. Reads provider + credentials
 * from platform_settings (configured by the superadmin in /admin/impostazioni),
 * falling back to env vars if not yet configured there.
 */
export async function sendEmail(input: SendEmailInput) {
  const settings = await getPlatformSettings();
  const fromAddress = settings.emailFromAddress || "no-reply@visitaup.it";

  if (settings.emailProvider === "brevo") {
    if (!settings.brevoApiKey) {
      throw new Error("Brevo non configurato: imposta la chiave API in /admin/impostazioni");
    }
    return sendViaBrevo(input, settings.brevoApiKey, settings.emailFromName, fromAddress);
  }

  if (!settings.resendApiKey) {
    throw new Error("Resend non configurato: imposta la chiave API in /admin/impostazioni");
  }
  return sendViaResend(input, settings.resendApiKey, settings.emailFromName, fromAddress);
}

export function appointmentConfirmationEmail(params: {
  patientName: string;
  doctorName: string;
  startsAt: Date;
  mode: "studio" | "online";
  address?: string;
  meetingLink?: string | null;
}) {
  const dateStr = params.startsAt.toLocaleString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const where =
    params.mode === "online"
      ? params.meetingLink
        ? `Consulenza online: <a href="${params.meetingLink}">${params.meetingLink}</a>`
        : "Consulenza online (il link verrà inviato a breve)"
      : `In studio: ${params.address ?? ""}`;

  return {
    subject: `Appuntamento confermato con ${params.doctorName}`,
    html: `
      <div style="font-family:sans-serif;line-height:1.5">
        <h2>Appuntamento confermato</h2>
        <p>Ciao ${params.patientName},</p>
        <p>Il tuo appuntamento con <strong>${params.doctorName}</strong> è confermato per:</p>
        <p><strong>${dateStr}</strong></p>
        <p>${where}</p>
        <p>A presto,<br/>VisitaUp</p>
      </div>
    `,
  };
}

export function appointmentReminderEmail(params: {
  patientName: string;
  doctorName: string;
  startsAt: Date;
  mode: "studio" | "online";
  meetingLink?: string | null;
}) {
  const dateStr = params.startsAt.toLocaleString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    subject: `Promemoria: appuntamento domani con ${params.doctorName}`,
    html: `
      <div style="font-family:sans-serif;line-height:1.5">
        <h2>Promemoria appuntamento</h2>
        <p>Ciao ${params.patientName},</p>
        <p>Ti ricordiamo l'appuntamento con <strong>${params.doctorName}</strong> il <strong>${dateStr}</strong>.</p>
        ${params.mode === "online" && params.meetingLink ? `<p>Link consulenza online: <a href="${params.meetingLink}">${params.meetingLink}</a></p>` : ""}
        <p>A presto,<br/>VisitaUp</p>
      </div>
    `,
  };
}

export function appointmentRescheduledEmail(params: {
  patientName: string;
  doctorName: string;
  startsAt: Date;
  mode: "studio" | "online";
}) {
  const dateStr = params.startsAt.toLocaleString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    subject: `Appuntamento spostato con ${params.doctorName}`,
    html: `
      <div style="font-family:sans-serif;line-height:1.5">
        <h2>Appuntamento riprogrammato</h2>
        <p>Ciao ${params.patientName},</p>
        <p>Il tuo appuntamento con <strong>${params.doctorName}</strong> è stato spostato a:</p>
        <p><strong>${dateStr}</strong></p>
        <p>${params.mode === "online" ? "Consulenza online" : "In studio"}</p>
        <p>A presto,<br/>VisitaUp</p>
      </div>
    `,
  };
}

export function doctorInviteEmail(params: { inviteUrl: string; fullName?: string | null }) {
  return {
    subject: "Sei stato invitato su VisitaUp",
    html: `
      <div style="font-family:sans-serif;line-height:1.5">
        <h2>Benvenuto/a su VisitaUp</h2>
        <p>Ciao ${params.fullName ?? ""},</p>
        <p>Sei stato invitato ad attivare il tuo profilo professionale su VisitaUp.</p>
        <p><a href="${params.inviteUrl}">Completa la registrazione</a></p>
        <p>Il link è valido per 14 giorni.</p>
      </div>
    `,
  };
}
