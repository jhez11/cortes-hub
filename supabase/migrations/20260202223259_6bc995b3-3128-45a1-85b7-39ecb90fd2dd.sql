-- Create likes table for community reports
CREATE TABLE public.report_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(report_id, user_id),
  UNIQUE(report_id, session_id)
);

-- Enable RLS
ALTER TABLE public.report_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes count
CREATE POLICY "Anyone can view likes"
ON public.report_likes
FOR SELECT
USING (true);

-- Authenticated users can like reports
CREATE POLICY "Authenticated users can like reports"
ON public.report_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- Users can remove their own likes
CREATE POLICY "Users can remove their own likes"
ON public.report_likes
FOR DELETE
USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- Add index for performance
CREATE INDEX idx_report_likes_report_id ON public.report_likes(report_id);