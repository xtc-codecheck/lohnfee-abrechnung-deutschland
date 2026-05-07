
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false) ON CONFLICT DO NOTHING;
CREATE POLICY "tenant read receipts" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND is_tenant_member(auth.uid(), (storage.foldername(name))[1]::uuid));
CREATE POLICY "tenant write receipts" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND is_tenant_member(auth.uid(), (storage.foldername(name))[1]::uuid));
CREATE POLICY "tenant update receipts" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND is_tenant_member(auth.uid(), (storage.foldername(name))[1]::uuid));
CREATE POLICY "tenant delete receipts" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND is_tenant_member(auth.uid(), (storage.foldername(name))[1]::uuid));
