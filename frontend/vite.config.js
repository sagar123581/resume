import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Local development settings
  server: {
    host: true,       // Allows access from network devices
    port: 5173,       // Default Vite port
    https: false,     // Disable HTTPS for local development
    strictPort: true, // Exit if port is in use
    open: true        // Automatically open browser
  },
  // Production build settings
  build: {
    outDir: 'dist',   // Netlify publish directory
    emptyOutDir: true, // Clear dist folder before build
    sourcemap: true,  // Generate source maps
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  // Base path for production (if deploying to subdirectory)
  base: '/',
  // Preview settings (what runs after 'npm run preview')
  preview: {
    port: 5173,
    strictPort: true
  }
});