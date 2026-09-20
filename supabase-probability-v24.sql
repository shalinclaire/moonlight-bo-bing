alter table public.bobing_results
  add column if not exists original_prize text,
  add column if not exists actual_prize text;

update public.bobing_results
set original_prize = coalesce(original_prize, prize),
    actual_prize = coalesce(actual_prize, prize)
where original_prize is null or actual_prize is null;

create table if not exists public.bobing_shop_inventory (
  shop_code text not null,
  prize text not null,
  prize_rank smallint not null,
  initial_stock integer not null check (initial_stock >= 0),
  remaining_stock integer not null check (remaining_stock >= 0),
  updated_at timestamptz not null default now(),
  primary key (shop_code, prize)
);

alter table public.bobing_shop_inventory enable row level security;
grant select on table public.bobing_shop_inventory to authenticated;

drop policy if exists "bobing admins can read inventory" on public.bobing_shop_inventory;
create policy "bobing admins can read inventory"
on public.bobing_shop_inventory
for select to authenticated
using (public.is_bobing_admin());

create or replace function public.play_bobing(
  p_nickname text,
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
  v_shop text := upper(btrim(p_shop_code));
  v_name text := btrim(p_nickname);
  v_random double precision := random();
  v_original text;
  v_actual text;
  v_rank smallint;
  v_dice jsonb;
  v_message text;
  v_db_prize text;
begin
  if v_name = '' or char_length(v_name) > 30 then raise exception 'INVALID_NICKNAME'; end if;
  if v_shop = '' or char_length(v_shop) > 30 then raise exception 'INVALID_SHOP_CODE'; end if;

  insert into public.bobing_shop_inventory
    (shop_code, prize, prize_rank, initial_stock, remaining_stock)
  values
    (v_shop, '状元', 1, 3, 3),
    (v_shop, '对堂', 2, 5, 5),
    (v_shop, '三红', 3, 10, 10),
    (v_shop, '四进', 4, 12, 12),
    (v_shop, '二举', 5, 15, 15),
    (v_shop, '一秀', 6, 25, 25)
  on conflict (shop_code, prize) do nothing;

  if v_random < 0.0200000000 then v_original := '状元'; v_rank := 1; v_dice := '[4,4,4,4,2,6]'::jsonb;
  elsif v_random < 0.0533333333 then v_original := '对堂'; v_rank := 2; v_dice := '[1,2,3,4,5,6]'::jsonb;
  elsif v_random < 0.1200000000 then v_original := '三红'; v_rank := 3; v_dice := '[4,4,4,1,2,6]'::jsonb;
  elsif v_random < 0.2000000000 then v_original := '四进'; v_rank := 4; v_dice := '[2,2,2,2,3,5]'::jsonb;
  elsif v_random < 0.3000000000 then v_original := '二举'; v_rank := 5; v_dice := '[4,4,1,2,3,6]'::jsonb;
  elsif v_random < 0.4666666667 then v_original := '一秀'; v_rank := 6; v_dice := '[4,1,2,3,5,6]'::jsonb;
  else v_original := '未中奖'; v_rank := null; v_dice := '[1,1,2,2,3,5]'::jsonb;
  end if;

  if v_rank is not null then
    select prize into v_actual
    from public.bobing_shop_inventory
    where shop_code = v_shop and prize_rank >= v_rank and remaining_stock > 0
    order by prize_rank
    for update
    limit 1;

    if v_actual is not null then
      update public.bobing_shop_inventory
      set remaining_stock = remaining_stock - 1, updated_at = now()
      where shop_code = v_shop and prize = v_actual;
    else
      v_actual := '奖品已领完';
    end if;
  else
    v_actual := '未中奖';
  end if;

  v_db_prize := case when v_actual in ('未中奖','奖品已领完') then '再接再厉' else v_actual end;
  v_message := case
    when v_actual = '未中奖' then '好彩在下一把，继续博！'
    when v_actual = '奖品已领完' then '本店奖品已全部领完'
    when v_actual <> v_original then '原中' || v_original || '，库存顺延领取' || v_actual
    else '恭喜获得' || v_actual || '奖品！'
  end;

  insert into public.bobing_results
    (nickname, shop_code, device_id, dice, prize, message, page_version, original_prize, actual_prize)
  values
    (v_name, v_shop, p_device_id, v_dice, v_db_prize, v_message, p_page_version, v_original, v_actual);

  return jsonb_build_object(
    'dice', v_dice,
    'original_prize', v_original,
    'actual_prize', v_actual,
    'display_prize', v_db_prize,
    'message', v_message
  );
end;
$$;

revoke all on function public.play_bobing(text,text,text,text) from public;
grant execute on function public.play_bobing(text,text,text,text) to anon, authenticated;
revoke insert on table public.bobing_results from anon, authenticated;
