import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { transformSync } from 'esbuild';
import path from 'path';
import { defineConfig } from 'vite';

function jsxInJsPlugin() {
  return {
    name: 'jsx-in-js',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (id.includes('expo-modules-core/src/ts-declarations')) {
        return { code: 'export {};', map: null };
      }
      const cleanId = id.split('?')[0];
      if (cleanId.endsWith('.js') || cleanId.endsWith('.jsx') || cleanId.endsWith('.ts') || cleanId.endsWith('.tsx')) {
        if (
          !cleanId.includes('node_modules') ||
          cleanId.includes('node_modules/@expo') ||
          cleanId.includes('node_modules/expo') ||
          cleanId.includes('node_modules/expo-router') ||
          cleanId.includes('node_modules/react-native') ||
          cleanId.includes('node_modules/@react-navigation')
        ) {
          try {
            const isTs = cleanId.endsWith('.ts') || cleanId.endsWith('.tsx');
            const result = transformSync(code, {
              loader: isTs ? (cleanId.endsWith('.tsx') ? 'tsx' : 'ts') : 'jsx',
              jsx: 'automatic',
              target: 'es2020',
              sourcefile: cleanId,
            });
            return {
              code: result.code,
              map: result.map,
            };
          } catch (e) {
            return null;
          }
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
    plugins: [
      jsxInJsPlugin(),
      react({
        include: /\.(jsx|js|tsx|ts)$/,
      }),
      tailwindcss(),
    ],
    optimizeDeps: {
      entries: ['src/main.tsx'],
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-native-web',
        '@supabase/supabase-js',
        'react-native-safe-area-context',
        'base64-arraybuffer',
        'lucide-react',
      ],
      exclude: [
        'expo-router',
        'expo-modules-core',
        'react-native-screens',
        'expo-linking',
        'expo-status-bar',
        'expo-splash-screen',
        'expo-image-picker',
      ],
      esbuildOptions: {
        resolveExtensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
      },
    },
    define: {
      global: 'window',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    resolve: {
      alias: [
        {
          find: /^expo-router$/,
          replacement: path.resolve(process.cwd(), 'src/shims/expoRouter.tsx'),
        },
        {
          find: /^expo-status-bar$/,
          replacement: path.resolve(process.cwd(), 'src/shims/statusBar.tsx'),
        },
        {
          find: /^expo-splash-screen$/,
          replacement: path.resolve(process.cwd(), 'src/shims/splashScreen.ts'),
        },
        {
          find: /^expo-linking$/,
          replacement: path.resolve(process.cwd(), 'src/shims/linking.ts'),
        },
        {
          find: /^expo-image-picker$/,
          replacement: path.resolve(process.cwd(), 'src/shims/imagePicker.ts'),
        },
        {
          find: /^@expo\/vector-icons(\/.*)?$/,
          replacement: path.resolve(process.cwd(), 'src/shims/vectorIcons.jsx'),
        },
        {
          find: /^react-native\/Libraries\/.*$/,
          replacement: path.resolve(process.cwd(), 'src/shims/codegenNativeComponent.js'),
        },
        {
          find: 'react-native',
          replacement: 'react-native-web',
        },
        {
          find: '@',
          replacement: path.resolve(process.cwd(), '.'),
        },
      ],
      extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR === 'true' ? false : true,
    },
  };
});
