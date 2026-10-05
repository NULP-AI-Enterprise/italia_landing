/**
 * E-mail about form requests (server only), over SMTP so any mailbox works:
 * the association's own mail server, Google Workspace, Resend SMTP…
 *
 * SMTP_HOST, SMTP_PORT (587, or 465 for SSL), SMTP_USER, SMTP_PASS,
 * MAIL_FROM ("Made in Ukraine for Italy <site@madeinukraine.it>"),
 * MAIL_TO (association inbox: "Join" requests, and "Contact" when the person has no e-mail),
 * MAIL_BCC (optional copy of every request).
 * Without SMTP_HOST nothing is sent; requests are still stored in the CRM.
 */
import nodemailer from "nodemailer";

export type RequestMail = {
  kind: "join" | "contact";
  contactName: string;
  companyName: string;
  phone: string;
  email: string;
  message: string;
  locale: string;
  /** Team member the visitor wrote to. */
  recipient?: { name: string; email?: string } | null;
};

export type MailResult = { sent: true; to: string } | { sent: false; reason: string };

let transport: nodemailer.Transporter | undefined;

function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  transport ??= nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export async function sendRequestMail(request: RequestMail): Promise<MailResult> {
  const mailer = getTransport();
  if (!mailer) return { sent: false, reason: "SMTP не налаштовано" };

  const to = (request.kind === "contact" && request.recipient?.email) || process.env.MAIL_TO;
  if (!to) return { sent: false, reason: "Немає адреси отримувача (MAIL_TO)" };

  const subject =
    request.kind === "contact"
      ? `Повідомлення з сайту для ${request.recipient?.name ?? "команди"} від ${request.contactName}`
      : `Заявка на вступ: ${request.companyName} (${request.contactName})`;
  const rows: [string, string][] = [
    ["Контактна особа", request.contactName],
    ["Компанія", request.companyName],
    ["Телефон", request.phone],
    ["Е-мейл", request.email],
    ["Мова сайту", request.locale === "it" ? "італійська" : "українська"],
  ];
  const intro =
    request.kind === "contact"
      ? `Вам написали через кнопку «Зв’язатися» на сторінці «Команда» сайту Made in Ukraine for Italy.`
      : `Нова заявка через форму «Приєднатися» на сайті Made in Ukraine for Italy.`;

  const text = [
    intro,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Повідомлення:",
    request.message,
    "",
    "Щоб відповісти, просто натисніть «Відповісти»: лист піде відправнику.",
  ].join("\n");

  const html = `<p>${escapeHtml(intro)}</p>
<table cellpadding="6" style="border-collapse:collapse;font:15px/1.5 sans-serif">
${rows.map(([label, value]) => `<tr><td style="color:#566079">${escapeHtml(label)}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`).join("\n")}
</table>
<p style="font:15px/1.5 sans-serif"><strong>Повідомлення:</strong><br>${escapeHtml(request.message).replace(/\n/g, "<br>")}</p>
<p style="font:13px/1.5 sans-serif;color:#566079">Щоб відповісти, натисніть «Відповісти»: лист піде відправнику.</p>`;

  try {
    await mailer.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      bcc: process.env.MAIL_BCC || undefined,
      replyTo: { name: request.contactName, address: request.email },
      subject,
      text,
      html,
    });
    return { sent: true, to };
  } catch (error) {
    console.error("Request e-mail failed", error);
    return { sent: false, reason: error instanceof Error ? error.message.slice(0, 300) : "Помилка SMTP" };
  }
}
