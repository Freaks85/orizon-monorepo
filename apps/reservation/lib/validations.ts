import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Email invalide').toLowerCase().trim();

// Phone validation (French format)
export const phoneSchema = z.string()
    .regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, 'Numéro de téléphone invalide')
    .transform(val => val.replace(/[\s.-]/g, ''));

// Reservation schema
export const reservationSchema = z.object({
    slug: z.string().min(1, 'Restaurant slug requis').max(100),
    reservation_date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
        .refine(val => {
            const date = new Date(val);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date >= today;
        }, 'La date ne peut pas être dans le passé'),
    reservation_time: z.string()
        .regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM)'),
    party_size: z.number()
        .int('Le nombre de personnes doit être un entier')
        .min(1, 'Minimum 1 personne')
        .max(50, 'Maximum 50 personnes'),
    customer_name: z.string()
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(100, 'Le nom est trop long')
        .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides')
        .trim(),
    customer_email: emailSchema,
    customer_phone: phoneSchema.optional(),
    notes: z.string()
        .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
        .trim()
        .optional(),
    service_id: z.string().uuid('Service ID invalide'),
    table_id: z.string().uuid('Table ID invalide').optional(),
    room_id: z.string().uuid('Room ID invalide').optional(),
});

// Invitation schema
export const invitationSchema = z.object({
    email: emailSchema,
    role: z.enum(['admin', 'manager', 'staff'], {
        errorMap: () => ({ message: 'Rôle invalide' })
    }),
    restaurant_id: z.string().uuid('Restaurant ID invalide'),
});

// Member deletion schema
export const memberDeletionSchema = z.object({
    id: z.string().uuid('Member ID invalide'),
});

// Settings update schema
export const settingsSchema = z.object({
    name: z.string().min(1, 'Le nom est requis').max(100).optional(),
    slug: z.string()
        .min(3, 'Le slug doit contenir au moins 3 caractères')
        .max(100)
        .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets')
        .optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    address: z.string().max(200).trim().optional(),
    city: z.string().max(100).trim().optional(),
    postal_code: z.string()
        .regex(/^\d{5}$/, 'Code postal invalide (5 chiffres)')
        .optional(),
    country: z.string().max(100).optional(),
    description: z.string().max(1000).trim().optional(),
    website: z.string().url('URL invalide').optional().or(z.literal('')),
});

// Service creation schema
export const serviceSchema = z.object({
    name: z.string().min(1, 'Le nom est requis').max(100).trim(),
    description: z.string().max(500).trim().optional(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide'),
    days_of_week: z.array(z.number().int().min(0).max(6))
        .min(1, 'Au moins un jour doit être sélectionné'),
    is_active: z.boolean().optional(),
});

// Room schema
export const roomSchema = z.object({
    name: z.string().min(1, 'Le nom est requis').max(100).trim(),
    description: z.string().max(500).trim().optional(),
    capacity: z.number().int().min(1).max(500),
    is_active: z.boolean().optional(),
});

// Table schema
export const tableSchema = z.object({
    number: z.string().min(1, 'Le numéro est requis').max(20).trim(),
    capacity: z.number().int().min(1).max(20),
    room_id: z.string().uuid('Room ID invalide'),
    is_active: z.boolean().optional(),
});

// Sanitize HTML to prevent XSS
export function sanitizeHtml(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Rate limiting helper (simple in-memory implementation)
// For production, use Redis or Upstash
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
    key: string,
    maxRequests: number = 10,
    windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
        for (const [k, v] of rateLimitMap.entries()) {
            if (v.resetAt < now) {
                rateLimitMap.delete(k);
            }
        }
    }

    if (!record || record.resetAt < now) {
        // New window
        const resetAt = now + windowMs;
        rateLimitMap.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}
