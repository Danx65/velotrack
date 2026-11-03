# VELOTRACK PLATFORM — ESPECIFICAÇÃO TÉCNICA E CÓDIGO FONTE COMPLETO

Este documento contém toda a estrutura, telas, componentes, fluxos e código-fonte do aplicativo **Velotrack** para ser replicado em qualquer outra plataforma de Inteligência Artificial (como ChatGPT, Claude, Cursor, v0, Bolt, Replit ou Expo).

---

## 1. VISÃO GERAL DO PROJETO
**Velotrack** é uma plataforma de gestão de ordens de serviço (O.S.), acompanhamento em tempo real, suporte técnico e agendamento de serviços automotivos/motos de alta performance e uso geral.

- **Stack Tecnológico:**
  - React Native com **Expo Router**
  - **Supabase** (Autenticação, Banco de Dados PostgreSQL e Storage)
  - **Tailwind CSS / NativeWind / React Native Stylesheet**
  - Tema dark moderno estilo ciberpunk/esportivo (`#07080D`, destaque rosa `#E60050` / violeta `#635BFF`)

---

## 2. ESTRUTURA DE ARQUIVOS DO PROJETO

```
/
├── app/
│   ├── _layout.js               (Layout raiz, AuthProvider, ThemeProvider, Stack Router)
│   ├── index.js                 (Tela principal / Login / Seleção de perfis Admin vs Técnico)
│   ├── (admin)/                 (Painel do Administrador)
│   │   ├── _layout.js           (Navegação de abas do Admin)
│   │   ├── index.js             (Dashboard do Admin)
│   │   ├── agenda.js            (Calendário de serviços agendados)
│   │   ├── tecnicos.js          (Gestão de equipe técnica)
│   │   ├── criar-servico.js     (Formulário de abertura de O.S.)
│   │   ├── historico.js         (Histórico de ordens concluídas)
│   │   ├── suporte.js           (Atendimento e suporte ao vivo)
│   │   └── configuracoes.js     (Ajustes do sistema)
│   └── (tecnico)/               (Painel do Técnico)
│       ├── _layout.js           (Navegação de abas do Técnico)
│       ├── index.js             (Ordens de serviço atribuídas)
│       ├── agenda.js            (Agenda de atendimentos do dia)
│       ├── historico.js         (Serviços finalizados pelo técnico)
│       ├── perfil.js            (Perfil do profissional e status de disponibilidade)
│       └── suporte.js           (Canal direto com a central)
├── src/
│   ├── contexts/
│   │   ├── AuthContext.js       (Gerenciador de estado de autenticação)
│   │   └── ThemeContext.js      (Gerenciador de tema claro/escuro)
│   ├── lib/
│   │   └── supabase.js          (Cliente Supabase configurado)
│   ├── theme/
│   │   ├── colors.js            (Paleta de cores e variáveis visuais)
│   │   └── index.js             (Exportador de temas)
│   └── ui/
│       └── ScreenWrapper.js     (Componente contêiner responsivo com suporte Safe Area)
└── package.json
```

---

## 3. CÓDIGO FONTE COMPLETO DOS PRINCIPAIS ARQUIVOS

### A. `/src/lib/supabase.js`
```javascript
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-supabase-url.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (Platform.OS !== 'web') {
  try {
    require('expo-sqlite/localStorage/install');
  } catch (e) {
    console.warn('expo-sqlite não disponível:', e);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
```

---

### B. `/src/contexts/AuthContext.js`
```javascript
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('admin'); // 'admin' ou 'tecnico'
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Timeout de segurança para desbloquear a interface caso a rede demore
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 800);

    supabase.auth.getSession()
      .then(({ data: { session } = {} }) => {
        if (!mountedRef.current) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user?.user_metadata?.role) {
          setUserRole(session.user.user_metadata.role);
        }
      })
      .catch((err) => console.warn('Erro ao obter sessão:', err))
      .finally(() => {
        if (mountedRef.current) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.role) {
        setUserRole(session.user.user_metadata.role);
      }
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  const loginDemo = (role) => {
    setUserRole(role);
    setUser({ id: 'demo-user', email: `${role}@velotrack.app`, user_metadata: { role } });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, setUserRole, loginDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

### C. `/app/_layout.js`
```javascript
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import ScreenWrapper from '../src/ui/ScreenWrapper';

function RootLayoutNav() {
  const { loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg || '#07080D' }]}>
        <ActivityIndicator size="large" color={colors.primary || '#E60050'} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, width: '100%', height: '100%', minHeight: Platform.OS === 'web' ? '100vh' : '100%', backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenWrapper>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(tecnico)" />
        </Stack>
      </ScreenWrapper>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, width: '100%', height: '100%', minHeight: Platform.OS === 'web' ? '100vh' : '100%', backgroundColor: '#07080D' }}>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#07080D',
  },
});
```

---

## 4. INSTRUÇÕES DE EXECUÇÃO PARA OUTRAS IAs
Caso queira pedir para outra IA montar o projeto a partir deste código:

1. **Prompt de Entrada:**
   > "Crie um aplicativo completo com a estrutura acima usando React Native, Expo Router e Supabase. Use a paleta de cores escura com contraste rosa (#E60050) e crie os módulos de Administrador e Técnico com controle de Ordens de Serviço."
2. **Dependências do package.json:**
   - `expo-router`, `react-native`, `react-dom`, `@supabase/supabase-js`, `lucide-react-native`, `expo-status-bar`, `react-native-safe-area-context`.

---
*Documento gerado automaticamente pelo Velotrack Build Studio.*
