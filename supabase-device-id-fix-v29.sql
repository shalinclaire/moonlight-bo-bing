-- Keep existing device identifiers while allowing the browser RPC to store them safely.
alter table public.bobing_results
  alter column device_id type text
  using device_id::text;
