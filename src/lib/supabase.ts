// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

if (process.env.NODE_ENV !== "production") {
  console.log("[supabase client] URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
}