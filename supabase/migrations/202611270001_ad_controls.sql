-- Only public booleans; publisher code and secrets cannot be edited here.
create table public.ph_ad_settings (
 id boolean primary key default true check (id = true),
 enabled boolean not null default true,
 banner boolean not null default true,
 popunder boolean not null default true,
 social boolean not null default true
);
insert into public.ph_ad_settings (id) values (true);
alter table public.ph_ad_settings enable row level security;
revoke all on public.ph_ad_settings from anon, authenticated;
grant select on public.ph_ad_settings to anon, authenticated;
grant update (enabled,banner,popunder,social) on public.ph_ad_settings to authenticated;
create policy ph_ads_public_read on public.ph_ad_settings for select to anon,authenticated using (true);
create policy ph_ads_owner_update on public.ph_ad_settings for update to authenticated using (public.ph_is_admin()) with check (public.ph_is_admin());
