-- =====================================================
-- MIGRATION: Reservation System for OrizonsReservation
-- =====================================================

-- Add slug column to restaurants if not exists
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slugs for existing restaurants
UPDATE public.restaurants
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g'))
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);

-- =====================================================
-- 1. Rooms Table (Salles du restaurant)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  grid_width INT DEFAULT 10,
  grid_height INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant members can view rooms" ON public.rooms
  FOR SELECT USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant admins can manage rooms" ON public.rooms
  FOR ALL USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid() AND rm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE INDEX IF NOT EXISTS idx_rooms_restaurant ON public.rooms(restaurant_id);

-- =====================================================
-- 2. Tables Table (Tables dans les salles)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  table_number TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 2,
  position_x INT NOT NULL DEFAULT 0,
  position_y INT NOT NULL DEFAULT 0,
  width INT DEFAULT 1,
  height INT DEFAULT 1,
  shape TEXT DEFAULT 'square' CHECK (shape IN ('square', 'round', 'rectangle')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, table_number)
);

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant members can view tables" ON public.tables
  FOR SELECT USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant admins can manage tables" ON public.tables
  FOR ALL USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid() AND rm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE INDEX IF NOT EXISTS idx_tables_room ON public.tables(room_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON public.tables(restaurant_id);

-- =====================================================
-- 3. Services Table (Services: dejeuner, diner, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_covers INT NOT NULL DEFAULT 20,
  days_of_week INT[] DEFAULT '{1,2,3,4,5,6,0}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant members can view services" ON public.services
  FOR SELECT USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Restaurant admins can manage services" ON public.services
  FOR ALL USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid() AND rm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE INDEX IF NOT EXISTS idx_services_restaurant ON public.services(restaurant_id);

-- =====================================================
-- 4. Reservations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,

  -- Reservation details
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INT NOT NULL,
  duration_minutes INT DEFAULT 90,

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Status and notes
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  internal_notes TEXT,

  -- Tracking
  confirmed_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant members can view reservations" ON public.reservations
  FOR SELECT USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant members can manage reservations" ON public.reservations
  FOR ALL USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create reservations" ON public.reservations
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant ON public.reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- =====================================================
-- 5. Restaurant Reservation Settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.restaurant_reservation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Public page settings
  is_enabled BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,

  -- Theme customization
  primary_color TEXT DEFAULT '#00ff9d',
  secondary_color TEXT DEFAULT '#0a0a0a',
  accent_color TEXT DEFAULT '#ffffff',

  -- Booking settings
  min_party_size INT DEFAULT 1,
  max_party_size INT DEFAULT 20,
  advance_booking_days INT DEFAULT 30,
  min_notice_hours INT DEFAULT 2,

  -- Messages
  welcome_message TEXT,
  confirmation_message TEXT,

  -- Contact info override
  display_phone TEXT,
  display_email TEXT,
  display_address TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.restaurant_reservation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view enabled settings" ON public.restaurant_reservation_settings
  FOR SELECT USING (is_enabled = true);

CREATE POLICY "Restaurant admins can manage settings" ON public.restaurant_reservation_settings
  FOR ALL USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid() AND rm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE INDEX IF NOT EXISTS idx_reservation_settings_slug ON public.restaurant_reservation_settings(slug);

-- =====================================================
-- 6. Special Dates (Holidays, Closures)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.special_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('closed', 'holiday', 'special_hours', 'special_event')),
  name TEXT,
  description TEXT,
  custom_services JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view special dates" ON public.special_dates
  FOR SELECT USING (true);

CREATE POLICY "Restaurant admins can manage special dates" ON public.special_dates
  FOR ALL USING (
    restaurant_id IN (
      SELECT rm.restaurant_id FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid() AND rm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE INDEX IF NOT EXISTS idx_special_dates_restaurant_date ON public.special_dates(restaurant_id, date);

-- =====================================================
-- 7. Function: Get available covers for a service
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_available_covers(
  p_restaurant_id UUID,
  p_service_id UUID,
  p_date DATE
)
RETURNS INT AS $$
DECLARE
  v_max_covers INT;
  v_reserved_covers INT;
BEGIN
  SELECT max_covers INTO v_max_covers
  FROM public.services
  WHERE id = p_service_id AND restaurant_id = p_restaurant_id;

  SELECT COALESCE(SUM(party_size), 0) INTO v_reserved_covers
  FROM public.reservations
  WHERE restaurant_id = p_restaurant_id
    AND service_id = p_service_id
    AND reservation_date = p_date
    AND status IN ('pending', 'confirmed');

  RETURN v_max_covers - v_reserved_covers;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 8. Trigger: Auto-create reservation settings on restaurant creation
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_default_reservation_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.restaurant_reservation_settings (restaurant_id, slug)
  VALUES (NEW.id, lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]', '-', 'g')))
  ON CONFLICT (restaurant_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_restaurant_created_reservation_settings ON public.restaurants;
CREATE TRIGGER on_restaurant_created_reservation_settings
  AFTER INSERT ON public.restaurants
  FOR EACH ROW EXECUTE PROCEDURE public.create_default_reservation_settings();

-- =====================================================
-- 9. Enable Realtime for reservations
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
