// Type definitions for import.meta.env

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
