import { useEffect, useState } from 'react';

export function parse(url: string) {
  try {
    const parsed = new URL(url, 'http://localhost');
    const queryParams: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    return {
      hostname: parsed.hostname,
      path: parsed.pathname,
      queryParams,
      scheme: parsed.protocol.replace(':', ''),
    };
  } catch (e) {
    return {
      hostname: '',
      path: url,
      queryParams: {},
      scheme: '',
    };
  }
}

export function createURL(path: string, options?: { queryParams?: Record<string, any> }) {
  let url = path.startsWith('/') ? path : `/${path}`;
  if (options?.queryParams && Object.keys(options.queryParams).length > 0) {
    const params = new URLSearchParams(options.queryParams);
    url += (url.includes('?') ? '&' : '?') + params.toString();
  }
  return url;
}

export async function openURL(url: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
}

export async function canOpenURL(url: string): Promise<boolean> {
  return true;
}

export async function getInitialURL(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return null;
}

export function getLinkingURL(): string {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return '';
}

export async function openSettings(): Promise<void> {}
export async function sendIntent(action: string, extras?: any[]): Promise<void> {}

export function addEventListener(type: string, handler: (event: { url: string }) => void) {
  return {
    remove: () => {},
  };
}

export function useURL(): string | null {
  const [url, setUrl] = useState<string | null>(typeof window !== 'undefined' ? window.location.href : null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.href);
    }
  }, []);
  return url;
}

export function useLinkingURL(): string | null {
  return useURL();
}

const Linking = {
  parse,
  createURL,
  openURL,
  canOpenURL,
  getInitialURL,
  getLinkingURL,
  openSettings,
  sendIntent,
  addEventListener,
  useURL,
  useLinkingURL,
};

export default Linking;
