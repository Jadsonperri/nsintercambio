CREATE TABLE public.pipeline_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.pipeline(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipeline_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own pipeline history" ON public.pipeline_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pipeline history" ON public.pipeline_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_pipeline_history_pipeline ON public.pipeline_history(pipeline_id, created_at DESC);