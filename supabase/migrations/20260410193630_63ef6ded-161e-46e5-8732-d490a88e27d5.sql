
CREATE TABLE public.indexing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seo_page_id UUID REFERENCES public.seo_page_metadata(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'URL_UPDATED',
  status TEXT NOT NULL DEFAULT 'submitted',
  api_response JSONB,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.indexing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage indexing logs"
ON public.indexing_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_indexing_logs_url ON public.indexing_logs(url);
CREATE INDEX idx_indexing_logs_status ON public.indexing_logs(status);
CREATE INDEX idx_indexing_logs_seo_page ON public.indexing_logs(seo_page_id);
