// Injected by each consuming app's vite.config.ts via `define: { __APP_VERSION__ }`.
declare const __APP_VERSION__: string;

// Injected by each consuming app's vite.config.ts via `define: { __BUILD_DATE__ }`.
// ISO 8601 string stamped at build time. Falls back to 'dev' when undefined.
declare const __BUILD_DATE__: string;
