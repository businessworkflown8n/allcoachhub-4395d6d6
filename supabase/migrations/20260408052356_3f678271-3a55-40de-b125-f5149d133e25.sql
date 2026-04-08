
-- Enable RLS on all new tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- SERVICES
CREATE POLICY "Public can view published services" ON public.services FOR SELECT USING (is_published = true);
CREATE POLICY "Coaches manage own services" ON public.services FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Admins manage all services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COURSE MODULES
CREATE POLICY "Public can view published modules" ON public.course_modules FOR SELECT USING (is_published = true);
CREATE POLICY "Coaches manage own course modules" ON public.course_modules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_modules.course_id AND courses.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_modules.course_id AND courses.coach_id = auth.uid()));

-- COURSE LESSONS
CREATE POLICY "Public can view published lessons" ON public.course_lessons FOR SELECT USING (is_published = true);
CREATE POLICY "Coaches manage own lessons" ON public.course_lessons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_modules cm JOIN public.courses c ON c.id = cm.course_id WHERE cm.id = course_lessons.module_id AND c.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.course_modules cm JOIN public.courses c ON c.id = cm.course_id WHERE cm.id = course_lessons.module_id AND c.coach_id = auth.uid()));

-- QUIZZES
CREATE POLICY "Public can view published quizzes" ON public.quizzes FOR SELECT USING (is_published = true);
CREATE POLICY "Coaches manage own quizzes" ON public.quizzes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = quizzes.course_id AND courses.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = quizzes.course_id AND courses.coach_id = auth.uid()));

-- QUIZ QUESTIONS
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches manage own quiz questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id WHERE q.id = quiz_questions.quiz_id AND c.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id WHERE q.id = quiz_questions.quiz_id AND c.coach_id = auth.uid()));

-- QUIZ ATTEMPTS
CREATE POLICY "Users manage own quiz attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Coaches view attempts for their quizzes" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id WHERE q.id = quiz_attempts.quiz_id AND c.coach_id = auth.uid()));

-- ASSIGNMENTS
CREATE POLICY "Authenticated can view published assignments" ON public.assignments FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Coaches manage own assignments" ON public.assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = assignments.course_id AND courses.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = assignments.course_id AND courses.coach_id = auth.uid()));

-- ASSIGNMENT SUBMISSIONS
CREATE POLICY "Users manage own submissions" ON public.assignment_submissions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Coaches view submissions for their assignments" ON public.assignment_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id WHERE a.id = assignment_submissions.assignment_id AND c.coach_id = auth.uid()));

-- MEMBERSHIPS
CREATE POLICY "Public can view active memberships" ON public.memberships FOR SELECT USING (is_active = true);
CREATE POLICY "Coaches manage own memberships" ON public.memberships FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- MEMBERSHIP SUBSCRIPTIONS
CREATE POLICY "Users manage own subscriptions" ON public.membership_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Coaches view subscriptions to their memberships" ON public.membership_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.id = membership_subscriptions.membership_id AND memberships.coach_id = auth.uid()));

-- CERTIFICATE TEMPLATES
CREATE POLICY "Public can view active templates" ON public.certificate_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Coaches manage own templates" ON public.certificate_templates FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- ISSUED CERTIFICATES
CREATE POLICY "Users view own certificates" ON public.issued_certificates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Coaches manage certificates for their templates" ON public.issued_certificates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.certificate_templates ct WHERE ct.id = issued_certificates.template_id AND ct.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.certificate_templates ct WHERE ct.id = issued_certificates.template_id AND ct.coach_id = auth.uid()));

-- MESSAGES
CREATE POLICY "Users view own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users update own received messages" ON public.messages FOR UPDATE TO authenticated USING (receiver_id = auth.uid());

-- TRANSACTIONS
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR coach_id = auth.uid());
CREATE POLICY "Admins view all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage transactions" ON public.transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- LANDING PAGES
CREATE POLICY "Public can view published pages" ON public.landing_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Coaches manage own pages" ON public.landing_pages FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- APPROVAL REQUESTS
CREATE POLICY "Coaches view own requests" ON public.approval_requests FOR SELECT TO authenticated USING (coach_id = auth.uid());
CREATE POLICY "Coaches create requests" ON public.approval_requests FOR INSERT TO authenticated WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Admins manage all requests" ON public.approval_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- MODERATION LOGS
CREATE POLICY "Admins manage moderation logs" ON public.moderation_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AUTOMATION RULES
CREATE POLICY "Coaches manage own rules" ON public.automation_rules FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Admins manage all rules" ON public.automation_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ANALYTICS EVENTS
CREATE POLICY "Anyone can insert events" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users view own events" ON public.analytics_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR coach_id = auth.uid());
CREATE POLICY "Admins view all events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PERMISSIONS
CREATE POLICY "Admins manage permissions" ON public.permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
