import {
        createClient,
        type PostgrestError,
        type PostgrestMaybeSingleResponse,
        type PostgrestResponse,
        type PostgrestSingleResponse,
        type SupabaseClient,
} from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Supabase environment variables are not configured.");
} else {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: { persistSession: false },
        });
}

type PostgrestResult<T> =
        | PostgrestResponse<T>
        | PostgrestSingleResponse<T>
        | PostgrestMaybeSingleResponse<T>;

export interface SupabaseResponse<T> {
        data: T | null;
        error: Error | null;
}

const toError = (error: PostgrestError) => {
        const details = error.details ? `: ${error.details}` : "";
        const supabaseError = new Error(`${error.message}${details}`);
        supabaseError.name = "SupabaseError";
        return supabaseError;
};

export const supabaseRequest = async <T>(
        callback: (client: SupabaseClient) => Promise<PostgrestResult<T>>,
): Promise<SupabaseResponse<T>> => {
        if (!supabase) {
                return {
                        data: null,
                        error: new Error("Supabase environment variables are not configured."),
                };
        }

        try {
                const result = await callback(supabase);
                if (result.error) {
                        return { data: null, error: toError(result.error) };
                }

                return { data: (result.data as T) ?? null, error: null };
        } catch (error) {
                return { data: null, error: error as Error };
        }
};

// Temporary debug: print envs to help diagnose getaddrinfo ENOTFOUND
(function debugEnv() {
  try {
    const keys = ['VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const proxyKeys = ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','NO_PROXY','no_proxy'];
    const env = Object.fromEntries(keys.map(k => [k, process.env[k] || null]));
    const proxies = Object.fromEntries(proxyKeys.map(k => [k, process.env[k] || null]));
    console.error('DEBUG supabase env:', env);
    console.error('DEBUG proxy env:', proxies);
  } catch (e) {
    console.error('DEBUG env read failed', e);
  }
})();
