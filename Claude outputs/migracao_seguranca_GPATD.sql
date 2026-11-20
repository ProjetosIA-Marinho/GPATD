-- =====================================================================
--  GPATD — Migração de Segurança (correções do relatório de 20/11/2026)
--  Projeto Supabase: kyfmkjmwhwlepjgibiru
--
--  COMO USAR:
--   1. APLIQUE PRIMEIRO EM STAGING (projeto Supabase separado) e faça
--      BACKUP do banco antes de rodar.
--   2. Rode o BLOCO 1 (seguro, não quebra a aplicação).
--   3. Rode o BLOCO 2 (V3 — Storage) SOMENTE junto com a troca de
--      getPublicUrl -> createSignedUrl no frontend. Veja o aviso.
--   4. BLOCO 3 (V5) e BLOCO 4 (V8) são opcionais / manuais — leia os
--      comentários antes.
--   5. Reaplique a verificação (final do arquivo) para confirmar.
-- =====================================================================


-- #####################################################################
-- #  BLOCO 1 — CORREÇÕES SEGURAS (não quebram a aplicação)            #
-- #  V1, V2, V4, V6, V7 — rode tudo numa transação.                   #
-- #####################################################################
BEGIN;

-- ---------------------------------------------------------------------
-- V1 — Impedir escalonamento de privilégio via profiles.role/status
-- Substitui a política única (que deixava o usuário mudar o próprio role)
-- por três políticas separadas.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;

-- (a) Usuário edita o PRÓPRIO contato, sem poder alterar role/status.
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role   = (SELECT p.role   FROM public.profiles p WHERE p.id = auth.uid())
    AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
  );

-- (b) Administrador gerencia qualquer perfil (inclusive role/status).
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.get_current_user_role() = 'Administrador')
  WITH CHECK (public.get_current_user_role() = 'Administrador');

-- (c) Operador gerencia apenas perfis NÃO administrativos e não pode
--     promover ninguém a Administrador/Operador.
CREATE POLICY profiles_update_operador ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.get_current_user_role() = 'Operador'
    AND role IN ('Apurador','Visualizador')
  )
  WITH CHECK (
    public.get_current_user_role() = 'Operador'
    AND role IN ('Apurador','Visualizador')
  );

-- ---------------------------------------------------------------------
-- V2 — Eliminar o mecanismo de senha por coluna (tomada de conta)
-- Remove o trigger/função que reescrevia auth.users.encrypted_password
-- a partir de profiles.senha, e remove a coluna senha.
-- OBS: a aplicação atual NÃO grava profiles.senha (confirmado no código).
-- A troca de senha deve passar pelo Supabase Auth:
--   - próprio usuário: supabase.auth.updateUser({ password })
--   - admin: Edge Function com service_role -> auth.admin.updateUserById()
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_profile_password_update ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_profile_password_update();
ALTER TABLE public.profiles DROP COLUMN IF EXISTS senha;

-- ---------------------------------------------------------------------
-- V4 — Tabela efetivo: restringir escrita a Administrador/Operador
-- (antes qualquer autenticado podia inserir/editar/APAGAR tudo)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated users to manage efetivo" ON public.efetivo;
DROP POLICY IF EXISTS "Allow authenticated users to read efetivo"   ON public.efetivo;

CREATE POLICY efetivo_select_authenticated ON public.efetivo
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY efetivo_write_operator_admin ON public.efetivo
  FOR ALL TO authenticated
  USING      (public.get_current_user_role() = ANY (ARRAY['Administrador','Operador']))
  WITH CHECK (public.get_current_user_role() = ANY (ARRAY['Administrador','Operador']));

-- ---------------------------------------------------------------------
-- V6 — Revogar EXECUTE das funções SECURITY DEFINER para chamadas via RPC
-- Elas são funções de TRIGGER; os triggers continuam funcionando
-- normalmente (não dependem do grant). Mantemos EXECUTE de
-- get_current_user_role para authenticated, pois ela é usada nas policies.
-- ---------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user()        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_delete_user()     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role()  FROM anon;

