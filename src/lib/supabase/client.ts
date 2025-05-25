import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Use more specific settings for production cookie management
        get(name) {
          return document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name, value, options) {
          // Only set secure cookies in production to ensure proper behavior
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
            options?.domain ? `domain=${options.domain};` : ''
          } max-age=0`
        },
      },
    }
  )
} 