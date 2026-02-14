
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📘',
  color TEXT DEFAULT '217 91% 60%',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Study nodes (chapters/topics/subtopics as a self-referencing tree)
CREATE TABLE public.study_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.study_nodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  node_level INT NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.study_nodes ENABLE ROW LEVEL SECURITY;

-- Node progress (per user completion tracking)
CREATE TABLE public.node_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES public.study_nodes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(node_id, user_id)
);
ALTER TABLE public.node_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role on signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subjects
CREATE POLICY "Authenticated can read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert subjects" ON public.subjects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);
CREATE POLICY "Admins can update own subjects" ON public.subjects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);
CREATE POLICY "Admins can delete own subjects" ON public.subjects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

-- RLS Policies for study_nodes
CREATE POLICY "Authenticated can read nodes" ON public.study_nodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert nodes" ON public.study_nodes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update nodes" ON public.study_nodes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete nodes" ON public.study_nodes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for node_progress
CREATE POLICY "Users can read own progress" ON public.node_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all progress" ON public.node_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own progress" ON public.node_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.node_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON public.node_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
