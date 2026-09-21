create or replace function public.get_recent_bobing_results(p_limit integer default 20)
returns table (
  created_at timestamptz,
  nickname text,
  prize text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.created_at,
    case
      when b.phone ~ '^[0-9]{11}$'
        then left(b.phone, 3) || '****' || right(b.phone, 4)
      else '号码未登记'
    end as nickname,
    b.prize
  from public.bobing_results as b
  where b.prize <> '再接再厉'
  order by b.created_at desc
  limit least(greatest(p_limit, 1), 30);
$$;

revoke all on function public.get_recent_bobing_results(integer) from public;
grant execute on function public.get_recent_bobing_results(integer) to anon, authenticated;
