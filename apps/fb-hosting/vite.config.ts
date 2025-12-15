/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(() => {
    const isWatch = process.argv.includes('--watch');

    return {
        plugins: [react(), tailwindcss()],
        build: {
            outDir: 'build', // Match firebase.json
            watch: isWatch
                ? {
                      // Prevent infinite loops if build artifacts or logs change
                      exclude: [
                          '**/build/**',
                          '**/dist/**',
                          '**/node_modules/**',
                          '**/.firebase/**',
                          '**/firebase-debug.log',
                      ],
                  }
                : null,
        },
        test: {
            environment: 'jsdom',
            globals: true,
        },
    };
});
