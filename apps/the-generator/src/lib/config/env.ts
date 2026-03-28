/**
 * Environment Variables Validation
 * Validates required environment variables at startup
 */

// Required environment variables for The Generator
const requiredEnvVars = [
  'VITE_BACKEND_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
] as const;

// Optional environment variables
const optionalEnvVars = [
  'VITE_TRANSLATION_API_URL'
] as const;

type RequiredEnvVar = typeof requiredEnvVars[number];
type OptionalEnvVar = typeof optionalEnvVars[number];

interface EnvConfig {
  backendUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  translationApiUrl?: string;
}

/**
 * Validate and return environment configuration
 * Throws error if required variables are missing
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = [];

  // Check required variables
  requiredEnvVars.forEach((varName) => {
    if (!import.meta.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env.local file or environment configuration.`
    );
  }

  // Build config object
  const config: EnvConfig = {
    backendUrl: import.meta.env.VITE_BACKEND_URL,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  // Add optional variables if present
  optionalEnvVars.forEach((varName) => {
    const value = import.meta.env[varName];
    if (value) {
      const key = varName
        .replace('VITE_', '')
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        .replace(/^[a-z]/, (letter) => letter.toLowerCase()) as keyof EnvConfig;
      
      (config as any)[key] = value;
    }
  });

  return config;
}

// Export validated config
export const config = validateEnv();

// Export individual values for convenience
export const {
  backendUrl,
  supabaseUrl,
  supabaseAnonKey,
  translationApiUrl
} = config;

