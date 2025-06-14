
-- Change user_id in user_activity_log from integer to uuid and add FK to users(id)
ALTER TABLE public.user_activity_log
  ALTER COLUMN user_id TYPE uuid USING user_id::text::uuid;

ALTER TABLE public.user_activity_log
  ADD CONSTRAINT user_activity_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id);
