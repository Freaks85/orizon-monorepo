# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Orizon** is a Turborepo monorepo containing two SaaS applications for restaurant management, built with Next.js 16, React 19, TypeScript, and Supabase:

1. **Kitchen** (port 3001) - HACCP food safety management system
2. **Reservation** (port 3002) - Table reservation and booking system
3. **Landing** (port 3000) - Marketing website

Both apps share a common multi-tenant Supabase database with restaurant-based isolation.

## Development Commands

### Monorepo Commands
```bash
npm run dev                    # Start all apps
npm run dev:kitchen           # Start kitchen app only (port 3001)
npm run dev:reservation       # Start reservation app only (port 3002)
npm run dev:landing           # Start landing page only (port 3000)
npm run build                 # Build all apps
npm run lint                  # Lint all apps
npm run clean                 # Clean build artifacts
npm run db:migrate            # Apply Supabase migrations
```

### Individual App Commands
Each app has standard Next.js commands:
```bash
cd apps/kitchen
npm run dev                   # Starts on configured port
npm run build
npm run lint
```

## Monorepo Architecture

### Workspace Structure
```
orizon/
├── apps/
│   ├── kitchen/              # HACCP food safety app
│   ├── reservation/          # Reservation system app
│   └── landing/              # Marketing landing page
├── packages/
│   ├── database/             # Shared Supabase client & types
│   ├── ui/                   # Shared UI components
│   └── config/               # Shared configurations
├── supabase/
│   └── migrations/           # Database migrations
└── turbo.json                # Turborepo configuration
```

### Shared Packages

#### @orizon/database
Location: `packages/database/`

Exports:
- `supabase` - Typed Supabase client from `@orizon/database/client`
- `Database` types - TypeScript types from `@orizon/database/types`
- React hooks - Custom hooks from `@orizon/database/hooks`

Usage in apps:
```typescript
import { supabase } from '@orizon/database/client';
import type { Database } from '@orizon/database/types';
import { useRestaurant } from '@orizon/database/hooks';
```

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### @orizon/ui
Location: `packages/ui/`

Shared React components:
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `modal.tsx`
- `badge.tsx`

Usage:
```typescript
import { Button, Card } from '@orizon/ui';
```

### Multi-Tenant Architecture

Both apps share the same Supabase database with restaurant-based multi-tenancy:

- **Central tables**: `restaurants`, `restaurant_members`
- **Tenant isolation**: All data tables include `restaurant_id` foreign key
- **RLS policies**: Row Level Security enforces access control
- **User roles**: `owner`, `admin`, `manager`, `staff`

Key context providers (implemented per app):
- `RestaurantProvider` - Manages active restaurant selection
- `EmployeeProvider` (Kitchen only) - Manages active employee for kiosk mode
- `AlertWorkflowProvider` (Kitchen only) - Manages alert workflows

## Kitchen App (port 3001)

HACCP food safety management with modules:
- **Temperatures** - Zone temperature monitoring with conformity checks
- **Cleaning** - Cleaning post management with frequencies (daily/weekly/monthly)
- **Traceability** - Product DLC (expiry date) tracking
- **Reception** - Supplier delivery records
- **Alerts** - Critical issues requiring action

### Key Features
- **Kiosk Mode**: Employee selection screen with PIN codes
- **Alert Workflow**: Sequential processing of critical alerts
- **Real-time Dashboard**: 15-second auto-refresh with smooth updates
- **Activity Feed**: Live log of all operations

### Database Tables
- `temperature_zones`, `temperature_logs`
- `cleaning_areas`, `cleaning_posts`, `cleaning_records`
- `dlc_products`
- `reception_records`, `suppliers`
- `employees`

## Reservation App (port 3002)

Table reservation and booking system with features:
- **Room Management** - Multiple dining rooms with grid layouts
- **Table Layout** - Visual table positioning (drag & drop)
- **Services** - Time slots (lunch, dinner) with capacities
- **Reservations** - Customer bookings with status tracking
- **Public Booking** - Customer-facing reservation page at `/[slug]`
- **Email Notifications** - Confirmation emails via Resend

### Key Features
- **Restaurant Slug**: Public URLs like `/mon-restaurant` for bookings
- **Invitation System**: Team member invitations with email verification
- **Visual Table Editor**: Grid-based table positioning
- **Status Management**: pending → confirmed → seated → completed/cancelled/no_show

### Database Tables
- `rooms` - Dining rooms with grid dimensions
- `tables` - Table entities with position, capacity, shape
- `services` - Service periods (lunch/dinner) with time slots
- `reservations` - Customer bookings
- `invitations` - Team invitations

