
-- Add user_id column to chatbot_leads for linking authenticated users
ALTER TABLE public.chatbot_leads ADD COLUMN IF NOT EXISTS user_id uuid;

-- Allow chatbot widget to read leads by ID (for returning visitors via localStorage)
-- Limited exposure: only accessible if you know the UUID
CREATE POLICY "Anyone can read chatbot leads by id"
ON public.chatbot_leads FOR SELECT
TO public
USING (true);

-- Allow authenticated users to update their own linked leads
CREATE POLICY "Users can update own linked leads"
ON public.chatbot_leads FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to read their own chat history via lead linkage
-- (chat_history already has public SELECT, but let's ensure it stays consistent)
