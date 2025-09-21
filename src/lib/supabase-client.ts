import {
        createClient,
        type AuthError,
        type PostgrestError,
        type PostgrestMaybeSingleResponse,
        type PostgrestResponse,
        type PostgrestSingleResponse,
        type SupabaseClient,
} from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
let supabaseUserId: string | null = null;
let ensureUserPromise: Promise<string | null> | null = null;
let lastAuthError: Error | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Supabase environment variables are not configured.");
} else {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: { persistSession: false },
        });

        supabase.auth.onAuthStateChange((_event, session) => {
                supabaseUserId = session?.user?.id ?? null;
                if (supabaseUserId) {
                        lastAuthError = null;
                }
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

const toAuthError = (error: AuthError) => {
        const authError = new Error(error.message);
        authError.name = "SupabaseAuthError";
        return authError;
};

const ensureSupabaseUser = async (): Promise<string | null> => {
        if (!supabase) {
                lastAuthError = new Error("Supabase environment variables are not configured.");
                return null;
        }

        if (supabaseUserId) return supabaseUserId;

        if (!ensureUserPromise) {
                const promise = (async () => {
                        try {
                                const { data, error } = await supabase!.auth.getSession();
                                if (error) {
                                        lastAuthError = toAuthError(error);
                                        console.error("Failed to retrieve Supabase session", error);
                                        return null;
                                }

                                const existingUserId = data.session?.user?.id ?? null;
                                if (existingUserId) {
                                        supabaseUserId = existingUserId;
                                        lastAuthError = null;
                                        return existingUserId;
                                }

                                const { data: signInData, error: signInError } = await supabase!.auth.signInAnonymously();
                                if (signInError) {
                                        lastAuthError = toAuthError(signInError);
                                        console.error("Failed to sign in anonymously with Supabase", signInError);
                                        return null;
                                }

                                const anonymousUserId =
                                        signInData.user?.id ?? signInData.session?.user?.id ?? null;
                                if (!anonymousUserId) {
                                        lastAuthError = new Error(
                                                "Supabase anonymous sign-in did not return a user identifier.",
                                        );
                                        console.error(lastAuthError.message);
                                        return null;
                                }

                                supabaseUserId = anonymousUserId;
                                lastAuthError = null;
                                return anonymousUserId;
                        } catch (error) {
                                lastAuthError = error instanceof Error ? error : new Error(String(error));
                                console.error("Unexpected Supabase auth error", error);
                                return null;
                        }
                })();

                ensureUserPromise = promise.finally(() => {
                        if (ensureUserPromise === promise) {
                                ensureUserPromise = null;
                        }
                });
        }

        return ensureUserPromise;
};

export const getSupabaseUserId = async () => ensureSupabaseUser();

export const getSupabaseAuthError = () => lastAuthError;

export const supabaseRequest = async <T>(
        callback: (client: SupabaseClient) => Promise<PostgrestResult<T>>,
): Promise<SupabaseResponse<T>> => {
        if (!supabase) {
                return {
                        data: null,
                        error: new Error("Supabase environment variables are not configured."),
                };
        }

        const userId = await ensureSupabaseUser();
        if (!userId) {
                return {
                        data: null,
                        error:
                                lastAuthError ??
                                new Error(
                                        "Unable to authenticate with Supabase. Please verify your authentication settings.",
                                ),
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
