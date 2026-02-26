UPDATE public.profiles p
SET 
  contact_number = COALESCE(p.contact_number, (SELECT raw_user_meta_data->>'mobile' FROM auth.users WHERE id = p.user_id)),
  company_name = COALESCE(p.company_name, (SELECT raw_user_meta_data->>'company_name' FROM auth.users WHERE id = p.user_id))
WHERE p.contact_number IS NULL OR p.company_name IS NULL;