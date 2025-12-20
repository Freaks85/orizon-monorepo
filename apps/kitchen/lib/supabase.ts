
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ukdteclknzhbgizrqnbh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZHRlY2xrbnpoYmdpenJxbmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTc5NjYsImV4cCI6MjA4MDQ5Mzk2Nn0.MX3GEQH3UX8JjqINhNhzRXgtYUG3nq7e9Lmx9zlh0Jw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
