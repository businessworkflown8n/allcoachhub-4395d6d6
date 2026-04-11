
-- Ensure RLS is enabled
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_leads ENABLE ROW LEVEL SECURITY;

-- landing_pages policies
CREATE POLICY "Allow insert for authenticated" ON public.landing_pages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow select for authenticated" ON public.landing_pages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow update for authenticated" ON public.landing_pages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated" ON public.landing_pages FOR DELETE TO authenticated USING (true);
-- Public select for published pages
CREATE POLICY "Allow public select published" ON public.landing_pages FOR SELECT TO anon USING (status = 'published' OR is_published = true);

-- landing_page_leads policies
CREATE POLICY "Allow insert leads for all" ON public.landing_page_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow select leads for authenticated" ON public.landing_page_leads FOR SELECT TO authenticated USING (true);
