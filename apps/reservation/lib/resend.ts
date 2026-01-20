import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Email functionality will be disabled.');
}

export const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export const DOMAIN = 'orizonsapp.com';

export function getFromEmail(slug: string): string {
    return `reservation-${slug}@${DOMAIN}`;
}
