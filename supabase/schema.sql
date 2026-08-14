-- ============================================
-- VELOTRACK - SQL COMPLETO (v3.0 - IDEMPOTENTE)
-- Cole tudo isso no SQL Editor do Supabase e clique em RUN.
-- Pode rodar várias vezes sem problema.
-- ============================================

-- ============================================
-- PASSO 1: Criar tabela de usuários
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telefone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'tecnico' CHECK (role IN ('admin', 'tecnico')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna active se não existe (para bancos antigos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.users ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- ============================================
-- PASSO 2: Criar tabela de serviços
-- ============================================
CREATE TABLE IF NOT EXISTS public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente TEXT NOT NULL DEFAULT '',
  endereco TEXT DEFAULT '',
  veiculo TEXT DEFAULT '',
  placa TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  tipo TEXT DEFAULT 'Instalação',
  descricao TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('alta', 'media', 'baixa')),
  technician_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  checklist JSONB DEFAULT '[]'::jsonb,
  observations TEXT DEFAULT '',
  fotos TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_test BOOLEAN NOT NULL DEFAULT false,
  tempo_inicio TIMESTAMPTZ,
  tempo_fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas que podem faltar em versões antigas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='servicos') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='priority') THEN
      ALTER TABLE public.servicos ADD COLUMN priority TEXT DEFAULT 'media';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='technician_id') THEN
      ALTER TABLE public.servicos ADD COLUMN technician_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='checklist') THEN
      ALTER TABLE public.servicos ADD COLUMN checklist JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='observations') THEN
      ALTER TABLE public.servicos ADD COLUMN observations TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='fotos') THEN
      ALTER TABLE public.servicos ADD COLUMN fotos TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='tempo_inicio') THEN
      ALTER TABLE public.servicos ADD COLUMN tempo_inicio TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='tempo_fim') THEN
      ALTER TABLE public.servicos ADD COLUMN tempo_fim TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='placa') THEN
      ALTER TABLE public.servicos ADD COLUMN placa TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='telefone') THEN
      ALTER TABLE public.servicos ADD COLUMN telefone TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='descricao') THEN
      ALTER TABLE public.servicos ADD COLUMN descricao TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='metadata') THEN
      ALTER TABLE public.servicos ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='servicos' AND column_name='is_test') THEN
      ALTER TABLE public.servicos ADD COLUMN is_test BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

-- ============================================
-- PASSO 3: Criar tabela de mensagens de suporte
-- ============================================
CREATE TABLE IF NOT EXISTS public.mensagens_de_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL DEFAULT '',
  fotos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PASSO 4: Criar tabela de configurações
-- ============================================
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_mensal INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir linha padrão de configuração se não existir
INSERT INTO public.configuracoes (meta_mensal)
SELECT 50 WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes);

-- ============================================
-- PASSO 4b: Criar tabela de histórico operacional
-- ============================================
CREATE TABLE IF NOT EXISTS public.service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_history_service_id ON public.service_history(service_id);
CREATE INDEX IF NOT EXISTS idx_service_history_created_at ON public.service_history(created_at DESC);

-- ============================================
-- PASSO 5: Habilitar Row Level Security (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_de_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 6: Remover políticas antigas (se existirem)
-- Feito DEPOIS das tabelas serem criadas para evitar erros!
-- ============================================
DO $$
BEGIN
  -- users
  DROP POLICY IF EXISTS "users_select" ON public.users;
  DROP POLICY IF EXISTS "users_insert" ON public.users;
  DROP POLICY IF EXISTS "users_update" ON public.users;
  DROP POLICY IF EXISTS "users_delete" ON public.users;
  -- servicos
  DROP POLICY IF EXISTS "servicos_select" ON public.servicos;
  DROP POLICY IF EXISTS "servicos_insert" ON public.servicos;
  DROP POLICY IF EXISTS "servicos_update" ON public.servicos;
  DROP POLICY IF EXISTS "servicos_delete" ON public.servicos;
  -- mensagens
  DROP POLICY IF EXISTS "mensagens_select" ON public.mensagens_de_suporte;
  DROP POLICY IF EXISTS "mensagens_insert" ON public.mensagens_de_suporte;
  -- configuracoes
  DROP POLICY IF EXISTS "config_select" ON public.configuracoes;
  DROP POLICY IF EXISTS "config_update" ON public.configuracoes;
  -- history
  DROP POLICY IF EXISTS "history_admin_select" ON public.service_history;
  DROP POLICY IF EXISTS "history_tecnico_select" ON public.service_history;
  DROP POLICY IF EXISTS "history_insert" ON public.service_history;
END $$;

-- ============================================
-- PASSO 7: Criar políticas de segurança (sem recursão!)
-- ============================================

-- Tabela users: todos os usuários autenticados podem ler/escrever
CREATE POLICY "users_select" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE TO authenticated USING (true);

-- Tabela servicos: todos autenticados podem ler, inserir, atualizar e deletar
CREATE POLICY "servicos_select" ON public.servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "servicos_insert" ON public.servicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "servicos_update" ON public.servicos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "servicos_delete" ON public.servicos FOR DELETE TO authenticated USING (true);

-- Tabela mensagens: todos autenticados podem ler e enviar
CREATE POLICY "mensagens_select" ON public.mensagens_de_suporte FOR SELECT TO authenticated USING (true);
CREATE POLICY "mensagens_insert" ON public.mensagens_de_suporte FOR INSERT TO authenticated WITH CHECK (true);

-- Tabela configuracoes: todos autenticados podem ler e atualizar
CREATE POLICY "config_select" ON public.configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "config_update" ON public.configuracoes FOR UPDATE TO authenticated USING (true);

-- ============================================
-- PASSO 7b: Políticas de segurança para service_history
-- ============================================

-- Admin pode ver todo histórico
CREATE POLICY "history_admin_select" ON public.service_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Técnico pode ver histórico apenas das suas próprias OS
CREATE POLICY "history_tecnico_select" ON public.service_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.servicos
      WHERE servicos.id = service_history.service_id
      AND servicos.technician_id = auth.uid()
    )
  );

-- Qualquer autenticado pode inserir histórico
CREATE POLICY "history_insert" ON public.service_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================
-- PASSO 8: Storage bucket para fotos
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Limpar políticas antigas de storage se existirem
DO $$
BEGIN
  DROP POLICY IF EXISTS "fotos_upload" ON storage.objects;
  DROP POLICY IF EXISTS "fotos_select" ON storage.objects;
  DROP POLICY IF EXISTS "fotos_public" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignora qualquer erro aqui
END $$;

-- Criar políticas de storage
CREATE POLICY "fotos_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos');
CREATE POLICY "fotos_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'fotos');
CREATE POLICY "fotos_public" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'fotos');

-- ============================================
-- CONCLUÍDO! Banco de dados pronto.
-- ============================================
