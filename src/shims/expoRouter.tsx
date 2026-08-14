import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  forwardRef,
} from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';

// --- Types ---
export interface RouterState {
  pathname: string;
  params: Record<string, string>;
  segments: string[];
}

export interface RouterInstance {
  push: (href: string | { pathname: string; params?: Record<string, any> }, options?: any) => void;
  replace: (href: string | { pathname: string; params?: Record<string, any> }, options?: any) => void;
  back: () => void;
  navigate: (href: string | { pathname: string; params?: Record<string, any> }, options?: any) => void;
  setParams: (params: Record<string, string>) => void;
  canGoBack: () => boolean;
}

// --- Global Router Context ---
interface RouterContextValue {
  state: RouterState;
  router: RouterInstance;
  context: any;
  currentPrefix: string;
}

const RouterContext = createContext<RouterContextValue | null>(null);

// Parse pathname and search params from raw string
function parseHref(href: string | { pathname: string; params?: Record<string, any> }) {
  if (typeof href === 'object' && href !== null) {
    const p = href.pathname || '/';
    const params = { ...(href.params || {}) };
    return { pathname: p.startsWith('/') ? p : `/${p}`, params };
  }

  const [rawPath, rawQuery] = String(href).split('?');
  const pathname = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const params: Record<string, string> = {};

  if (rawQuery) {
    const searchParams = new URLSearchParams(rawQuery);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  return { pathname, params };
}

function computeSegments(pathname: string): string[] {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean) return [];
  return clean.split('/').filter(Boolean);
}

// Global imperative router listener
let globalNavigate: ((pathname: string, params?: Record<string, any>, isReplace?: boolean) => void) | null = null;
let globalGoBack: (() => void) | null = null;
let currentPathname = typeof window !== 'undefined' && window.location?.pathname ? window.location.pathname : '/';
let currentParams: Record<string, string> = {};

if (typeof window !== 'undefined' && window.location?.search) {
  const sp = new URLSearchParams(window.location.search);
  sp.forEach((val, key) => {
    currentParams[key] = val;
  });
}

// Imperative router export
export const router: RouterInstance = {
  push: (href) => {
    const { pathname, params } = parseHref(href);
    if (globalNavigate) globalNavigate(pathname, params, false);
  },
  replace: (href) => {
    const { pathname, params } = parseHref(href);
    if (globalNavigate) globalNavigate(pathname, params, true);
  },
  navigate: (href) => {
    const { pathname, params } = parseHref(href);
    if (globalNavigate) globalNavigate(pathname, params, false);
  },
  back: () => {
    if (globalGoBack) globalGoBack();
    else if (typeof window !== 'undefined' && window.history) window.history.back();
  },
  setParams: (newParams) => {
    if (globalNavigate) globalNavigate(currentPathname, { ...currentParams, ...newParams }, true);
  },
  canGoBack: () => {
    if (typeof window !== 'undefined' && window.history) {
      return window.history.length > 1;
    }
    return false;
  },
};

// --- Hooks ---
export function useRouter(): RouterInstance {
  const ctx = useContext(RouterContext);
  return ctx ? ctx.router : router;
}

export function useSegments(): string[] {
  const ctx = useContext(RouterContext);
  return ctx?.state?.segments ?? computeSegments(currentPathname);
}

export function usePathname(): string {
  const ctx = useContext(RouterContext);
  return ctx?.state?.pathname ?? currentPathname;
}

export function useLocalSearchParams<T extends Record<string, string> = Record<string, string>>(): T {
  const ctx = useContext(RouterContext);
  return (ctx?.state?.params ?? currentParams) as T;
}

export function useGlobalSearchParams<T extends Record<string, string> = Record<string, string>>(): T {
  const ctx = useContext(RouterContext);
  return (ctx?.state?.params ?? currentParams) as T;
}

export function useSearchParams(): URLSearchParams {
  const params = useLocalSearchParams();
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => searchParams.set(k, String(v)));
  return searchParams;
}

export function useUnstableGlobalHref(): string {
  return usePathname();
}

export function useNavigationContainerRef(): any {
  return { current: null };
}

export function useRootNavigation(): any {
  return useRouter();
}

export function useRootNavigationState(): any {
  const segments = useSegments();
  return {
    key: 'root',
    routes: segments.map((name, index) => ({ name, key: `${name}-${index}` })),
    index: Math.max(0, segments.length - 1),
  };
}

export function useNavigation(): any {
  const r = useRouter();
  return useMemo(
    () => ({
      navigate: (name: string, p?: any) => r.push(p ? { pathname: name, params: p } : name),
      goBack: () => r.back(),
      replace: (name: string, p?: any) => r.replace(p ? { pathname: name, params: p } : name),
      setOptions: () => {},
      getParent: () => null,
      addListener: () => () => {},
      removeListener: () => {},
      isFocused: () => true,
    }),
    [r]
  );
}