-- ---------------------------------------------------------------------
-- V7 — Fixar search_path das funções (evita sequestro de search_path)
-- Todas referenciam objetos com schema qualificado, então '' é seguro.
-- ---------------------------------------------------------------------
ALTER FUNCTION public.get_current_user_role() SET search_path = '';
ALTER FUNCTION public.handle_new_user()       SET search_path = '';
ALTER FUNCTION public.handle_delete_user()    SET search_path = '';

COMMIT;


-- #####################################################################
-- #  BLOCO 2 — V3: STORAGE PRIVADO                                    #
-- #  ⚠️ AVISO: NÃO rode isto sozinho. Tornar os buckets privados      #
-- #  QUEBRA o carregamento dos documentos enquanto o frontend usar    #
-- #  getPublicUrl. Rode JUNTO com a troca para createSignedUrl().     #
-- #####################################################################
-- BEGIN;
--
-- UPDATE storage.buckets SET public = false
--   WHERE id IN ('documents','divisions','avatars');
--
-- -- Acesso apenas a usuários autenticados (refine por divisão depois).
-- CREATE POLICY obj_select_auth ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id IN ('documents','divisions','avatars'));
--
-- CREATE POLICY obj_insert_auth ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id IN ('documents','divisions','avatars'));
--
-- CREATE POLICY obj_update_auth ON storage.objects
--   FOR UPDATE TO authenticated
--   USING (bucket_id IN ('documents','divisions','avatars'));
--
-- CREATE POLICY obj_delete_auth ON storage.objects
--   FOR DELETE TO authenticated
--   USING (bucket_id IN ('documents','divisions','avatars'));
--
-- COMMIT;
--
-- Mudança equivalente no frontend (Documents.tsx), ao obter a URL:
--   const { data } = await supabase.storage.from('documents')
--                         .createSignedUrl(filePath, 3600); // expira em 1h
--   const url = data?.signedUrl;


-- #####################################################################
-- #  BLOCO 3 — V5 (OPCIONAL): Segregar leitura por divisão            #
-- #  Só aplique se a regra de negócio for que cada divisão veja       #
-- #  apenas os próprios processos. Isso PODE afetar Dashboard/        #
-- #  Relatórios, que hoje agregam tudo. Teste bem em staging.         #
-- #  Administrador continua vendo tudo.                               #
-- #####################################################################
-- BEGIN;
-- DROP POLICY IF EXISTS processes_select_authenticated ON public.processes;
-- CREATE POLICY processes_select_scoped ON public.processes
--   FOR SELECT TO authenticated
--   USING (
--     public.get_current_user_role() = 'Administrador'
--     OR divisao = (SELECT p.divisao FROM public.profiles p WHERE p.id = auth.uid())
--   );
-- COMMIT;


-- #####################################################################
-- #  BLOCO 4 — V8 (MANUAL, não é SQL)                                 #
-- #  Ativar "Leaked Password Protection" (HaveIBeenPwned):            #
-- #  Supabase Dashboard -> Authentication -> Policies / Password.     #
-- #####################################################################


-- =====================================================================
--  VERIFICAÇÃO (rodar depois de aplicar — somente leitura)
-- =====================================================================
-- 1) RLS ligado e nº de políticas por tabela
-- SELECT c.relname AS tabela, c.relrowsecurity AS rls,
--        (SELECT count(*) FROM pg_policies p
--         WHERE p.schemaname='public' AND p.tablename=c.relname) AS politicas
-- FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
-- WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname;
--
-- 2) Políticas de profiles e efetivo (conferir role/status travados)
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname='public'
--   AND tablename IN ('profiles','efetivo') ORDER BY tablename, cmd;
--
-- 3) Buckets privados?
-- SELECT id, public FROM storage.buckets;
--
-- 4) Coluna senha removida?
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='profiles' AND column_name='senha';
-- =====================================================================
