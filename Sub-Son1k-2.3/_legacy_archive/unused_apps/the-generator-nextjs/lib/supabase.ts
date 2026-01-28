import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://swbnenfucupmtpihmmht.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ym5lbmZ1Y3VwbXRwaWhtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAyNzgsImV4cCI6MjA3NTIzNjI3OH0.7TFVQkfSJAyTWsPcOTcbqBTDw2grBYxHMw9UVtpt6-I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

