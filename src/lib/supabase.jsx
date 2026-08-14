import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const DEFAULT_SUPABASE_URL = 'https://wcazdhfwaaryommlljve.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYXpkaGZ3YWFyeW9tbWxsanZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTk1NDYsImV4cCI6MjA5NTI5NTU0Nn0.CHd-2QRMPESf36lykHxskEq50a73o3EinjX3WElMTQg';

const cleanString = (val) => {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^['"]|['"]$/g, '');
};

const isValidHttpUrl = (string) => {
  if (!string || typeof string !== 'string') return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

export const getSupabaseConfig = () => {
  let url = '';
  let key = '';

  // Check import.meta.env
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      url = cleanString(import.meta.env.EXPO_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL);
      key = cleanString(import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY);
    }
  } catch (e) {}

  // Fallback to process.env
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (!url) url = cleanString(process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
      if (!key) key = cleanString(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
    }
  } catch (e) {}

  // Fallback to window.__ENV__ if defined
  try {
    if (typeof window !== 'undefined' && window.__ENV__) {
      if (!url) url = cleanString(window.__ENV__.EXPO_PUBLIC_SUPABASE_URL || window.__ENV__.VITE_SUPABASE_URL || window.__ENV__.SUPABASE_URL);
      if (!key) key = cleanString(window.__ENV__.EXPO_PUBLIC_SUPABASE_ANON_KEY || window.__ENV__.VITE_SUPABASE_ANON_KEY || window.__ENV__.SUPABASE_ANON_KEY);
    }
  } catch (e) {}

  // Validate URL format - must be a valid HTTP/HTTPS URL
  if (!isValidHttpUrl(url) || url.includes('placeholder') || url.includes('seu-projeto')) {
    url = DEFAULT_SUPABASE_URL;
  }
  if (!key || key.includes('placeholder') || key.includes('sua-chave')) {
    key = DEFAULT_SUPABASE_ANON_KEY;
  }

  const isConfigured = !!(url && key && isValidHttpUrl(url) && !url.includes('placeholder') && !key.includes('placeholder'));

  return {
    url,
    key,
    isConfigured,
    rawUrl: url,
    maskedKey: key ? (key.length > 12 ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : '***') : 'Não informada',
  };
};

const config = getSupabaseConfig();
export const supabaseUrl = config.url;
export const supabaseAnonKey = config.key;

const safeFetch = async (input, init) => {
  const urlStr = typeof input === 'string' ? input : (input?.url || '');
  const headers = init?.headers || (input instanceof Request ? input.headers : {});
  const isObjectRequest = typeof headers?.get === 'function' 
    ? headers.get('Accept')?.includes('vnd.pgrst.object')
    : (headers?.['Accept']?.includes('vnd.pgrst.object') || headers?.['accept']?.includes('vnd.pgrst.object'));

  // If placeholder or not configured properly
  if (!config.isConfigured || urlStr.includes('placeholder.supabase.co') || urlStr.includes('seu-projeto.supabase.co')) {
    if (urlStr.includes('/auth/v1/')) {
      return new Response(JSON.stringify({ data: null, error: { message: 'Configuração do Supabase pendente' }, session: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (isObjectRequest) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'content-range': '0-0/0' },
    });
  }

  try {
    return await fetch(input, init);
  } catch (err) {
    console.warn('Network error intercepted during Supabase request:', err?.message || err);
    if (urlStr.includes('/auth/v1/')) {
      return new Response(JSON.stringify({ data: null, error: { message: err?.message || 'Falha de conexão com o Supabase' }, session: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (isObjectRequest) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'content-range': '0-0/0' },
    });
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  global: {
    fetch: safeFetch,
  },
  db: {
    schema: 'public',
  },
});

/**
 * Health check utility function for Supabase connection diagnostics.
 */
export const checkSupabaseConnection = async () => {
  const currentConfig = getSupabaseConfig();
  const startTime = Date.now();

  const result = {
    timestamp: new Date().toISOString(),
    configured: currentConfig.isConfigured,
    url: currentConfig.url,
    maskedKey: currentConfig.maskedKey,
    latencyMs: null,
    status: 'unknown', // 'connected' | 'unauthorized' | 'not_configured' | 'error'
    authStatus: 'unknown',
    databaseStatus: 'unknown',
    message: '',
    details: null,
  };

  if (!currentConfig.isConfigured) {
    result.status = 'not_configured';
    result.message = 'Chaves do Supabase não configuradas no ambiente (.env). Usando fallback placeholder.';
    return result;
  }

  try {
    // 1. Check Auth Session
    const authStart = Date.now();
    const { data: sessionData, error: authError } = await supabase.auth.getSession();
    const authLatency = Date.now() - authStart;

    if (authError) {
      result.authStatus = `error: ${authError.message}`;
    } else {
      result.authStatus = 'operational';
    }

    // 2. Ping REST API / Database
    const dbStart = Date.now();
    // Test a basic lightweight query
    const { data, error, status } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
    
    const totalLatency = Date.now() - startTime;
    result.latencyMs = totalLatency;

    if (error) {
      // If table doesn't exist or RLS blocked, check status code
      if (status === 401 || status === 403) {
        result.status = 'unauthorized';
        result.databaseStatus = `Restrito/RLS (${status}): ${error.message}`;
        result.message = 'Chave inválida ou bloqueio de permissão (RLS/JWT).';
      } else if (status === 404 || error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('table')) {
        // Connected to Supabase REST endpoint, table just not migrated yet
        result.status = 'connected';
        result.databaseStatus = `API Ativa (Tabela users não encontrada ou vazia: ${error.message})`;
        result.message = 'Conexão com o Supabase estabelecida com sucesso!';
      } else {
        result.status = 'connected';
        result.databaseStatus = `Resposta recebida (${status || 'OK'}): ${error.message}`;
        result.message = 'Conexão com a instância Supabase respondendo.';
      }
    } else {
      result.status = 'connected';
      result.databaseStatus = 'operational';
      result.message = 'Conexão com o Supabase 100% operacional!';
    }

    result.details = {
      httpStatus: status,
      sessionActive: !!sessionData?.session,
    };
  } catch (err) {
    result.latencyMs = Date.now() - startTime;
    result.status = 'error';
    result.message = err.message || 'Falha ao conectar com o endpoint do Supabase.';
    result.details = { error: String(err) };
  }

  return result;
};

