"use client";

import { createClient } from "@supabase/supabase-js";

// Hardcoded values for testing - replace with environment variables later
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xyggcfwbqqjlnkbbrfrh.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2djZndicXFqbG5rYmJyZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwODQ2MzMsImV4cCI6MjA3MTY2MDYzM30.BBrEpVQ9k5tgPM5hH2H7oMcmsiIWCAeN1Ahz5iD9W8g";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});


