import { getCsrfTokenHandler } from '@/lib/csrf';

export async function GET() {
    return getCsrfTokenHandler();
}
