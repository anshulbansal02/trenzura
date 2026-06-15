alter table public.orders
  add column if not exists whatsapp_updates_opt_in boolean not null default false;

create or replace view public.ops_orders_recent as
select
  o.order_number,
  o.status as order_status,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.total_amount_paise,
  o.currency,
  p.status as payment_status,
  s.status as shipment_status,
  s.tracking_number,
  o.created_at,
  o.whatsapp_updates_opt_in
from public.orders o
left join public.payments p on p.order_id = o.id
left join public.shipments s on s.order_id = o.id
order by o.created_at desc;
