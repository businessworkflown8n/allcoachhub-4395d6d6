
CREATE TABLE public.seo_page_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url text NOT NULL UNIQUE,
  page_type text NOT NULL DEFAULT 'static',
  meta_title text,
  meta_description text,
  h1_tag text,
  primary_keyword text,
  secondary_keywords text[] DEFAULT '{}',
  robots_directive text NOT NULL DEFAULT 'index, follow',
  canonical_url text,
  schema_markup jsonb,
  image_alt_text text,
  seo_score integer DEFAULT 0,
  index_status text NOT NULL DEFAULT 'not_indexed',
  last_crawled_at timestamp with time zone,
  crawl_errors text,
  is_auto_generated boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_page_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all SEO metadata"
  ON public.seo_page_metadata FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Coaches can view own page SEO"
  ON public.seo_page_metadata FOR SELECT TO authenticated
  USING (true);

CREATE TABLE public.seo_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  page_type text NOT NULL,
  meta_title_template text NOT NULL,
  meta_description_template text NOT NULL,
  h1_template text,
  default_schema_type text DEFAULT 'Course',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage SEO templates"
  ON public.seo_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active templates"
  ON public.seo_templates FOR SELECT TO authenticated
  USING (is_active = true);
