import { defineConfig, type UserConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer';
import vue from '@vitejs/plugin-vue2';
import checker from 'vite-plugin-checker';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  const config: UserConfig = {
    // https://vitejs.dev/config/shared-options.html#base
    base: './',
    // Resolver
    resolve: {
      // https://vitejs.dev/config/shared-options.html#resolve-alias
      alias: {
        // vue @ shortcut fix
        '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        // Inertia fix
        // https://github.com/vitejs/vite/issues/9395#issuecomment-1196793504
        '@inertiajs/inertia-vue': fileURLToPath(
          new URL(
            './node_modules/@inertiajs/inertia-vue/src/index.js',
            import.meta.url
          )
        ),
        ziggy: fileURLToPath(
          new URL('./vendor/tightenco/ziggy/dist/vue', import.meta.url)
        ),
      },
    },
    // https://vitejs.dev/config/#server-options
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
      host: process.env.LARAVEL_SAIL
        ? Object.values(os.networkInterfaces())
            .flat()
            .find(info => info?.internal === false)?.address
        : undefined,
      hmr: {
        host: 'localhost',
      },
    },
    plugins: [
      // Laravel Vite
      // https://laravel.com/docs/9.x/vite
      laravel({
        input: ['resources/js/app.ts'],
        refresh: true,
      }),
      // Vue2
      // https://github.com/vitejs/vite-plugin-vue2
      vue(),
      // vite-plugin-checker
      // https://github.com/fi3ework/vite-plugin-checker
      checker({
        typescript: true,
        vueTsc: false,
        eslint: {
          lintCommand: 'eslint', // for example, lint .ts & .tsx
        },
      }),
    ],
    optimizeDeps: {
      include: ['ziggy'],
    },
    // Build Options
    // https://vitejs.dev/config/#build-options
    build: {
      rollupOptions: {
        external: 'ziggy',
        output: {
          manualChunks: {
            // Split external library from transpiled code.
            vue: [
              'vue',
              // 'vue-class-component',
              // 'vue-property-decorator',
              // 'vue-router',
              // 'vuex',
              // 'vuex-persist',
              'deepmerge',
              // '@logue/vue2-helpers',
              // '@logue/vue2-helpers/vuex',
              '@logue/vue2-helpers/teleport',
            ],
            inertia: [
              '@inertiajs/inertia-vue/dist/index.js',
              '@inertiajs/inertia-vue/src',
              '@inertiajs/inertia',
              '@inertiajs/progress',
              'get-intrinsic',
              'laravel-vite-plugin/inertia-helpers/index.js',
              'nprogress',
              'object-inspect',
              'qs',
              'vendor/tightenco/ziggy/dist/vue.m.js',
              'vue-inertia-composable',
              'ziggy-js',
            ],
            misc: ['axios', 'lodash'],
          },
          plugins: [
            mode === 'analyze'
              ? // rollup-plugin-visualizer
                // https://github.com/btd/rollup-plugin-visualizer
                visualizer({
                  open: true,
                  filename: './docs/stats.html',
                  gzipSize: true,
                  brotliSize: true,
                })
              : undefined,
            /*
            // if you use Code encryption by rollup-plugin-obfuscator
            // https://github.com/getkey/rollup-plugin-obfuscator
            obfuscator({
              globalOptions: {
                debugProtection: true,
              },
            }),
            */
          ],
        },
      },
      target: 'es2021',
      minify: 'esbuild',
    },
    esbuild: {
      // Drop console when production build.
      drop: command === 'serve' ? [] : ['console'],
    },
  };

  // Write meta data.
  fs.writeFileSync(
    path.resolve(path.join(__dirname, 'resources/js/meta.ts')),
    `// This file is auto-generated by the build system.
export default {
  date: '${new Date().toISOString()}',
};`
  );

  return config;
});
