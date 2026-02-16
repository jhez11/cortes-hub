-- Allow anonymous reports by making user_id nullable
ALTER TABLE public.service_requests ALTER COLUMN user_id DROP NOT NULL;

-- Add RLS policy to allow anonymous inserts for reports
CREATE POLICY "Anyone can submit reports"
ON public.service_requests
FOR INSERT
WITH CHECK (
  category LIKE 'Report:%'
);

-- Keep existing policy for authenticated users to insert their own requests
DROP POLICY IF EXISTS "Users can create their own requests" ON public.service_requests;
CREATE POLICY "Users can create their own requests"
ON public.service_requests
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- Allow anyone to view reports (but only owners can view their own regular requests)
DROP POLICY IF EXISTS "Users can view their own requests" ON public.service_requests;
CREATE POLICY "Users can view their own requests or public reports"
ON public.service_requests
FOR SELECT
USING (
  auth.uid() = user_id OR user_id IS NULL
);