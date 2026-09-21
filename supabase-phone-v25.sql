alter table public.bobing_results
  add column if not exists phone text;

create index if not exists bobing_results_phone_created_at_idx
  on public.bobing_results (phone, created_at desc);

create or replace function public.play_bobing_v25(
  p_nickname text,
  p_phone text,
  p_shop_code text,
  p_device_id text,
  p_page_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_result jsonb;
begin
  if v_phone !~ '^1[3-9][0-9]{9}$' then
    raise exception 'INVALID_PHONE';
  end if;

  v_result := public.play_bobing(
    p_nickname,
    p_shop_code,
    p_device_id,
    p_page_version
  );

  update public.bobing_results
  set phone = v_phone
  where id = (
    select id
    from public.bobing_results
    where device_id = p_device_id
      and nickname = btrim(p_nickname)
      and shop_code = upper(btrim(p_shop_code))
      and phone is null
    order by created_at desc
    limit 1
  );

  return v_result;
end;
$$;

revoke all on function public.play_bobing_v25(text,text,text,text,text) from public;
grant execute on function public.play_bobing_v25(text,text,text,text,text) to anon, authenticated;
