
-- ============ RESOURCES ============
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_node_id UUID NOT NULL REFERENCES public.study_nodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('note', 'pdf', 'word', 'mp4', 'youtube')),
  url TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read resources"
  ON public.resources FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert resources"
  ON public.resources FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update resources"
  ON public.resources FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resources"
  ON public.resources FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

CREATE POLICY "Anyone can read resource files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resources');

CREATE POLICY "Admins can upload resource files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update resource files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resource files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));

-- ============ DOUBTS ============
CREATE TYPE public.doubt_status AS ENUM ('pending', 'replied', 'resolved');

CREATE TABLE public.doubts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  chapter_node_id UUID NOT NULL REFERENCES public.study_nodes(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  status public.doubt_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own doubts"
  ON public.doubts FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all doubts"
  ON public.doubts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can insert own doubts"
  ON public.doubts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Admins can update doubts"
  ON public.doubts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.doubt_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doubt_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doubt participants can read replies"
  ON public.doubt_replies FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.doubts WHERE id = doubt_id AND student_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can insert replies"
  ON public.doubt_replies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TESTS ============
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_node_id UUID NOT NULL REFERENCES public.study_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  timer_minutes INTEGER NOT NULL DEFAULT 30,
  deadline TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read tests"
  ON public.tests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert tests"
  ON public.tests FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tests"
  ON public.tests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tests"
  ON public.tests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.test_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

-- Students can read questions but NOT correct_option (handled in app logic)
CREATE POLICY "Anyone authenticated can read questions"
  ON public.test_questions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert questions"
  ON public.test_questions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions"
  ON public.test_questions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
  ON public.test_questions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.test_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  total INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(test_id, student_id)
);

ALTER TABLE public.test_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own submissions"
  ON public.test_submissions FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all submissions"
  ON public.test_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can insert own submissions"
  ON public.test_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own submissions"
  ON public.test_submissions FOR UPDATE TO authenticated
  USING (auth.uid() = student_id AND submitted_at IS NULL);

-- ============ ASSIGNMENTS ============
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_node_id UUID NOT NULL REFERENCES public.study_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read assignments"
  ON public.assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert assignments"
  ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update assignments"
  ON public.assignments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete assignments"
  ON public.assignments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.assignment_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.assignment_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own completions"
  ON public.assignment_completions FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all completions"
  ON public.assignment_completions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can insert own completions"
  ON public.assignment_completions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own completions"
  ON public.assignment_completions FOR UPDATE TO authenticated
  USING (auth.uid() = student_id);

-- ============ REALTIME FOR DOUBTS ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.doubts;
