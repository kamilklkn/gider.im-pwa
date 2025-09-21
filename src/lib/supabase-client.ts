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

// Avoid referencing Node-specific globals (like process.env) so the client remains browser-safe.

let supabase: SupabaseClient | null = null;
let supabaseUserId: string | null = null;
let ensureUserPromise: Promise<string | null> | null = null;
let lastAuthError: Error | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Supabase environment variables are not configured.");
} else {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true,
                },
                global: {
                        headers: {
                                apikey: supabaseAnonKey,
                                Authorization: `Bearer ${supabaseAnonKey}`,
                        },
                },
        });

        if (import.meta.env.DEV) {
                // @ts-ignore - yalnızca debug amacıyla global değişken ekleniyor.
                window.supabase = supabase;
        }

        supabase.auth.onAuthStateChange((_event, session) => {
                supabaseUserId = session?.user?.id ?? null;
                ensureUserPromise = null;
                if (supabaseUserId) {
                        lastAuthError = null;
                } else {
                        lastAuthError = new Error("Supabase oturumu bulunamadı. Lütfen giriş yapın.");
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

                                lastAuthError = new Error("Supabase oturumu bulunamadı. Lütfen giriş yapın.");
                                return null;
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
                        error: lastAuthError ?? new Error("Supabase ile kimlik doğrulaması yapılamadı. Lütfen giriş yapın."),
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

export { supabase };
