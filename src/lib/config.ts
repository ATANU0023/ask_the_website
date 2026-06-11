function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  databaseUrl: requireEnv("DATABASE_URL"),
  authSecret: requireEnv("AUTH_SECRET"),
  authGoogleId: requireEnv("AUTH_GOOGLE_ID"),
  authGoogleSecret: requireEnv("AUTH_GOOGLE_SECRET"),
  geminiApiKey: requireEnv("GEMINI_API_KEY"),
  jinaApiKey: requireEnv("JINA_API_KEY"),
  qdrantUrl: requireEnv("QDRANT_URL"),
  qdrantApiKey: requireEnv("QDRANT_API_KEY"),
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY"),
  supabaseServiceKey: requireEnv("SUPABASE_SERVICE_KEY"),
  supabaseBucket: requireEnv("SUPABASE_BUCKET", "documents"),
  appUrl: requireEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  qdrantCollection: "workspace_documents",
  embeddingDimension: 1024,
} as const;
