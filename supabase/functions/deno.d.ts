// Deno type declarations for Supabase Edge Functions
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined
    }
  }
}

// Deno standard library types
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void
}

// Supabase types
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any
}

// Allow any other remote imports to type-check without errors in editors
declare module "https://deno.land/*" {
  const anyExport: any
  export = anyExport
}
declare module "https://esm.sh/*" {
  const anyExport: any
  export = anyExport
}

export {}
