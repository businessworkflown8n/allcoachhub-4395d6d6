-- Fix 1: Replace overly permissive chatbot_leads SELECT policy
DROP POLICY IF EXISTS "Anyone can read chatbot leads by id" ON public.chatbot_leads;

CREATE POLICY "Users can read own linked leads" ON public.chatbot_leads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict chat_history INSERT to authenticated users linking to their own leads
DROP POLICY IF EXISTS "Anyone can insert chat history" ON public.chat_history;

CREATE POLICY "Authenticated users can insert chat history" ON public.chat_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chatbot_leads cl
      WHERE cl.id = chat_history.lead_id
      AND cl.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix 3: Restrict chat_history SELECT to own leads or admin
DROP POLICY IF EXISTS "Anyone can read chat history" ON public.chat_history;

CREATE POLICY "Users can read own chat history" ON public.chat_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chatbot_leads cl
      WHERE cl.id = chat_history.lead_id
      AND cl.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );