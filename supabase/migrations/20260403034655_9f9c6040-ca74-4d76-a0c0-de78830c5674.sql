-- Restore public INSERT on chat_history for chatbot widget (unauthenticated users)
DROP POLICY IF EXISTS "Authenticated users can insert chat history" ON public.chat_history;

CREATE POLICY "Anyone can insert chat history" ON public.chat_history
  FOR INSERT TO public
  WITH CHECK (true);

-- Restore public SELECT on chat_history (lead_id acts as secret token)
DROP POLICY IF EXISTS "Users can read own chat history" ON public.chat_history;

CREATE POLICY "Anyone can read chat history" ON public.chat_history
  FOR SELECT TO public
  USING (true);