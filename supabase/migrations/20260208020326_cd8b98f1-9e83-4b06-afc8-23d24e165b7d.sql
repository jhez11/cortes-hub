-- Create enum for post types
CREATE TYPE public.post_type AS ENUM ('report', 'announcement', 'project');

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  post_type public.post_type NOT NULL DEFAULT 'report',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_like UNIQUE (post_id, user_id),
  CONSTRAINT unique_session_like UNIQUE (post_id, session_id)
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Posts RLS Policies
-- Anyone can view all posts (public feed)
CREATE POLICY "Anyone can view posts"
ON public.posts
FOR SELECT
USING (true);

-- Anyone can create anonymous reports
CREATE POLICY "Anyone can create anonymous reports"
ON public.posts
FOR INSERT
WITH CHECK (post_type = 'report' AND is_anonymous = true);

-- Authenticated users can create their own posts
CREATE POLICY "Users can create their own posts"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Admins can manage all posts
CREATE POLICY "Admins can update all posts"
ON public.posts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts"
ON public.posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Post Likes RLS Policies
-- Anyone can view likes
CREATE POLICY "Anyone can view post likes"
ON public.post_likes
FOR SELECT
USING (true);

-- Authenticated users can like posts
CREATE POLICY "Users can like posts"
ON public.post_likes
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL AND session_id IS NOT NULL));

-- Users can remove their own likes
CREATE POLICY "Users can remove their own likes"
ON public.post_likes
FOR DELETE
USING ((auth.uid() = user_id) OR (user_id IS NULL AND session_id IS NOT NULL));

-- Create updated_at trigger for posts
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();