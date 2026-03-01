INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
