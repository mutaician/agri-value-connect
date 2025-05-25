import { createBrowserClient } from '@supabase/ssr'

// Helper to check if code is running in browser environment
const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

export function createSupabaseBrowserClient() {
  // Create Supabase client with appropriate cookie handling based on environment
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Only apply custom cookie handling when in a browser environment
      cookies: isBrowser() 
        ? {
            get(name) {
              return document.cookie
                .split('; ')
                .find((cookie) => cookie.startsWith(`${name}=`))
                ?.split('=')[1]
            },
            set(name, value, options) {
              // Only set secure cookies in production
              const isProduction = process.env.NODE_ENV === 'production'
              document.cookie = `${name}=${value}; path=/; ${
                isProduction ? 'secure; ' : ''
              }${options?.sameSite ? `samesite=${options.sameSite}; ` : ''}${
                options?.domain ? `domain=${options.domain}; ` : ''
              }${
                options?.maxAge
                  ? `max-age=${options.maxAge}; `
                  : ''
              }`
            },
            remove(name, options) {
              document.cookie = `${name}=; path=/; ${
                options?.domain ? `domain=${options.domain}; ` : ''
              }max-age=0`
            }
          }
        : {
            get: () => '',
            set: () => {},
            remove: () => {}
          }
    }
  )
} 