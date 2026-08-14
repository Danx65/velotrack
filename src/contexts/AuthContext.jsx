import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme';

const AuthContext = createContext({});

const STORAGE_USER_KEY = 'velotrack_auth_user';
const STORAGE_PROFILE_KEY = 'velotrack_auth_profile';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const { isDark, toggleTheme } = useTheme();
  const mountedRef = useRef(true);

  const saveLocalSession = useCallback((newUser, newProfile) => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        if (newUser) {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
        } else {
          localStorage.removeItem(STORAGE_USER_KEY);
        }
        if (newProfile) {
          localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
        } else {
          localStorage.removeItem(STORAGE_PROFILE_KEY);
        }
      } catch {}
    }
  }, []);

  const loadProfile = useCallback(async (userId, sessionUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (!mountedRef.current) return;
      
      if (data && data.active === false) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        saveLocalSession(null, null);
      } else if (data) {
        const normalized = {
          ...data,
          nome: data.nome || data.name || 'Usuário',
          role: (data.role || 'tecnico').toLowerCase(),
        };
        setProfile(normalized);
        saveLocalSession(sessionUser || user, normalized);
      }
    } catch (err) {
      // If table users is missing or user not in table, use current user metadata or state
      const u = sessionUser || user;
      if (mountedRef.current && u) {
        const metaRole = u?.user_metadata?.role || (u.email?.includes('tecnico') ? 'tecnico' : 'admin');
        const metaName = u?.user_metadata?.nome || u?.user_metadata?.name || (metaRole === 'admin' ? 'Super Administrador' : 'Técnico de Campo');
        const fallback = {
          id: u.id,
          nome: metaName,
          email: u.email,
          role: metaRole,
          active: true,
        };
        setProfile(prev => prev || fallback);
        saveLocalSession(u, fallback);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, saveLocalSession]);

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getSession()
      .then(({ data: { session } = {} }) => {
        if (!mountedRef.current) return;
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id, session.user);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Supabase auth session check:', err?.message || err);
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mountedRef.current) return;
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id, session.user);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [loadProfile, saveLocalSession]);

  const signIn = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Por favor, informe o e-mail e a senha.');
    }

    const res = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (res.error || !res.data?.user) {
      throw new Error('E-mail ou senha incorretos. Verifique suas credenciais.');
    }

    const authData = res.data;
    const user = authData.user;

    let profileData = null;
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      profileData = data;
    } catch {}

    if (profileData && profileData.active === false) {
      await supabase.auth.signOut();
      throw new Error('Conta desativada. Procure o administrador.');
    }

    const metaRole = user.user_metadata?.role || profileData?.role || (cleanEmail.includes('tecnico') ? 'tecnico' : 'admin');
    const metaName = profileData?.nome || user.user_metadata?.nome || user.user_metadata?.name || (metaRole === 'admin' ? 'Super Administrador' : 'Técnico de Campo');

    const finalProfile = {
      id: user.id,
      nome: metaName,
      email: cleanEmail,
      role: metaRole.toLowerCase(),
      active: true,
    };

    setUser(user);
    setProfile(finalProfile);
    saveLocalSession(user, finalProfile);
    return authData;
  };

  const signOut = useCallback(async () => {
    setUser(null);
    setProfile(null);
    saveLocalSession(null, null);
    try {
      await supabase.auth.signOut();
    } catch {}
    if (Platform.OS === 'web') {
      try {
        const keys = Object.keys(localStorage);
        keys.filter(k => k.includes('supabase') || k.includes('sb-') || k.includes('velotrack_auth_'))
          .forEach(k => localStorage.removeItem(k));
      } catch {}
      window.location.href = '/';
    }
  }, [saveLocalSession]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, isDark, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

