-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Storage policies for uploads bucket
CREATE POLICY "Anyone can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create tourist_spots table
CREATE TABLE public.tourist_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  municipality TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on tourist_spots
ALTER TABLE public.tourist_spots ENABLE ROW LEVEL SECURITY;

-- RLS policies for tourist_spots
CREATE POLICY "Anyone can view active tourist spots" ON public.tourist_spots FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tourist spots" ON public.tourist_spots FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_tourist_spots_updated_at BEFORE UPDATE ON public.tourist_spots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_login_activity table for tracking
CREATE TABLE public.user_login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on login activity
ALTER TABLE public.user_login_activity ENABLE ROW LEVEL SECURITY;

-- Only admins can view login activity
CREATE POLICY "Admins can view login activity" ON public.user_login_activity FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert login activity" ON public.user_login_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for tourist_spots
ALTER PUBLICATION supabase_realtime ADD TABLE public.tourist_spots;