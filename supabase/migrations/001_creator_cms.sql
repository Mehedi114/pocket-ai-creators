-- Owner identity is checked from confirmed Auth records, not editable user metadata.
create function public.ph_is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users where id=auth.uid() and lower(email)='mdmahedulislammehedi@gmail.com' and email_confirmed_at is not null and deleted_at is null);
$$;
revoke all on function public.ph_is_admin() from public;
grant execute on function public.ph_is_admin() to anon, authenticated;
create table public.ph_entries (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('blog','audio')),
 title text not null default '' check(length(title)<=200),
 summary text not null default '' check(length(summary)<=1000),
 body text not null default '' check(length(body)<=100000),
 topic text not null default 'General' check(length(topic)<=100),
 status text not null default 'draft' check(status in ('draft','published')),
 audio_path text, slides_path text, cover_path text,
 week_start date, week_end date,
 sources jsonb not null default '[]' check(jsonb_typeof(sources)='array'),
 reviewed boolean not null default false,
 rights_confirmed boolean not null default false,
 reviewed_by text not null default 'Md Mahedul Islam Mehedi',
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint path_ownership check (
 (audio_path is null or audio_path like id::text || '/%') and
 (slides_path is null or slides_path like id::text || '/%') and
 (cover_path is null or cover_path like id::text || '/%')),
 constraint publish_requirements check (status='draft' or (
 length(trim(title))>0 and reviewed and rights_confirmed and published_at is not null and
 ((kind='blog' and length(trim(body))>0) or (kind='audio' and audio_path is not null and week_start is not null and week_end>=week_start and jsonb_array_length(sources)>0))))
);
alter table public.ph_entries enable row level security;
revoke all on public.ph_entries from anon,authenticated;
grant select on public.ph_entries to anon,authenticated;
grant insert,update,delete on public.ph_entries to authenticated;
create policy ph_public_read on public.ph_entries for select to anon,authenticated using (status='published');
create policy ph_owner_all on public.ph_entries for all to authenticated using (public.ph_is_admin()) with check (public.ph_is_admin());
create function public.ph_touch_entry() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=clock_timestamp(); return new; end; $$;
create trigger ph_touch before update on public.ph_entries for each row execute function public.ph_touch_entry();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('ph-media','ph-media',false,20971520,array['audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/x-wav','audio/ogg','application/pdf','image/jpeg','image/png','image/webp']);
create policy ph_owner_storage on storage.objects for all to authenticated using(bucket_id='ph-media' and public.ph_is_admin()) with check(bucket_id='ph-media' and public.ph_is_admin());
create policy ph_published_storage on storage.objects for select to anon,authenticated using(bucket_id='ph-media' and exists(select 1 from public.ph_entries e where e.status='published' and storage.objects.name in (e.audio_path,e.slides_path,e.cover_path)));
create index ph_entries_public_order on public.ph_entries(status,kind,published_at desc);

alter table public.ph_entries add constraint ph_audio_week_required check (status <> 'published' or kind <> 'audio' or week_end is not null);
