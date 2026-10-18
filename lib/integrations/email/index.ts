import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_SERVER_HOST &&
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD &&
      process.env.EMAIL_FROM
  );
}

function createTransport(): Transporter {
  const port = Number(process.env.EMAIL_SERVER_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

export async function sendEmail(input: SendEmailInput): Promise<{ messageId: string }> {
  if (!isEmailConfigured()) {
    throw new Error('Email is not configured (EMAIL_SERVER_HOST/USER/PASSWORD/FROM)');
  }

  const info = await createTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    attachments: input.attachments,
  });

  return { messageId: info.messageId };
}
