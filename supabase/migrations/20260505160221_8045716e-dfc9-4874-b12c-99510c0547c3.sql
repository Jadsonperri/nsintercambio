
-- Deadlines (user-managed events)
CREATE TABLE public.deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deadlines_own_select" ON public.deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "deadlines_own_insert" ON public.deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deadlines_own_update" ON public.deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deadlines_own_delete" ON public.deadlines FOR DELETE USING (auth.uid() = user_id);

-- Documents (user-managed, optionally tied to a university)
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  name text NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_own_select" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_own_insert" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_own_update" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "documents_own_delete" ON public.documents FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_deadlines_user ON public.deadlines(user_id, date);
CREATE INDEX idx_documents_user_uni ON public.documents(user_id, university_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_deadlines_touch BEFORE UPDATE ON public.deadlines
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_documents_touch BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
