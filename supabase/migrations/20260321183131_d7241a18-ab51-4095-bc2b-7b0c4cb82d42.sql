
-- Community Topics / Spaces
CREATE TABLE public.community_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'MessageSquare',
  member_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active topics" ON public.community_topics FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage topics" ON public.community_topics FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Posts (discussions, announcements)
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  topic_id UUID REFERENCES public.community_topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'discussion',
  author_role TEXT NOT NULL DEFAULT 'learner',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published',
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view published posts" ON public.community_posts FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage all posts" ON public.community_posts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Comments
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'learner',
  like_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view comments" ON public.community_comments FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Users can create comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON public.community_comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage comments" ON public.community_comments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Reactions
CREATE TABLE public.community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reactions" ON public.community_reactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone authed can view reactions" ON public.community_reactions FOR SELECT TO authenticated USING (true);

-- Ask a Coach Questions
CREATE TABLE public.community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  topic_id UUID REFERENCES public.community_topics(id) ON DELETE SET NULL,
  skill_level TEXT NOT NULL DEFAULT 'beginner',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  answer_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view questions" ON public.community_questions FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Users can create questions" ON public.community_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own questions" ON public.community_questions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage questions" ON public.community_questions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Answers
CREATE TABLE public.community_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.community_questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  answer_text TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'learner',
  is_best_answer BOOLEAN NOT NULL DEFAULT false,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view answers" ON public.community_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create answers" ON public.community_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own answers" ON public.community_answers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage answers" ON public.community_answers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Prompt Library
CREATE TABLE public.prompt_library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT,
  prompt_text TEXT NOT NULL,
  use_case TEXT,
  author_role TEXT NOT NULL DEFAULT 'learner',
  visibility TEXT NOT NULL DEFAULT 'public',
  likes_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  copies_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_library_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view published prompts" ON public.prompt_library_items FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Users can create prompts" ON public.prompt_library_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts" ON public.prompt_library_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage prompts" ON public.prompt_library_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Events
CREATE TABLE public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  host_id UUID NOT NULL,
  host_name TEXT,
  event_type TEXT NOT NULL DEFAULT 'webinar',
  access_type TEXT NOT NULL DEFAULT 'public',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  meeting_url TEXT,
  replay_url TEXT,
  capacity INTEGER,
  registered_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view events" ON public.community_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches can create events" ON public.community_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Coaches can update own events" ON public.community_events FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Admins can manage events" ON public.community_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Event Registrations
CREATE TABLE public.community_event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.community_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.community_event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own registrations" ON public.community_event_registrations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone authed can view registrations" ON public.community_event_registrations FOR SELECT TO authenticated USING (true);

-- Private Groups
CREATE TABLE public.private_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'request',
  max_members INTEGER DEFAULT 50,
  member_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.private_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view active groups" ON public.private_groups FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Coaches can create groups" ON public.private_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own groups" ON public.private_groups FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage groups" ON public.private_groups FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Private Group Members
CREATE TABLE public.private_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.private_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.private_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own membership" ON public.private_group_members FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Group creators can manage members" ON public.private_group_members FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.private_groups WHERE id = group_id AND created_by = auth.uid()));
CREATE POLICY "Anyone authed can view members" ON public.private_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage members" ON public.private_group_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Badges
CREATE TABLE public.community_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'Award',
  color TEXT DEFAULT 'primary',
  criteria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view badges" ON public.community_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage badges" ON public.community_badges FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- User Badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID REFERENCES public.community_badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view user badges" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage user badges" ON public.user_badges FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Reports
CREATE TABLE public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON public.community_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Users can view own reports" ON public.community_reports FOR SELECT TO authenticated USING (auth.uid() = reported_by);
CREATE POLICY "Admins can manage reports" ON public.community_reports FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Bookmarks
CREATE TABLE public.community_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);
ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks" ON public.community_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Community Topic Memberships
CREATE TABLE public.community_topic_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.community_topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id, user_id)
);
ALTER TABLE public.community_topic_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own memberships" ON public.community_topic_members FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone authed can view memberships" ON public.community_topic_members FOR SELECT TO authenticated USING (true);
