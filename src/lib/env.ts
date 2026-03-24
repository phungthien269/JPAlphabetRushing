function getEnvValue(key: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY" | "VITE_APP_URL" | "VITE_AGENTATION_ENDPOINT") {
  const metaEnv = import.meta.env as Record<string, unknown>;
  const value = metaEnv[key];
  return typeof value === "string" ? value : "";
}

export const env = {
  supabaseUrl: getEnvValue("VITE_SUPABASE_URL"),
  supabaseAnonKey: getEnvValue("VITE_SUPABASE_ANON_KEY"),
  appUrl: getEnvValue("VITE_APP_URL") || window.location.origin,
  agentationEndpoint: getEnvValue("VITE_AGENTATION_ENDPOINT"),
};

export const hasSupabaseEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey);
