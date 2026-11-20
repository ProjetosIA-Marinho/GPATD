-- =====================================================================
--  GPATD — V3: tornar o bucket 'documents' privado (+ políticas)
--
--  SEQUÊNCIA OBRIGATÓRIA:
--   1. PUBLICAR primeiro o frontend atualizado (arquivos do V3).
--   2. Confirmar no app publicado que os documentos ainda abrem
--      (ainda funcionam, pois o bucket segue público neste momento).
--   3. SÓ ENTÃO rodar este script no SQL Editor (produção).
--   4. Testar de novo: os documentos devem abrir (agora via URL assinada);
--      uma URL pública direta antiga deve passar a dar erro 400/403.
--
--  Afeta apenas o bucket 'documents'. 'divisions' e 'avatars' seguem
--  como estão (fora do escopo desta etapa).
-- =====================================================================
BEGIN;

-- 1) Bucket privado
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- 2) Políticas: apenas usuários autenticados acessam objetos do bucket
--    (necessário para o createSignedUrl funcionar e para upload/remoção)
CREATE POLICY documents_obj_select_auth ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');

CREATE POLICY documents_obj_insert_auth ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');

CREATE POLICY documents_obj_update_auth ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'documents');

CREATE POLICY documents_obj_delete_auth ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documents');

COMMIT;


-- =====================================================================
--  ROLLBACK (se algo quebrar, volta o bucket a público)
-- =====================================================================
-- BEGIN;
-- UPDATE storage.buckets SET public = true WHERE id = 'documents';
-- DROP POLICY IF EXISTS documents_obj_select_auth ON storage.objects;
-- DROP POLICY IF EXISTS documents_obj_insert_auth ON storage.objects;
-- DROP POLICY IF EXISTS documents_obj_update_auth ON storage.objects;
-- DROP POLICY IF EXISTS documents_obj_delete_auth ON storage.objects;
-- COMMIT;
