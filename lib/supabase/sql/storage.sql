CREATE POLICY "Give users read access to own folder 1oj01fe_0" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND (auth.jwt() ->> 'address') IS NOT NULL AND (storage.foldername(name))[1] = (auth.jwt() ->> 'address'));

CREATE POLICY "Give users insert access to own folder 1oj01fe_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (auth.jwt() ->> 'address') IS NOT NULL AND (storage.foldername(name))[1] = (auth.jwt() ->> 'address'));

CREATE POLICY "Give users update access to own folder 1oj01fe_2" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (auth.jwt() ->> 'address') IS NOT NULL AND (storage.foldername(name))[1] = (auth.jwt() ->> 'address')) WITH CHECK (bucket_id = 'avatars' AND (auth.jwt() ->> 'address') IS NOT NULL AND (storage.foldername(name))[1] = (auth.jwt() ->> 'address'));

CREATE POLICY "Give users delete access to own folder 1oj01fe_3" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (auth.jwt() ->> 'address') IS NOT NULL AND (storage.foldername(name))[1] = (auth.jwt() ->> 'address'));