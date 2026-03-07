
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.chatbot_leads(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert chat history" ON public.chat_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read chat history" ON public.chat_history
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage chat history" ON public.chat_history
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_chat_history_lead_id ON public.chat_history(lead_id);
