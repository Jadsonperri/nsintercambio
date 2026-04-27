CREATE UNIQUE INDEX IF NOT EXISTS universities_name_country_state_uniq
  ON public.universities (name, country, state);