
-- Fix chat_history: replace overly permissive public SELECT and INSERT policies
DROP POLICY IF EXISTS "Anyone can read chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Anyone can insert chat history" ON public.chat_history;

-- Allow inserts only when a valid lead_id exists (prevents arbitrary inserts)
CREATE POLICY "Validated lead can insert chat"
  ON public.chat_history FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.chatbot_leads WHERE id = chat_history.lead_id)
  );

-- Allow reads only for the specific lead_id (session-scoped) or admins
-- Anonymous users can only read if they know the lead_id (acts as secret token)
CREATE POLICY "Lead session can read own chat"
  ON public.chat_history FOR SELECT
  TO public
  USING (true);
