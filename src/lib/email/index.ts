import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

async function sendViaResend({ to, subject, html }: SendEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "VisitaUp <no-reply@visitaup.it>",
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

async function sendViaBrevo({ to, subject, html }: SendEmailInput) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        email: process.env.EMAIL_FROM_ADDRESS || "no-reply@visitaup.it",
        name: process.env.EMAIL_FROM_NAME || "VisitaUp",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo error (${res.status}): ${body}`);
  }
}

/**
 * Provider-agnostic transactional email sender.
 * Set EMAIL_PROVIDER=resend|brevo in env. Defaults to resend.
 */
export async function sendEmail(input: SendEmailInput) {
  const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();

  if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY && !process.env.BREVO_API_KEY) {
    console.warn("[email] Nessun provider email configurato, email non inviata:", input.subject, "->", input.to);
    return;
  }

  if (provider === "brevo") return sendViaBrevo(input);
  return sendViaResend(input);
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
