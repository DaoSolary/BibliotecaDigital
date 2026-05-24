-- Garantir que logs podem ser inseridos por utilizadores autenticados

DROP POLICY IF EXISTS "Authenticated insert logs" ON system_logs;
CREATE POLICY "Authenticated insert logs" ON system_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view logs" ON system_logs;
CREATE POLICY "Admins view logs" ON system_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
