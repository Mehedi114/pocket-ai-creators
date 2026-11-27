alter table public.ph_entries drop constraint ph_audio_week_required;
alter table public.ph_entries drop constraint publish_requirements;
alter table public.ph_entries add constraint publish_requirements check (
 status='draft' or (published_at is not null and (
 (kind='blog' and length(trim(title))>0 and reviewed and rights_confirmed and length(trim(body))>0)
 or (kind='audio' and audio_path is not null)
 ))
);
alter table public.ph_entries add constraint ph_audio_optional_dates check (
 kind<>'audio' or week_start is null or week_end is null or week_end>=week_start
);
