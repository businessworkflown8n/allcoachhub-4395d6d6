-- Add channel type to campaigns for WhatsApp/SMS support
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email';

-- Add template_html column for HTML template uploads
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS template_html text;

-- WhatsApp/SMS campaigns table (reuse email_campaigns with channel field)
-- Add phone column to email_contacts if missing
ALTER TABLE public.email_contacts ADD COLUMN IF NOT EXISTS whatsapp_number text;