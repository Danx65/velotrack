import { ExpoRoot } from 'expo-router';

// Load all route files in /app directory dynamically for Vite
const modules: Record<string, any> = import.meta.glob('../app/**/*.{js,jsx,ts,tsx}', { eager: true });

function createContext() {
  const map: Record<string, any> = {};

  Object.keys(modules).forEach((fullPath) => {
    const relativePath = fullPath.replace('../app', '.'); // e.g. "./_layout.js"
    const withoutExt = relativePath.replace(/\.(js|jsx|ts|tsx)$/, ''); // e.g. "./_layout"

    map[fullPath] = modules[fullPath];
    map[relativePath] = modules[fullPath];
    map[withoutExt] = modules[fullPath];
  });

  const keysArray = Object.keys(map).filter(k => k.startsWith('./') && (k.endsWith('.js') || k.endsWith('.jsx') || k.endsWith('.ts') || k.endsWith('.tsx')));

  const ctx = (key: string) => {
    if (map[key]) return map[key];

    const normalizedKey = key.startsWith('./') ? key : `./${key}`;
    if (map[normalizedKey]) return map[normalizedKey];

    for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
      if (map[normalizedKey + ext]) return map[normalizedKey + ext];
    }

    console.warn('[Expo Router context] Key not found:', key);
    return undefined;
  };

  ctx.keys = () => keysArray;
  ctx.resolve = (key: string) => key;
  ctx.id = 'app';
  return ctx;
}

const context = createContext();

export function App() {
  return <ExpoRoot context={context} />;
}

export default App;
