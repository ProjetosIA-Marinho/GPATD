-- =====================================================================
--  GPATD — ROLLBACK do Bloco 1 (desfaz migracao_seguranca_GPATD.sql)
--  Restaura EXATAMENTE o estado anterior (políticas, trigger, coluna,
--  grants e search_path) verificado em 20/11/2026.
--
--  Use apenas se, após aplicar o Bloco 1, algo se comportar de forma
--  inesperada e você quiser voltar atrás. Rode no SQL Editor.
--  OBS: isto reintroduz as vulnerabilidades corrigidas — é um rollback.
-- =====================================================================
BEGIN;

-- --- Reverter V1 (políticas de profiles) --------------------------------
DROP POLICY IF EXISTS profiles_update_self     ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin    ON public.profiles;
DROP POLICY IF EXISTS profiles_update_operador ON public.profiles;

CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = id)
    OR (public.get_current_user_role() = 'Administrador')
    OR (public.get_current_user_role() = 'Operador')
  )
  WITH CHECK (
    (auth.uid() = id)
    OR (public.get_current_user_role() = 'Administrador')
    OR (public.get_current_user_role() = 'Operador')
  );

-- --- Reverter V2 (coluna senha + trigger/função) ------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS senha text;

CREATE OR REPLACE FUNCTION public.handle_profile_password_update()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.senha IS DISTINCT FROM OLD.senha AND NEW.senha IS NOT NULL AND NEW.senha != '')
     OR (TG_OP = 'INSERT' AND NEW.senha IS NOT NULL AND NEW.senha != '') THEN
    UPDATE auth.users
    SET encrypted_password = crypt(NEW.senha, gen_salt('bf'))
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_profile_password_update ON public.profiles;
CREATE TRIGGER on_profile_password_update
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_password_update();

-- --- Reverter V4 (políticas de efetivo) --------------------------------
DROP POLICY IF EXISTS efetivo_select_authenticated ON public.efetivo;
DROP POLICY IF EXISTS efetivo_write_operator_admin ON public.efetivo;

CREATE POLICY "Allow authenticated users to read efetivo" ON public.efetivo
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage efetivo" ON public.efetivo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- Reverter V6 (grants de EXECUTE) -----------------------------------
GRANT EXECUTE ON FUNCTION public.handle_new_user()       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_delete_user()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;

-- --- Reverter V7 (search_path) -----------------------------------------
ALTER FUNCTION public.get_current_user_role() RESET search_path;
ALTER FUNCTION public.handle_new_user()       RESET search_path;
ALTER FUNCTION public.handle_delete_user()    RESET search_path;

COMMIT;