export function useFocusEffect(callback: () => void | (() => void)) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const cleanup = cbRef.current?.();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);
}

// --- Route Resolution Helpers ---
function normalizeRoutePath(path: string): string {
  let p = path.startsWith('/') ? path : `/${path}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

function findModuleForRoute(context: any, searchPath: string): { component: any; extractedParams: Record<string, string> } | null {
  if (!context) return null;
  const keys: string[] = typeof context.keys === 'function' ? context.keys() : [];

  const cleanPath = searchPath.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath ? cleanPath.split('/') : [];

  // 1. Direct match (e.g. ./index.jsx or ./(admin)/index.jsx)
  const candidateKeys = [
    `./${cleanPath}`,
    `./${cleanPath}/index`,
    cleanPath === '' ? './index' : '',
  ].filter(Boolean);

  for (const cand of candidateKeys) {
    for (const ext of ['', '.jsx', '.tsx', '.js', '.ts']) {
      const full = cand + ext;
      if (keys.includes(full)) {
        const mod = context(full);
        if (mod) return { component: mod.default || mod, extractedParams: {} };
      }
    }
  }

  // 2. Dynamic route match (e.g. [id].jsx)
  for (const k of keys) {
    const kNorm = k.replace(/^\.\//, '').replace(/\.(jsx|tsx|js|ts)$/, '');
    const kSegments = kNorm.split('/');
    if (kSegments.length === segments.length) {
      let isMatch = true;
      const extractedParams: Record<string, string> = {};

      for (let i = 0; i < kSegments.length; i++) {
        const kSeg = kSegments[i];
        const aSeg = segments[i];

        if (kSeg.startsWith('[') && kSeg.endsWith(']')) {
          const paramName = kSeg.slice(1, -1);
          extractedParams[paramName] = aSeg;
        } else if (kSeg !== aSeg) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        const mod = context(k);
        if (mod) return { component: mod.default || mod, extractedParams };
      }
    }
  }

  return null;
}

// --- Layout & Screen Components ---
const LayoutScopeContext = createContext<{ prefix: string }>({ prefix: '' });

export const Screen = function Screen(_props: { name: string; options?: any; getId?: any; getComponent?: any }) {
  return null;
};

export function Slot() {
  const routerCtx = useContext(RouterContext);
  const scopeCtx = useContext(LayoutScopeContext);
  if (!routerCtx || !routerCtx.context) return null;

  const { state, context } = routerCtx;
  const match = findModuleForRoute(context, state.pathname);
  if (match && match.component) {
    const ChildComponent = match.component;
    return <ChildComponent />;
  }

  return null;
}

export function Stack({ children, screenOptions }: { children?: React.ReactNode; screenOptions?: any }) {
  const routerCtx = useContext(RouterContext);
  const scopeCtx = useContext(LayoutScopeContext);
  if (!routerCtx || !routerCtx.context) return null;

  const { state, context } = routerCtx;
  const currentPath = state.pathname;

  // Determine current active subsegment for this Stack level
  const prefix = scopeCtx.prefix;
  let subPath = currentPath;
  if (prefix && subPath.startsWith(prefix)) {
    subPath = subPath.slice(prefix.length);
  }
  subPath = subPath.replace(/^\/+/, '');
  const topSegment = subPath.split('/')[0] || 'index';

  // Check if there is a nested layout matching this segment (e.g. (admin)/_layout.jsx)
  const layoutPathCandidates = [
    prefix ? `${prefix}/${topSegment}/_layout` : `./${topSegment}/_layout`,
    `./${topSegment}/_layout`,
  ];

  let LayoutComponent: any = null;
  let layoutPrefix = '';

  for (const cand of layoutPathCandidates) {
    const norm = cand.replace(/^\.\//, '');
    for (const ext of ['.jsx', '.tsx', '.js', '.ts']) {
      const full = `./${norm}${ext}`;
      if (context.keys && context.keys().includes(full)) {
        const mod = context(full);
        if (mod) {
          LayoutComponent = mod.default || mod;
          layoutPrefix = `/${norm.replace(/\/_layout$/, '')}`;
          break;
        }
      }
    }
    if (LayoutComponent) break;
  }

  if (LayoutComponent) {
    return (
      <LayoutScopeContext.Provider value={{ prefix: layoutPrefix }}>
        <LayoutComponent />
      </LayoutScopeContext.Provider>
    );
  }

  // Otherwise render direct page matching the full path
  const match = findModuleForRoute(context, currentPath);
  if (match && match.component) {
    const PageComponent = match.component;
    return <PageComponent />;
  }

  return (
    <View style={screenOptions?.contentStyle || { flex: 1 }}>
      {children}
    </View>
  );
}
Stack.Screen = Screen;

export function Tabs({
  children,
  screenOptions = {},
}: {
  children?: React.ReactNode;
  screenOptions?: any;
}) {
  const routerCtx = useContext(RouterContext);
  const scopeCtx = useContext(LayoutScopeContext);
  if (!routerCtx || !routerCtx.context) return null;

  const { state, context, router } = routerCtx;
  const prefix = scopeCtx.prefix;

  // Collect tab screen configs from children
  const screens: Array<{ name: string; options: any }> = [];
  React.Children.forEach(children, (child: any) => {
    if (child && child.props && child.props.name) {
      screens.push({
        name: child.props.name,
        options: child.props.options || {},
      });
    }
  });

  // Calculate active screen in this tab layout
  let subPath = state.pathname;
  if (prefix && subPath.startsWith(prefix)) {
    subPath = subPath.slice(prefix.length);
  }
  subPath = subPath.replace(/^\/+/, '');
  const currentTabName = subPath.split('/')[0] || 'index';

  // Find module for the active route inside this tab layout
  const targetRoute = prefix ? `${prefix}/${subPath || 'index'}` : subPath || 'index';
  const match = findModuleForRoute(context, targetRoute) || findModuleForRoute(context, state.pathname);

  const ActiveComponent = match?.component;

  // Tab bar styles
  const isTabBarVisible = screenOptions?.tabBarStyle?.display !== 'none';
  const tabBarStyle = screenOptions?.tabBarStyle || {};
  const activeColor = screenOptions?.tabBarActiveTintColor || '#E60050';
  const inactiveColor = screenOptions?.tabBarInactiveTintColor || '#8A92A6';
  const labelStyle = screenOptions?.tabBarLabelStyle || {};

  const visibleTabs = screens.filter((s) => s.options?.href !== null);

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <View style={{ flex: 1 }}>
        {ActiveComponent ? <ActiveComponent /> : null}
      </View>

      {isTabBarVisible && visibleTabs.length > 0 && (
        <View
          style={[
            {
              flexDirection: 'row',
              height: 60,
              borderTopWidth: 1,
              alignItems: 'center',
              justifyContent: 'space-around',
            },
            tabBarStyle,
          ]}
        >
          {visibleTabs.map((tab) => {
            const isFocused = currentTabName === tab.name || (tab.name === 'index' && !subPath);
            const color = isFocused ? activeColor : inactiveColor;
            const title = tab.options?.title || tab.name;

            const handlePress = () => {
              const dest = prefix
                ? tab.name === 'index'
                  ? prefix
                  : `${prefix}/${tab.name}`
                : tab.name === 'index'
                ? '/'
                : `/${tab.name}`;
              router.replace(dest);
            };

            return (
              <Pressable
                key={tab.name}
                onPress={handlePress}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
              >
                {tab.options?.tabBarIcon ? (
                  tab.options.tabBarIcon({ color, focused: isFocused, size: 20 })
                ) : null}
                <Text
                  style={[
                    { fontSize: 10, marginTop: 2, color },
                    labelStyle,
                    isFocused && { fontWeight: '700' },
                  ]}
                >
                  {title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
Tabs.Screen = Screen;

export const Navigator = Stack;
export const Unmatched = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>Página não encontrada</Text>
  </View>
);
export const ErrorBoundary = ({ error, retry }: any) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#E60050' }}>Ocorreu um erro</Text>
    <Text style={{ fontSize: 14, color: '#8A92A6', marginVertical: 8 }}>{String(error)}</Text>
    {retry && (
      <Pressable onPress={retry} style={{ padding: 10, backgroundColor: '#E60050', borderRadius: 8 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Tentar novamente</Text>
      </Pressable>
    )}
  </View>
);

export function withLayoutContext(NavComponent: any) {
  NavComponent.Screen = Screen;
  return NavComponent;
}

export const SplashScreen = {
  preventAutoHideAsync: async () => {},
  hideAsync: async () => {},
};

export function Redirect({
  href,
  relativeToDirectory,
  withAnchor,
}: {
  href: any;
  relativeToDirectory?: boolean;
  withAnchor?: boolean;
}) {
  const r = useRouter();
  useEffect(() => {
    if (r?.replace) {
      r.replace(href);
    }
  }, [href]);
  return null;
}

export const Link = forwardRef(function Link(
  { href, replace, push: isPush, children, style, asChild, onPress, ...rest }: any,
  ref: any
) {
  const r = useRouter();
  const handlePress = (e: any) => {
    if (onPress) onPress(e);
    if (e?.defaultPrevented) return;
    if (replace) {
      r.replace(href);
    } else {
      r.push(href);
    }
  };

  return (
    <Text
      ref={ref}
      style={style}
      {...rest}
      {...Platform.select({
        web: { onClick: handlePress, href: typeof href === 'string' ? href : undefined },
        default: { onPress: handlePress },
      })}
    >
      {children}
    </Text>
  );
});

// --- Root Component ---
export function ExpoRoot({ context }: { context: any }) {
  const [pathname, setPathname] = useState(() => {
    if (typeof window !== 'undefined' && window.location?.pathname) {
      return normalizeRoutePath(window.location.pathname);
    }
    return '/';
  });

  const [params, setParams] = useState<Record<string, string>>(() => {
    const initialParams: Record<string, string> = {};
    if (typeof window !== 'undefined' && window.location?.search) {
      const sp = new URLSearchParams(window.location.search);
      sp.forEach((v, k) => {
        initialParams[k] = v;
      });
    }
    return initialParams;
  });

  const navigateHandler = useCallback(
    (newPath: string, newParams?: Record<string, any>, isReplace?: boolean) => {
      const norm = normalizeRoutePath(newPath);
      const combinedParams = { ...(newParams || {}) };

      currentPathname = norm;
      currentParams = combinedParams;
      setPathname(norm);
      setParams(combinedParams);

      if (typeof window !== 'undefined' && window.history) {
        const queryStr = Object.keys(combinedParams).length
          ? `?${new URLSearchParams(combinedParams).toString()}`
          : '';
        const fullUrl = `${norm}${queryStr}`;

        if (isReplace) {
          window.history.replaceState({}, '', fullUrl);
        } else {
          window.history.pushState({}, '', fullUrl);
        }
      }
    },
    []
  );

  const backHandler = useCallback(() => {
    if (typeof window !== 'undefined' && window.history) {
      window.history.back();
    }
  }, []);

  useEffect(() => {
    globalNavigate = navigateHandler;
    globalGoBack = backHandler;

    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const norm = normalizeRoutePath(window.location.pathname);
        const sp = new URLSearchParams(window.location.search);
        const p: Record<string, string> = {};
        sp.forEach((v, k) => {
          p[k] = v;
        });

        currentPathname = norm;
        currentParams = p;
        setPathname(norm);
        setParams(p);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [navigateHandler, backHandler]);

  const routerInstance: RouterInstance = useMemo(
    () => ({
      push: (href) => {
        const { pathname: p, params: pars } = parseHref(href);
        navigateHandler(p, pars, false);
      },
      replace: (href) => {
        const { pathname: p, params: pars } = parseHref(href);
        navigateHandler(p, pars, true);
      },
      navigate: (href) => {
        const { pathname: p, params: pars } = parseHref(href);
        navigateHandler(p, pars, false);
      },
      back: backHandler,
      setParams: (p) => {
        navigateHandler(pathname, { ...params, ...p }, true);
      },
      canGoBack: () => {
        if (typeof window !== 'undefined' && window.history) {
          return window.history.length > 1;
        }
        return false;
      },
    }),
    [navigateHandler, backHandler, pathname, params]
  );

  const segments = useMemo(() => computeSegments(pathname), [pathname]);

  // Extract params from dynamic segment matches in active route
  const resolvedParams = useMemo(() => {
    const match = findModuleForRoute(context, pathname);
    return { ...params, ...(match?.extractedParams || {}) };
  }, [context, pathname, params]);

  const routerContextValue: RouterContextValue = useMemo(
    () => ({
      state: { pathname, params: resolvedParams, segments },
      router: routerInstance,
      context,
      currentPrefix: '',
    }),
    [pathname, resolvedParams, segments, routerInstance, context]
  );

  // Look for root layout `./_layout`
  let RootLayout: any = null;
  if (context && typeof context.keys === 'function') {
    const keys: string[] = context.keys();
    for (const ext of ['.jsx', '.tsx', '.js', '.ts']) {
      const full = `./_layout${ext}`;
      if (keys.includes(full)) {
        const mod = context(full);
        RootLayout = mod?.default || mod;
        break;
      }
    }
  }

  return (
    <RouterContext.Provider value={routerContextValue}>
      <LayoutScopeContext.Provider value={{ prefix: '' }}>
        {RootLayout ? (
          <RootLayout />
        ) : (
          <Stack />
        )}
      </LayoutScopeContext.Provider>
    </RouterContext.Provider>
  );
}

const expoRouter = {
  Stack,
  Tabs,
  useRouter,
  useUnstableGlobalHref,
  usePathname,
  useNavigationContainerRef,
  useGlobalSearchParams,
  useLocalSearchParams,
  useSegments,
  useRootNavigation,
  useRootNavigationState,
  useSearchParams,
  useFocusEffect,
  useNavigation,
  router,
  withLayoutContext,
  ExpoRoot,
  Navigator,
  Slot,
  Unmatched,
  ErrorBoundary,
  SplashScreen,
  Link,
  Redirect,
};

export default expoRouter;
