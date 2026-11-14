import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _cachedClient: SupabaseClient | null = null;
let _cachedServiceClient: SupabaseClient | null = null;
let _tablesAvailable: boolean | null = null;
let _lastHealthCheck = 0;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      anonKey &&
      url.startsWith("https://") &&
      !url.includes("your-project-id") &&
      anonKey !== "your-supabase-anon-public-key"
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!_cachedClient) {
    _cachedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _cachedClient;
}

export function getSupabaseServiceClient(): SupabaseClient | null {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  if (!_cachedServiceClient) {
    _cachedServiceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return _cachedServiceClient;
}

/**
 * Checks if the Supabase database tables have been migrated and are reachable.
 * Caches the result for 60 seconds to avoid repetitive network overhead.
 */
export async function checkSupabaseHealth(): Promise<{
  configured: boolean;
  connected: boolean;
  tablesReady: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      tablesReady: false,
      message: "Supabase credentials are not configured in environment.",
    };
  }

  const now = Date.now();
  if (_tablesAvailable !== null && now - _lastHealthCheck < 60000) {
    return {
      configured: true,
      connected: true,
      tablesReady: _tablesAvailable,
      message: _tablesAvailable
        ? "Supabase PostgreSQL connected and schema ready."
        : "Supabase connection active, but schema migration 002 is pending.",
    };
  }

  const client = getSupabaseServiceClient() || getSupabaseClient();
  if (!client) {
    return {
      configured: false,
      connected: false,
      tablesReady: false,
      message: "Unable to initialize Supabase client.",
    };
  }

  try {
    const { data, error } = await client
      .from("academic_domains")
      .select("id")
      .limit(1);

    _lastHealthCheck = now;
    if (error) {
      _tablesAvailable = false;
      return {
        configured: true,
        connected: true,
        tablesReady: false,
        message: `Connected to Supabase, but tables not yet initialized: ${error.message}`,
      };
    }

    _tablesAvailable = true;
    return {
      configured: true,
      connected: true,
      tablesReady: true,
      message: "Supabase PostgreSQL connected and operational.",
    };
  } catch (err: unknown) {
    _tablesAvailable = false;
    _lastHealthCheck = now;
    return {
      configured: true,
      connected: false,
      tablesReady: false,
      message: `Failed to reach Supabase: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}