### Public API Routes
- `/api/restaurants/[slug]` - Get restaurant info by slug
- `/api/reservations` - Create reservation (POST)

## Design System

### Color Palette
- **Neon Green**: `#00ff9d` - Primary accent, CTAs
- **Rich Black**: `#050505` - Background
- **Dark Gunmetal**: `#0a0a0a` - Card backgrounds
- **Steel Gray**: `#94a3b8` - Secondary text

### Typography
- **Display**: Oswald (headings) - `font-display`
- **Body**: Inter (text) - `font-sans`
- Convention: `uppercase` with `tracking-wider` for labels

### UI Patterns
- Dark theme with gradients
- Subtle borders: `border-white/10`
- Status colors: OK (green), WARN (yellow), CRITICAL (red)
- Framer Motion animations
- Responsive grid layouts

## Data Fetching Patterns

### Multi-Tenant Queries
Always filter by `restaurant.id`:
```typescript
const { restaurant } = useRestaurant();

const { data } = await supabase
  .from('temperature_logs')
  .select('*')
  .eq('restaurant_id', restaurant.id);
```

### Real-Time Updates (Kitchen)
Dashboard uses 15-second polling with smooth state updates:
```typescript
useEffect(() => {
  fetchData();
  const interval = setInterval(() => fetchData(true), 15000);
  return () => clearInterval(interval);
}, [restaurant?.id]);
```

Prevent flickering by comparing old/new data before setState.

## Database Migrations

### Creating Migrations
1. Create SQL file in `supabase/migrations/` with timestamp prefix
2. Name format: `YYYYMMDD_description.sql`
3. Apply with `npm run db:migrate` from root

### Migration Conventions
- Always enable RLS: `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`
- Create policies for restaurant_members access
- Add indexes on `restaurant_id` foreign keys
- Use `IF NOT EXISTS` for idempotency

Example RLS policy:
```sql
CREATE POLICY "Restaurant members can view" ON public.tables
  FOR SELECT USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid()
    )
  );
```

## Path Aliases

TypeScript path aliases configured per app:
```typescript
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useRestaurant } from '@/contexts/restaurant-context';
```

External packages use workspace protocol:
```typescript
import { supabase } from '@orizon/database/client';
import { Button } from '@orizon/ui';
```

## Authentication Flow

1. Supabase Auth handles signup/login
2. `restaurant_members` table associates users with restaurants
3. Dashboard layout checks session and redirects to `/login` if none
4. `RestaurantProvider` fetches user's restaurants on mount
5. Active restaurant stored in localStorage

## Important Implementation Notes

### Adding New Features
1. Create database tables in migration file
2. Add RLS policies with restaurant_id checks
3. Update types in `@orizon/database/types`
4. Implement UI in appropriate app
5. Use shared components from `@orizon/ui` when possible

### Multi-Tenant Checklist
- [ ] Table has `restaurant_id` column
- [ ] RLS enabled on table
- [ ] SELECT policy checks restaurant_members
- [ ] INSERT/UPDATE/DELETE policies check role permissions
- [ ] Queries filter by `restaurant.id`
- [ ] Index on `restaurant_id`

### Turborepo Cache
- Build outputs cached by Turbo
- Clean cache with `npm run clean`
- Global dependencies tracked: `.env.*local` files

### Environment Setup
Each app needs `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Reservation app also needs:
```
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

## Common Pitfalls

1. **Missing restaurant_id filter**: Always filter queries by active restaurant
2. **Missing RLS policies**: New tables need both SELECT and mutation policies
3. **Not checking restaurant context**: Verify `restaurant?.id` exists before queries
4. **Hardcoding ports**: Use configured ports (Kitchen: 3001, Reservation: 3002)
5. **Breaking workspace deps**: Don't change package exports without updating consumers
6. **Ignoring type safety**: Use `Database` types from @orizon/database
7. **Skipping indexes**: Add indexes on `restaurant_id` for query performance

## Testing Approach

1. **Multi-tenancy**: Test with multiple restaurants, verify isolation
2. **Permissions**: Test with different roles (owner/admin/manager/staff)
3. **Real-time updates**: Verify 15s refresh works without flicker (Kitchen)
4. **Public access**: Test reservation booking flow without auth (Reservation)
5. **Responsive design**: Test on mobile/tablet/desktop breakpoints
6. **Email notifications**: Test invitation and confirmation emails (Reservation)

## Deployment

Both apps are deployed separately on Vercel:
- Build command: `npm run build`
- Each app builds independently via Turborepo
- Shared packages (`@orizon/database`, `@orizon/ui`) built as dependencies
- Environment variables configured per deployment
