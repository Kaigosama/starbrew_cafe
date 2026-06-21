create or replace function public.notify_baristas_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  barista_token text;
begin
  for barista_token in
    select push_token from public.users
    where role = 'barista' and push_token is not null
  loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'to', barista_token,
        'title', 'New order received',
        'body', 'Queue #' || new.queue_position || ' just came in.',
        'sound', 'default',
        'data', jsonb_build_object('orderId', new.id)
      )
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_baristas_new_order on public.orders;

create trigger trg_notify_baristas_new_order
after insert on public.orders
for each row
execute function public.notify_baristas_new_order();
