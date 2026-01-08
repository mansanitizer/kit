import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://rgizekzedmzekrikqjyc.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnaXpla3plZG16ZWtyaWtxanljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTUzNTgsImV4cCI6MjA4MzI5MTM1OH0.ZFUIOdCedS3yr_kOvqwmxpyEYYnrd4Jt5C6NzYJiANU"

// Create a FRESH client for the API route context to ensure no shared state issues
// Create a FRESH client for the API route context to ensure no shared state issues
export function createServerClient(headers?: Record<string, string>) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    return createClient(supabaseUrl, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        },
        global: {
            headers: headers
        }
    })
}
